import { UserInputError } from 'apollo-server';
import { mocked, spyOn } from 'jest-mock';
import { format as sqlFormat } from 'sql-formatter';

import { DBMinistry, DBUpdateResponse } from '../../types/database';
import { DatabaseError, NotFoundError } from '../../util/error';
import * as mappers from '../../util/mappers';
import { validateRecordName, validateColor } from '../../util/validation';
import { NarthexCrmDbDataSource } from '../NarthexCrmDbDataSource';

const mockQuery = jest.fn();
const mockErrorLogger = jest.fn();

jest.mock('../MySqlDataSource', () => ({
    MySqlDataSource: jest.fn().mockImplementation(() => ({
        query: mockQuery,
        context: {
            logger: {
                error: mockErrorLogger,
            },
        },
    })),
}));

jest.mock('../../util/validation');
const mockValidateRecordName = mocked(validateRecordName);
const mockValidateColor = mocked(validateColor);

const spyMapMinistry = spyOn(mappers, 'mapMinistry');

const narthexCrmDbDataSource = new NarthexCrmDbDataSource({});

beforeEach(() => {
    mockQuery.mockClear();
});

describe('ministry', () => {
    describe('getMinistries', () => {
        beforeEach(() => {
            spyMapMinistry.mockClear();
        });

        it('gets all ministries', async () => {
            mockQuery.mockImplementation((): DBMinistry[] => [
                {
                    id: 1,
                    color: 15814693,
                    name: 'Choir',
                    created_by: 1,
                    creation_timestamp: new Date('2021/12/19'),
                    modified_by: 1,
                    modification_timestamp: new Date('2021/12/19'),
                    archived: 0,
                },
                {
                    id: 2,
                    color: 11780024,
                    name: 'Cleaning',
                    created_by: 1,
                    creation_timestamp: new Date('2021/12/19'),
                    modified_by: 1,
                    modification_timestamp: new Date('2021/12/19'),
                    archived: 1,
                },
            ]);

            const result = await narthexCrmDbDataSource.getMinistries([], true);

            expect(mockQuery).toBeCalledWith({
                sql: sqlFormat(`
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
                    `),
                values: [],
            });
            expect(spyMapMinistry).toHaveBeenCalled();
            expect(result).toStrictEqual([
                {
                    archived: false,
                    color: '#F15025',
                    createdBy: {
                        id: 1,
                    },
                    creationTimestamp: 1639872000,
                    id: 1,
                    modificationTimestamp: 1639872000,
                    modifiedBy: {
                        id: 1,
                    },
                    name: 'Choir',
                },
                {
                    archived: true,
                    color: '#B3BFB8',
                    createdBy: {
                        id: 1,
                    },
                    creationTimestamp: 1639872000,
                    id: 2,
                    modificationTimestamp: 1639872000,
                    modifiedBy: {
                        id: 1,
                    },
                    name: 'Cleaning',
                },
            ]);
        });

        it('gets all unarchived ministries', async () => {
            mockQuery.mockImplementation((): DBMinistry[] => [
                {
                    id: 1,
                    color: 15814693,
                    name: 'Choir',
                    created_by: 1,
                    creation_timestamp: new Date('2021/12/19'),
                    modified_by: 1,
                    modification_timestamp: new Date('2021/12/19'),
                    archived: 0,
                },
            ]);

            const result = await narthexCrmDbDataSource.getMinistries([]);

            expect(mockQuery).toBeCalledWith({
                sql: sqlFormat(`
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
                    WHERE
                        archived <> 1
                    `),
                values: [],
            });
            expect(spyMapMinistry).toHaveBeenCalled();
            expect(result).toStrictEqual([
                {
                    archived: false,
                    color: '#F15025',
                    createdBy: {
                        id: 1,
                    },
                    creationTimestamp: 1639872000,
                    id: 1,
                    modificationTimestamp: 1639872000,
                    modifiedBy: {
                        id: 1,
                    },
                    name: 'Choir',
                },
            ]);
        });

        it('gets certain ministries', async () => {
            mockQuery.mockImplementation((): DBMinistry[] => [
                {
                    id: 1,
                    color: 15814693,
                    name: 'Choir',
                    created_by: 1,
                    creation_timestamp: new Date('2021/12/19'),
                    modified_by: 1,
                    modification_timestamp: new Date('2021/12/19'),
                    archived: 0,
                },
            ]);

            const result = await narthexCrmDbDataSource.getMinistries([1]);

            expect(mockQuery).toBeCalledWith({
                sql: sqlFormat(`
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
                    WHERE
                        id in (?)
                        and archived <> 1`),
                values: [[1]],
            });
            expect(spyMapMinistry).toHaveBeenCalled();
            expect(result).toStrictEqual([
                {
                    archived: false,
                    color: '#F15025',
                    createdBy: {
                        id: 1,
                    },
                    creationTimestamp: 1639872000,
                    id: 1,
                    modificationTimestamp: 1639872000,
                    modifiedBy: {
                        id: 1,
                    },
                    name: 'Choir',
                },
            ]);
        });

        it('throws an error if none of the ministries exists', async () => {
            mockQuery.mockImplementation((): DBMinistry[] => []);

            await expect(
                narthexCrmDbDataSource.getMinistries([4])
            ).rejects.toThrowError(NotFoundError);

            expect(spyMapMinistry).toHaveBeenCalledTimes(0);
        });
    });
    describe('addMinistry', () => {
        beforeEach(() => {
            mockValidateColor.mockClear();
            mockValidateRecordName.mockClear();
        });

        it('adds a new ministry', async () => {
            mockQuery.mockImplementation(() => ({
                insertId: 1,
            }));

            mockValidateColor.mockImplementation(() => true);
            mockValidateRecordName.mockImplementation(() => true);

            const result = await narthexCrmDbDataSource.addMinistry(
                {
                    name: 'Choir',
                    color: '#FFFFFF',
                },
                1
            );

            expect(mockValidateColor).toBeCalled();
            expect(mockValidateRecordName).toBeCalled();
            expect(result).toBe(1);
            expect(mockQuery).toBeCalledWith({
                sql: sqlFormat(`
                INSERT INTO
                    ministry (name, color, created_by, modified_by)
                VALUES
                    (?, ?, ?, ?)
                `),
                values: ['Choir', 16777215, 1, 1],
            });
        });

        it('rejects invalid colors', async () => {
            mockValidateColor.mockImplementation(() => false);
            mockValidateRecordName.mockImplementation(() => true);

            expect(
                narthexCrmDbDataSource.addMinistry(
                    {
                        name: 'Choir',
                        color: 'purple',
                    },
                    1
                )
            ).rejects.toThrowError(UserInputError);

            expect(mockValidateColor).toBeCalled();
            expect(mockQuery).toHaveBeenCalledTimes(0);
        });

        it('rejects invalid ministry names', async () => {
            mockValidateColor.mockImplementation(() => true);
            mockValidateRecordName.mockImplementation(() => false);

            expect(
                narthexCrmDbDataSource.addMinistry(
                    {
                        name: 'a',
                        color: '#FFFFFF',
                    },
                    1
                )
            ).rejects.toThrowError(UserInputError);

            expect(mockValidateRecordName).toBeCalled();
            expect(mockQuery).toHaveBeenCalledTimes(0);
        });

        it('throws an error if the database fails to insert row', async () => {
            mockQuery.mockImplementation(() => undefined);
            mockValidateColor.mockImplementation(() => true);
            mockValidateRecordName.mockImplementation(() => true);

            await expect(
                narthexCrmDbDataSource.addMinistry(
                    {
                        name: 'Choir',
                        color: '#FFFFFF',
                    },
                    1
                )
            ).rejects.toThrowError(Error);

            expect(mockValidateColor).toBeCalled();
            expect(mockValidateRecordName).toBeCalled();
            expect(mockQuery).toBeCalled();
        });
    });
});
