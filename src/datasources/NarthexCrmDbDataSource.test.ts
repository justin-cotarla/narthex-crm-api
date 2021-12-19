import { UserInputError } from 'apollo-server';
import { mocked, spyOn } from 'jest-mock';

import { DBClient } from '../types/database';
import { hashPassword } from '../util/crypto';
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

const spyMapClient = spyOn(mappers, 'mapClient');

const narthexCrmDbDataSource = new NarthexCrmDbDataSource({});

beforeEach(() => {
    mockQuery.mockReset();
});

describe('addClient', () => {
    beforeEach(() => {
        mockHashPassword.mockReset();
        mockValidateEmail.mockReset();
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
        mockQuery.mockReset();
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
