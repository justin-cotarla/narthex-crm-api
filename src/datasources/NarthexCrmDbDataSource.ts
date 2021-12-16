import { ForbiddenError } from 'apollo-server-errors';
import { PoolConfig } from 'mysql';

import { ClientToken } from '../types/auth';
import { generateClientToken, hashPassword, verifyHash } from '../util/crypto';

import { MySqlDataSource } from './MySqlDataSource';

class NarthexCrmDbDataSource extends MySqlDataSource {
    constructor(mySqlConfig: PoolConfig) {
        super(mySqlConfig);
    }

    addClient = async (
        emailAddress: string,
        password: string
    ): Promise<number> => {
        const passwordHash = await hashPassword(password);

        const result = await this.query<{ insertId: number }>({
            sql: `
                INSERT INTO client
                    (email_address, pass_hash)
                VALUES
                    (?, ?)
            `,
            values: [emailAddress, passwordHash],
        });

        if (!result) {
            throw new Error('Could not add client');
        }

        return result.insertId;
    };

    getToken = async (
        emailAddress: string,
        password: string,
        jwtSecret: string
    ): Promise<string> => {
        const result = await this.query<
            {
                id: number;
                email_address: string;
                permission_scope: string;
                active: number;
                pass_hash: string;
            }[]
        >({
            sql: `
                SELECT id, email_address, permission_scope, active, pass_hash
                FROM
                client
                WHERE
                    email_address LIKE ?
            `,
            values: [emailAddress],
        });

        if (!result || result.length === 0) {
            throw new ForbiddenError('Account does not exist');
        }

        const [{ id, active, email_address, permission_scope, pass_hash }] =
            result;

        if (active === 0) {
            throw new ForbiddenError('Account deactivated');
        }

        const isAuthenticated = await verifyHash(password, pass_hash);

        if (!isAuthenticated) {
            throw new ForbiddenError('Not authorized');
        }

        const tokenPayload: ClientToken = {
            id,
            emailAddress: email_address,
            permissionScope: permission_scope,
        };

        return generateClientToken(tokenPayload, jwtSecret);
    };
}

export { NarthexCrmDbDataSource };
