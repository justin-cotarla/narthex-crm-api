import { ForbiddenError, UserInputError } from 'apollo-server';
import { mocked, spyOn } from 'jest-mock';
import { format as sqlFormat } from 'sql-formatter';

import { DBClient, DBUpdateResponse } from '../../../types/database';
import {
    hashPassword,
    verifyHash,
    generateClientToken,
} from '../../../util/crypto';
import { DatabaseError, NotFoundError } from '../../../util/error';
import * as mappers from '../../../util/mappers';
import { validateEmail } from '../../../util/validation';
import { addClient, getClients, getToken, updateClient } from '../clients';

const mockQuery = jest.fn();
const mockLogClientConnection = jest.fn();

jest.mock('../../../util/crypto');
const mockHashPassword = mocked(hashPassword);

jest.mock('../../../util/validation');
const mockValidateEmail = mocked(validateEmail);
const mockVerifyHash = mocked(verifyHash);
const mockGenerateClientToken = mocked(generateClientToken);

const spyMapClient = spyOn(mappers, 'mapClient');

beforeEach(() => {
    mockQuery.mockClear();
});

describe('client', () => {
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

            const result = await addClient(
                mockQuery,
                'email@test.com',
                'qwerty'
            );

            expect(mockValidateEmail).toBeCalled();
            expect(mockHashPassword).toBeCalled();
            expect(result).toBe(1);
            expect(mockQuery).toBeCalledWith({
                sql: sqlFormat(`
                    INSERT INTO client
                        (email_address, pass_hash)
                    VALUES
                        (?, ?)
                `),
                values: ['email@test.com', 'hash'],
            });
        });

        it('rejects malformed emails', async () => {
            mockValidateEmail.mockImplementation(() => false);

            expect(
                addClient(mockQuery, 'malformed', 'qwerty')
            ).rejects.toThrowError(UserInputError);

            expect(mockValidateEmail).toBeCalled();
            expect(mockHashPassword).toHaveBeenCalledTimes(0);
            expect(mockQuery).toHaveBeenCalledTimes(0);
        });

        it('throws an error if the database fails to insert row', async () => {
            mockQuery.mockImplementation(() => undefined);
            mockValidateEmail.mockImplementation(() => true);

            await expect(
                addClient(mockQuery, 'email@example.com', 'qwerty')
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
                    creation_timestamp: new Date('2021/12/19'),
                    email_address: 'email@example.com',
                    pass_hash: 'hash',
                    permission_scope: 'admin',
                    last_login_timestamp: new Date('2021/12/19'),
                },
                {
                    id: 2,
                    active: 1,
                    creation_timestamp: new Date('2021/12/19'),
                    email_address: 'test@example.com',
                    pass_hash: 'hash',
                    permission_scope: 'admin',
                    last_login_timestamp: new Date('2021/12/19'),
                },
            ]);

            const result = await getClients(mockQuery, []);

            expect(mockQuery).toBeCalledWith({
                sql: sqlFormat(`
                    SELECT
                        id,
                        email_address,
                        creation_timestamp,
                        permission_scope,
                        last_login_timestamp,
                        active
                    FROM
                    client
                `),
                values: [],
            });
            expect(spyMapClient).toHaveBeenCalled();
            expect(result).toStrictEqual([
                {
                    active: true,
                    creationTimestamp: 1639872000,
                    emailAddress: 'email@example.com',
                    id: 1,
                    lastLoginTimestamp: 1639872000,
                    permissionScope: 'admin',
                },
                {
                    active: true,
                    creationTimestamp: 1639872000,
                    emailAddress: 'test@example.com',
                    id: 2,
                    lastLoginTimestamp: 1639872000,
                    permissionScope: 'admin',
                },
            ]);
        });

        it('gets certain clients', async () => {
            mockQuery.mockImplementation((): DBClient[] => [
                {
                    id: 1,
                    active: 1,
                    creation_timestamp: new Date('2021/12/19'),
                    email_address: 'email@example.com',
                    pass_hash: 'hash',
                    permission_scope: 'admin',
                    last_login_timestamp: new Date('2021/12/19'),
                },
                {
                    id: 2,
                    active: 1,
                    creation_timestamp: new Date('2021/12/19'),
                    email_address: 'test@example.com',
                    pass_hash: 'hash',
                    permission_scope: 'admin',
                    last_login_timestamp: new Date('2021/12/19'),
                },
            ]);

            const result = await getClients(mockQuery, [1, 2]);

            expect(mockQuery).toBeCalledWith({
                sql: sqlFormat(`
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
                `),
                values: [[1, 2]],
            });
            expect(spyMapClient).toHaveBeenCalled();
            expect(result).toStrictEqual([
                {
                    active: true,
                    creationTimestamp: 1639872000,
                    emailAddress: 'email@example.com',
                    id: 1,
                    lastLoginTimestamp: 1639872000,
                    permissionScope: 'admin',
                },
                {
                    active: true,
                    creationTimestamp: 1639872000,
                    emailAddress: 'test@example.com',
                    id: 2,
                    lastLoginTimestamp: 1639872000,
                    permissionScope: 'admin',
                },
            ]);
        });

        it('returns an empty array if there are not clients', async () => {
            mockQuery.mockImplementation((): DBClient[] => []);

            const result = await getClients(mockQuery, [4]);

            expect(result).toEqual([]);
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
                    creation_timestamp: new Date('2021/12/19'),
                    email_address: 'email@example.com',
                    pass_hash: 'hash',
                    permission_scope: 'admin',
                    last_login_timestamp: new Date('2021/12/19'),
                },
            ]);
            mockVerifyHash.mockImplementation(async () => true);
            mockGenerateClientToken.mockImplementation(async () => 'token');

            const result = await getToken(
                mockQuery,
                mockLogClientConnection,
                'email@example.com',
                'password',
                'secret'
            );

            expect(mockQuery).toHaveBeenNthCalledWith(1, {
                sql: sqlFormat(`
                    SELECT id, email_address, permission_scope, active, pass_hash
                    FROM
                    client
                    WHERE
                        email_address LIKE ?
                `),
                values: ['email@example.com'],
            });

            expect(mockVerifyHash).toBeCalled();
            expect(result).toStrictEqual('token');
            expect(mockLogClientConnection).toHaveBeenCalledWith(1);
        });

        it('throws an error if the account does not exist', async () => {
            mockQuery.mockImplementation((): DBClient[] => []);

            await expect(
                getToken(
                    mockQuery,
                    mockLogClientConnection,
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
                    creation_timestamp: new Date('2021/12/19'),
                    email_address: 'email@example.com',
                    pass_hash: 'hash',
                    permission_scope: 'admin',
                    last_login_timestamp: new Date('2021/12/19'),
                },
            ]);

            await expect(
                getToken(
                    mockQuery,
                    mockLogClientConnection,
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
                    creation_timestamp: new Date('2021/12/19'),
                    email_address: 'email@example.com',
                    pass_hash: 'hash',
                    permission_scope: 'admin',
                    last_login_timestamp: new Date('2021/12/19'),
                },
            ]);
            mockVerifyHash.mockImplementation(async () => false);

            await expect(
                getToken(
                    mockQuery,
                    mockLogClientConnection,
                    'email@example.com',
                    'password',
                    'secret'
                )
            ).rejects.toThrowError(ForbiddenError);

            expect(mockVerifyHash).toBeCalledTimes(1);
            expect(mockQuery).toBeCalledTimes(1);
        });
    });

    describe('updateClient', () => {
        it('updates a client', async () => {
            mockQuery.mockImplementation(
                (): DBUpdateResponse => ({
                    affectedRows: 1,
                    changedRows: 1,
                })
            );
            mockHashPassword.mockImplementation(async () => 'hash');

            await updateClient(mockQuery, {
                id: 1,
                active: false,
                password: 'password',
            });

            expect(mockQuery).toHaveBeenCalledWith({
                sql: sqlFormat(`UPDATE
                    client
                    SET
                    pass_hash = ?,
                    active = ?
                    WHERE
                    ID = ?;`),
                values: ['hash', 0, 1],
            });
        });

        it('throws an error if no changes are provided', async () => {
            await expect(
                updateClient(mockQuery, {
                    id: 1,
                })
            ).rejects.toThrowError(UserInputError);

            expect(mockQuery).toHaveBeenCalledTimes(0);
        });

        it('throws an error if the client was not updated on the database', async () => {
            mockQuery.mockImplementation(
                (): DBUpdateResponse => ({
                    affectedRows: 0,
                    changedRows: 0,
                })
            );

            await expect(
                updateClient(mockQuery, {
                    id: 1,
                    active: false,
                })
            ).rejects.toThrowError(DatabaseError);
        });
    });
});
