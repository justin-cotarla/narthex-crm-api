import { ForbiddenError, UserInputError } from 'apollo-server-errors';
import { PoolConfig } from 'mysql';

import { ClientToken } from '../types/auth';
import { DBClient } from '../types/database';
import { Client } from '../types/generated/graphql';
import { generateClientToken, hashPassword, verifyHash } from '../util/crypto';
import { NotFoundError } from '../util/error';
import { mapClient } from '../util/mappers';
import { validateEmail } from '../util/validation';

import { MySqlDataSource } from './MySqlDataSource';

class NarthexCrmDbDataSource extends MySqlDataSource {
    constructor(mySqlConfig: PoolConfig) {
        super(mySqlConfig);
    }

    private logClientConnection = async (clientId: number) => {
        const sql = `
            UPDATE client
            SET
                last_login_timestamp = CURRENT_TIMESTAMP
            WHERE
                 id = ?
        `;

        const rows = await this.query<{ changedRows: number }>({
            sql,
            values: [clientId],
        });

        if (!rows || rows.changedRows === 0) {
            console.error('Could not log client connections');
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

        const sql = `
            INSERT INTO client
                (email_address, pass_hash)
            VALUES
                (?, ?)
        `;

        const rows = await this.query<{ insertId: number }>({
            sql,
            values: [emailAddress, passwordHash],
        });

        if (!rows) {
            throw new Error('Could not add client');
        }

        return rows.insertId;
    };

    getClients = async (clientIds?: number[]): Promise<Client[]> => {
        const sql = `
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
        `;

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
        const rows = await this.query<DBClient[]>({
            sql: `
                SELECT id, email_address, permission_scope, active, pass_hash
                FROM
                client
                WHERE
                    email_address LIKE ?
            `,
            values: [emailAddress],
        });

        if (!rows || rows.length === 0) {
            throw new NotFoundError('Account does not exist');
        }

        const [{ id, active, email_address, permission_scope, pass_hash }] =
            rows;

        const isAuthenticated = await verifyHash(password, pass_hash);

        if (!isAuthenticated) {
            throw new ForbiddenError('Not authorized');
        }

        if (active === 0) {
            throw new ForbiddenError('Account deactivated');
        }

        const tokenPayload: ClientToken = {
            id,
            emailAddress: email_address,
            permissionScope: permission_scope,
        };

        await this.logClientConnection(id);

        return generateClientToken(tokenPayload, jwtSecret);
    };
}

export { NarthexCrmDbDataSource };
