import { UserInputError } from 'apollo-server';
import { mocked, spyOn } from 'jest-mock';
import { format as sqlFormat } from 'sql-formatter';

import { DBMinistry, DBUpdateResponse } from '../../../types/database';
import { DatabaseError } from '../../../util/error';
import * as mappers from '../../../util/mappers';
import { validateRecordName, validateColor } from '../../../util/validation';
import {
    addMinistry,
    archiveMinistry,
    getMinistries,
    updateMinistry,
} from '../ministry';

const mockQuery = jest.fn();
const mockLogRecordChange = jest.fn();

jest.mock('../../../util/validation');
const mockValidateRecordName = mocked(validateRecordName);
const mockValidateColor = mocked(validateColor);

const spyMapMinistry = spyOn(mappers, 'mapMinistry');

beforeEach(() => {
    mockQuery.mockClear();
    mockLogRecordChange.mockClear();
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

            const result = await getMinistries(mockQuery, [], true);

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

            const result = await getMinistries(mockQuery, []);

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

            const result = await getMinistries(mockQuery, [1]);

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

        it('returns an empty array if there are not ministries', async () => {
            mockQuery.mockImplementation((): DBMinistry[] => []);

            const result = await getMinistries(mockQuery, [4]);

            expect(result).toEqual([]);
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

            const result = await addMinistry(
                mockQuery,
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

        it('throws an error if an invalid color is provided', async () => {
            mockValidateColor.mockImplementation(() => false);
            mockValidateRecordName.mockImplementation(() => true);

            expect(
                addMinistry(
                    mockQuery,
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

        it('throws an error if an invalid name is provided', async () => {
            mockValidateColor.mockImplementation(() => true);
            mockValidateRecordName.mockImplementation(() => false);

            expect(
                addMinistry(
                    mockQuery,
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
                addMinistry(
                    mockQuery,
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

    describe('updateMinistry', () => {
        it('updates a ministry', async () => {
            mockQuery.mockImplementation(
                (): DBUpdateResponse => ({
                    affectedRows: 1,
                    changedRows: 1,
                })
            );
            mockValidateColor.mockImplementation(() => true);
            mockValidateRecordName.mockImplementation(() => true);

            await updateMinistry(
                mockQuery,
                mockLogRecordChange,
                {
                    id: 1,
                    color: '#000000',
                    name: 'Council',
                },
                2
            );

            expect(mockQuery).toHaveBeenNthCalledWith(1, {
                sql: sqlFormat(`
                        UPDATE
                            ministry
                        SET
                            name = ?,
                            color = ?
                        WHERE
                            ID = ?;
                    `),
                values: ['Council', 0, 1],
            });

            expect(mockLogRecordChange).toHaveBeenCalledWith('ministry', 1, 2);
        });

        it('throws an error if no changes are provided', async () => {
            await expect(
                updateMinistry(
                    mockQuery,
                    mockLogRecordChange,
                    {
                        id: 1,
                    },
                    2
                )
            ).rejects.toThrowError(UserInputError);

            expect(mockQuery).toHaveBeenCalledTimes(0);
        });

        it('throws an error if an invalid color is provided', async () => {
            mockValidateColor.mockImplementation(() => false);

            await expect(
                updateMinistry(
                    mockQuery,
                    mockLogRecordChange,
                    {
                        id: 1,
                        color: 'red',
                    },
                    2
                )
            ).rejects.toThrowError(UserInputError);

            expect(mockQuery).toHaveBeenCalledTimes(0);
        });

        it('throws an error if an invalid name is provided', async () => {
            mockValidateRecordName.mockImplementation(() => false);

            await expect(
                updateMinistry(
                    mockQuery,
                    mockLogRecordChange,
                    {
                        id: 1,
                        name: 'a',
                    },
                    2
                )
            ).rejects.toThrowError(UserInputError);

            expect(mockQuery).toHaveBeenCalledTimes(0);
        });

        it('throws an error if the ministry was not updated on the database', async () => {
            mockQuery.mockImplementation(
                (): DBUpdateResponse => ({
                    affectedRows: 0,
                    changedRows: 0,
                })
            );

            mockValidateColor.mockImplementation(() => true);
            mockValidateRecordName.mockImplementation(() => true);

            await expect(
                updateMinistry(
                    mockQuery,
                    mockLogRecordChange,
                    {
                        id: 1,
                        name: 'Council',
                    },
                    2
                )
            ).rejects.toThrowError(DatabaseError);
        });
    });

    describe('archiveMinistry', () => {
        it('archives a ministry', async () => {
            mockQuery.mockImplementation(
                (): DBUpdateResponse => ({
                    affectedRows: 1,
                    changedRows: 1,
                })
            );

            await archiveMinistry(mockQuery, mockLogRecordChange, 1, 2);

            expect(mockQuery).toHaveBeenNthCalledWith(1, {
                sql: sqlFormat(`
                    UPDATE ministry
                    SET
                        archived = 1
                    WHERE ID = ?;
                `),
                values: [1],
            });
            expect(mockLogRecordChange).toHaveBeenCalledWith('ministry', 1, 2);
        });

        it('throws an error if the ministry was not archived on the database', async () => {
            mockQuery.mockImplementation(
                (): DBUpdateResponse => ({
                    affectedRows: 0,
                    changedRows: 0,
                })
            );

            await expect(
                archiveMinistry(mockQuery, mockLogRecordChange, 1, 2)
            ).rejects.toThrowError(DatabaseError);
        });
    });
});
