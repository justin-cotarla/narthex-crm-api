import { ForbiddenError, UserInputError } from 'apollo-server-errors';
import { PoolConfig } from 'mysql';
import { format as sqlFormat } from 'sql-formatter';

import { ClientToken } from '../types/auth';
import {
    DBClient,
    DBInsertResponse,
    DBMinistry,
    DBUpdateResponse,
} from '../types/database';
import {
    Client,
    ClientUpdateInput,
    Ministry,
    MinistryAddInput,
} from '../types/generated/graphql';
import { generateClientToken, hashPassword, verifyHash } from '../util/crypto';
import { DatabaseError, NotFoundError } from '../util/error';
import { mapClient, mapMinistry } from '../util/mappers';
import { buildSetClause, buildWhereClause } from '../util/query';
import {
    validateColor,
    validateEmail,
    validateRecordName,
} from '../util/validation';

import { MySqlDataSource } from './MySqlDataSource';

class NarthexCrmDbDataSource extends MySqlDataSource {
    constructor(mySqlConfig: PoolConfig) {
        super(mySqlConfig);
    }

    private logClientConnection = async (clientId: number) => {
        const sql = sqlFormat(`
            UPDATE client
            SET
                last_login_timestamp = CURRENT_TIMESTAMP
            WHERE
                 id = ?
        `);

        const rows = await this.query<DBUpdateResponse>({
            sql,
            values: [clientId],
        });

        if (!rows || rows.changedRows === 0) {
            this.context!.logger.error('Could not log client connections');
        }
    };

    addClient = async (
        emailAddress: string,
        password: string
    ): Promise<number> => {
        if (!validateEmail(emailAddress)) {
            throw new UserInputError('Malformed Email');
        }

        const passwordHash = await hashPassword(password);

        const sql = sqlFormat(`
            INSERT INTO client
                (email_address, pass_hash)
            VALUES
                (?, ?)
        `);

        const rows = await this.query<DBInsertResponse>({
            sql,
            values: [emailAddress, passwordHash],
        });

        if (!rows) {
            throw new Error('Could not add client');
        }

        return rows.insertId;
    };

    getClients = async (clientIds?: number[]): Promise<Client[]> => {
        const sql = sqlFormat(`
            SELECT
                id,
                email_address,
                creation_timestamp,
                permission_scope,
                last_login_timestamp,
                active
            FROM
            client
                ${clientIds ? 'WHERE id in (?)' : ''}
        `);

        const rows = await this.query<DBClient[]>({
            sql,
            ...(clientIds ? { values: [clientIds] } : {}),
        });

        if (!rows || rows.length === 0) {
            throw new NotFoundError('Client does not exist');
        }

        return rows.map(mapClient);
    };

    getToken = async (
        emailAddress: string,
        password: string,
        jwtSecret: string
    ): Promise<string> => {
        const sql = sqlFormat(`
            SELECT id, email_address, permission_scope, active, pass_hash
            FROM
            client
            WHERE
                email_address LIKE ?
        `);

        const rows = await this.query<DBClient[]>({
            sql,
            values: [emailAddress],
        });

        if (!rows || rows.length === 0) {
            throw new NotFoundError('Account does not exist');
        }

        const [{ id, active, email_address, permission_scope, pass_hash }] =
            rows;

        const isAuthenticated = await verifyHash(password, pass_hash!);

        if (!isAuthenticated) {
            throw new ForbiddenError('Not authorized');
        }

        if (active === 0) {
            throw new ForbiddenError('Account deactivated');
        }

        const tokenPayload: ClientToken = {
            id,
            emailAddress: email_address!,
            permissionScope: permission_scope!,
        };

        await this.logClientConnection(id);

        return generateClientToken(tokenPayload, jwtSecret);
    };

    updateClient = async (
        clientUpdateInput: ClientUpdateInput
    ): Promise<void> => {
        if (Object.keys(clientUpdateInput).length <= 1) {
            throw new UserInputError('Nothing to update');
        }

        const { id, active, password } = clientUpdateInput;

        const setClause = buildSetClause({
            pass_hash: password,
            active,
        });

        const sql = sqlFormat(`
            UPDATE client
            SET
            ${setClause}
            WHERE ID = ?;
        `);

        const values = [
            ...(password ? [await hashPassword(password)] : []),
            ...(active !== undefined ? [Number(active)] : []),
            id,
        ];

        const rows = await this.query<DBUpdateResponse>({
            sql,
            values,
        });

        if (!rows || rows.affectedRows === 0) {
            throw new DatabaseError('Could not update client');
        }
    };

    getMinistries = async (
        ministryIds: number[],
        archived?: boolean | null
    ): Promise<Ministry[]> => {
        const whereClause = buildWhereClause([
            { clause: 'id in (?)', condition: ministryIds?.length !== 0 },
            { clause: 'archived <> 1', condition: !archived },
        ]);

        const sql = sqlFormat(`
            SELECT
                id,
                name,
                color,
                created_by,
                creation_timestamp,
                modified_by,
                modification_timestamp,
                archived
            FROM
            ministry
            ${whereClause}
        `);

        const values = [...(ministryIds.length !== 0 ? [ministryIds] : [])];

        const rows = await this.query<DBMinistry[]>({
            sql,
            values,
        });

        if (!rows || rows.length === 0) {
            throw new NotFoundError('Ministry does not exist');
        }

        return rows.map(mapMinistry);
    };

    addMinistry = async (
        ministryAddInput: MinistryAddInput,
        clientId: number
    ): Promise<number> => {
        const { name, color = '#B3BFB8' } = ministryAddInput;

        if (!validateColor(color!)) {
            throw new UserInputError('Invalid color');
        }

        if (!validateRecordName(name)) {
            throw new UserInputError('Invalid ministry name');
        }

        const sql = sqlFormat(`
            INSERT INTO ministry
                (name, color, created_by, modified_by)
            VALUES
                (?, ?, ?, ?)
        `);

        const rows = await this.query<DBInsertResponse>({
            sql,
            values: [
                name,
                parseInt(color!.substring(1), 16),
                clientId,
                clientId,
            ],
        });

        if (!rows) {
            throw new Error('Could not add ministry');
        }

        return rows.insertId;
    };
}

export { NarthexCrmDbDataSource };
