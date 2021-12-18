import { UserInputError } from 'apollo-server';
import { mocked } from 'jest-mock';

import { hashPassword } from '../util/crypto';
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

beforeEach(() => {
    mockQuery.mockReset();
    mockHashPassword.mockReset();
    mockValidateEmail.mockReset();
});

describe('addClient', () => {
    it('adds a new client', async () => {
        mockQuery.mockImplementation(() => ({
            insertId: 1,
        }));

        mockValidateEmail.mockImplementation(() => true);
        mockHashPassword.mockImplementation(async () => 'hash');

        const narthexCrmDbDataSource = new NarthexCrmDbDataSource({});

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

        const narthexCrmDbDataSource = new NarthexCrmDbDataSource({});

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

        const narthexCrmDbDataSource = new NarthexCrmDbDataSource({});

        await expect(
            narthexCrmDbDataSource.addClient('email@example.com', 'qwerty')
        ).rejects.toThrowError(Error);

        expect(mockValidateEmail).toBeCalled();
        expect(mockHashPassword).toBeCalled();
        expect(mockQuery).toBeCalled();
    });
});
