import { UserInputError, ForbiddenError } from 'apollo-server';
import { format as sqlFormat } from 'sql-formatter';

import { ClientToken } from '../../types/auth';
import {
    DBInsertResponse,
    DBClient,
    DBUpdateResponse,
} from '../../types/database';
import { Client, ClientUpdateInput } from '../../types/generated/graphql';
import {
    hashPassword,
    verifyHash,
    generateClientToken,
} from '../../util/crypto';
import { NotFoundError, DatabaseError } from '../../util/error';
import { mapClient } from '../../util/mappers';
import { buildWhereClause, buildSetClause } from '../../util/query';
import { validateEmail } from '../../util/validation';
import { MySqlDataSource } from '../MySqlDataSource';

import { NarthexCrmDbDataSource } from '.';

const addClient = async (
    query: MySqlDataSource['query'],
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

    const rows = await query<DBInsertResponse>({
        sql,
        values: [emailAddress, passwordHash],
    });

    if (!rows) {
        throw new Error('Could not add client');
    }

    return rows.insertId;
};

const getClients = async (
    query: MySqlDataSource['query'],
    clientIds: number[]
): Promise<Client[]> => {
    const whereClause = buildWhereClause([
        { clause: 'id in (?)', condition: clientIds?.length !== 0 },
    ]);

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
            ${whereClause}
    `);

    const values = [...(clientIds.length !== 0 ? [clientIds] : [])];

    const rows = await query<DBClient[]>({
        sql,
        values,
    });

    return rows?.map(mapClient) ?? [];
};

const getToken = async (
    query: MySqlDataSource['query'],
    logClientConnection: NarthexCrmDbDataSource['logClientConnection'],
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

    const rows = await query<DBClient[]>({
        sql,
        values: [emailAddress],
    });

    if (!rows || rows.length === 0) {
        throw new NotFoundError('Account does not exist');
    }

    const [{ id, active, email_address, permission_scope, pass_hash }] = rows;

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

    await logClientConnection(id);

    return generateClientToken(tokenPayload, jwtSecret);
};

const updateClient = async (
    query: MySqlDataSource['query'],
    clientUpdateInput: ClientUpdateInput
): Promise<void> => {
    if (Object.keys(clientUpdateInput).length <= 1) {
        throw new UserInputError('Nothing to update');
    }

    const { id, active, password } = clientUpdateInput;

    const setClause = buildSetClause([
        { key: 'pass_hash', condition: password !== undefined },
        { key: 'active', condition: active !== undefined },
    ]);

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

    const rows = await query<DBUpdateResponse>({
        sql,
        values,
    });

    if (!rows || rows.affectedRows === 0) {
        throw new DatabaseError('Could not update client');
    }
};

export { addClient, updateClient, getClients, getToken };
