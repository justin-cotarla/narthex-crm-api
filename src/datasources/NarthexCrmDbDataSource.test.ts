import { ForbiddenError, UserInputError } from 'apollo-server';
import { mocked, spyOn } from 'jest-mock';

import { DBClient } from '../types/database';
import { hashPassword, verifyHash, generateClientToken } from '../util/crypto';
import { NotFoundError } from '../util/error';
import * as mappers from '../util/mappers';
import { validateEmail } from '../util/validation';

import { NarthexCrmDbDataSource } from './NarthexCrmDbDataSource';

const mockQuery = jest.fn();

jest.mock('./MySqlDataSource', () => ({
    MySqlDataSource: jest.fn().mockImplementation(() => ({
        query: mockQuery,
    })),
}));

jest.mock('../util/crypto');
const mockHashPassword = mocked(hashPassword);

jest.mock('../util/validation');
const mockValidateEmail = mocked(validateEmail);
const mockVerifyHash = mocked(verifyHash);
const mockGenerateClientToken = mocked(generateClientToken);

const spyMapClient = spyOn(mappers, 'mapClient');

const spyConsoleError = spyOn(console, 'error');

const narthexCrmDbDataSource = new NarthexCrmDbDataSource({});

beforeEach(() => {
    mockQuery.mockClear();
});

afterAll(() => {
    spyConsoleError.mockClear();
});

describe('addClient', () => {
    beforeEach(() => {
        mockHashPassword.mockClear();
        mockValidateEmail.mockClear();
    });

    it('adds a new client', async () => {
        mockQuery.mockImplementation(() => ({
            insertId: 1,
        }));

        mockValidateEmail.mockImplementation(() => true);
        mockHashPassword.mockImplementation(async () => 'hash');

        const result = await narthexCrmDbDataSource.addClient(
            'email@test.com',
            'qwerty'
        );

        expect(mockValidateEmail).toBeCalled();
        expect(mockHashPassword).toBeCalled();
        expect(result).toBe(1);
        expect(mockQuery).toBeCalledWith({
            sql: `
            INSERT INTO client
                (email_address, pass_hash)
            VALUES
                (?, ?)
        `,
            values: ['email@test.com', 'hash'],
        });
    });

    it('rejects malformed emails', async () => {
        mockValidateEmail.mockImplementation(() => false);

        expect(
            narthexCrmDbDataSource.addClient('malformed', 'qwerty')
        ).rejects.toThrowError(UserInputError);

        expect(mockValidateEmail).toBeCalled();
        expect(mockHashPassword).toHaveBeenCalledTimes(0);
        expect(mockQuery).toHaveBeenCalledTimes(0);
    });

    it('throws an error if the database fails to insert row', async () => {
        mockQuery.mockImplementation(() => undefined);
        mockValidateEmail.mockImplementation(() => true);

        await expect(
            narthexCrmDbDataSource.addClient('email@example.com', 'qwerty')
        ).rejects.toThrowError(Error);

        expect(mockValidateEmail).toBeCalled();
        expect(mockHashPassword).toBeCalled();
        expect(mockQuery).toBeCalled();
    });
});

describe('getClients', () => {
    beforeEach(() => {
        spyMapClient.mockClear();
    });

    it('gets all clients', async () => {
        mockQuery.mockImplementation((): DBClient[] => [
            {
                id: 1,
                active: 1,
                creation_timestamp: new Date('19/12/2021'),
                email_address: 'email@example.com',
                pass_hash: 'hash',
                permission_scope: 'admin',
                last_login_timestamp: new Date('19/12/2021'),
            },
            {
                id: 2,
                active: 1,
                creation_timestamp: new Date('19/12/2021'),
                email_address: 'test@example.com',
                pass_hash: 'hash',
                permission_scope: 'admin',
                last_login_timestamp: new Date('19/12/2021'),
            },
        ]);

        const result = await narthexCrmDbDataSource.getClients();

        expect(mockQuery).toBeCalledWith({
            sql: `
            SELECT
                id,
                email_address,
                creation_timestamp,
                permission_scope,
                last_login_timestamp,
                active
            FROM
            client
                
        `,
        });
        expect(spyMapClient).toHaveBeenCalled();
        expect(result).toStrictEqual([
            {
                active: true,
                creationTimestamp: NaN,
                emailAddress: 'email@example.com',
                id: 1,
                lastLoginTimestamp: NaN,
                permissionScope: 'admin',
            },
            {
                active: true,
                creationTimestamp: NaN,
                emailAddress: 'test@example.com',
                id: 2,
                lastLoginTimestamp: NaN,
                permissionScope: 'admin',
            },
        ]);
    });

    it('gets certain clients', async () => {
        mockQuery.mockImplementation((): DBClient[] => [
            {
                id: 1,
                active: 1,
                creation_timestamp: new Date('19/12/2021'),
                email_address: 'email@example.com',
                pass_hash: 'hash',
                permission_scope: 'admin',
                last_login_timestamp: new Date('19/12/2021'),
            },
            {
                id: 2,
                active: 1,
                creation_timestamp: new Date('19/12/2021'),
                email_address: 'test@example.com',
                pass_hash: 'hash',
                permission_scope: 'admin',
                last_login_timestamp: new Date('19/12/2021'),
            },
        ]);

        const result = await narthexCrmDbDataSource.getClients([1, 2]);

        expect(mockQuery).toBeCalledWith({
            sql: `
            SELECT
                id,
                email_address,
                creation_timestamp,
                permission_scope,
                last_login_timestamp,
                active
            FROM
            client
                WHERE id in (?)
        `,
            values: [[1, 2]],
        });
        expect(spyMapClient).toHaveBeenCalled();
        expect(result).toStrictEqual([
            {
                active: true,
                creationTimestamp: NaN,
                emailAddress: 'email@example.com',
                id: 1,
                lastLoginTimestamp: NaN,
                permissionScope: 'admin',
            },
            {
                active: true,
                creationTimestamp: NaN,
                emailAddress: 'test@example.com',
                id: 2,
                lastLoginTimestamp: NaN,
                permissionScope: 'admin',
            },
        ]);
    });

    it('throws an error if none of the clients exists', async () => {
        mockQuery.mockImplementation((): DBClient[] => []);

        await expect(
            narthexCrmDbDataSource.getClients([4])
        ).rejects.toThrowError(NotFoundError);

        expect(spyMapClient).toHaveBeenCalledTimes(0);
    });
});

describe('getToken', () => {
    beforeEach(() => {
        mockVerifyHash.mockClear();
        mockGenerateClientToken.mockClear();
    });

    it('generates a token', async () => {
        mockQuery.mockImplementation((): DBClient[] => [
            {
                id: 1,
                active: 1,
                creation_timestamp: new Date('19/12/2021'),
                email_address: 'email@example.com',
                pass_hash: 'hash',
                permission_scope: 'admin',
                last_login_timestamp: new Date('19/12/2021'),
            },
        ]);
        mockVerifyHash.mockImplementation(async () => true);
        mockGenerateClientToken.mockImplementation(async () => 'token');

        const result = await narthexCrmDbDataSource.getToken(
            'email@example.com',
            'password',
            'secret'
        );

        expect(mockQuery).toHaveBeenNthCalledWith(1, {
            sql: `
                SELECT id, email_address, permission_scope, active, pass_hash
                FROM
                client
                WHERE
                    email_address LIKE ?
            `,
            values: ['email@example.com'],
        });

        expect(mockQuery).toHaveBeenNthCalledWith(2, {
            sql: `
            UPDATE client
            SET
                last_login_timestamp = CURRENT_TIMESTAMP
            WHERE
                 id = ?
        `,
            values: [1],
        });
        expect(mockVerifyHash).toBeCalled();
        expect(result).toStrictEqual('token');
    });

    it('throws an error if the account does not exist', async () => {
        mockQuery.mockImplementation((): DBClient[] => []);

        await expect(
            narthexCrmDbDataSource.getToken(
                'email@example.com',
                'password',
                'secret'
            )
        ).rejects.toThrowError(NotFoundError);

        expect(mockVerifyHash).toBeCalledTimes(0);
        expect(mockQuery).toBeCalledTimes(1);
    });

    it('throws an error if the client is deactivated', async () => {
        mockQuery.mockImplementation((): DBClient[] => [
            {
                id: 1,
                active: 0,
                creation_timestamp: new Date('19/12/2021'),
                email_address: 'email@example.com',
                pass_hash: 'hash',
                permission_scope: 'admin',
                last_login_timestamp: new Date('19/12/2021'),
            },
        ]);

        await expect(
            narthexCrmDbDataSource.getToken(
                'email@example.com',
                'password',
                'secret'
            )
        ).rejects.toThrowError(ForbiddenError);

        expect(mockVerifyHash).toBeCalledTimes(1);
        expect(mockQuery).toBeCalledTimes(1);
    });

    it('throws an error if the password is invalid', async () => {
        mockQuery.mockImplementation((): DBClient[] => [
            {
                id: 1,
                active: 1,
                creation_timestamp: new Date('19/12/2021'),
                email_address: 'email@example.com',
                pass_hash: 'hash',
                permission_scope: 'admin',
                last_login_timestamp: new Date('19/12/2021'),
            },
        ]);
        mockVerifyHash.mockImplementation(async () => false);

        await expect(
            narthexCrmDbDataSource.getToken(
                'email@example.com',
                'password',
                'secret'
            )
        ).rejects.toThrowError(ForbiddenError);

        expect(mockVerifyHash).toBeCalledTimes(1);
        expect(mockQuery).toBeCalledTimes(1);
    });

    it('does not hang if the client connection is not logged', async () => {
        mockQuery.mockImplementationOnce((): DBClient[] => [
            {
                id: 1,
                active: 1,
                creation_timestamp: new Date('19/12/2021'),
                email_address: 'email@example.com',
                pass_hash: 'hash',
                permission_scope: 'admin',
                last_login_timestamp: new Date('19/12/2021'),
            },
        ]);
        mockQuery.mockImplementationOnce((): { changedRows: number } => ({
            changedRows: 0,
        }));

        mockVerifyHash.mockImplementation(async () => true);

        await narthexCrmDbDataSource.getToken(
            'email@example.com',
            'password',
            'secret'
        );

        expect(mockVerifyHash).toBeCalledTimes(1);
        expect(mockQuery).toBeCalledTimes(2);
        expect(spyConsoleError).toBeCalledTimes(1);
    });
});
