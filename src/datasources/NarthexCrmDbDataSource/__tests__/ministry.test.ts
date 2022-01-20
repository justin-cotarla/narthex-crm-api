import { UserInputError } from 'apollo-server';
import { mocked, SpyInstance, spyOn } from 'jest-mock';
import { format as sqlFormat } from 'sql-formatter';

import { mockDBMinistry } from '../../../__mocks__/database';
import { mockMinistry } from '../../../__mocks__/schema';
import {
    DBMinistry,
    DBUpdateResponse,
    RecordTable,
} from '../../../types/database';
import { MinistryAddInput } from '../../../types/generated/graphql';
import { DatabaseError, NotFoundError } from '../../../util/error';
import { validateRecordName, validateColor } from '../../../util/validation';
import * as ministryModule from '../ministry';
import {
    addMinistry,
    archiveMinistry,
    getMinistries,
    updateMinistry,
} from '../ministry';

const mockQuery = jest.fn();
const mockLogRecordChange = jest.fn();

jest.mock('../../../util/validation');
const mockValidateRecordName = mocked(validateRecordName).mockImplementation(
    () => true
);
const mockValidateColor = mocked(validateColor).mockImplementation(() => true);

beforeEach(() => {
    mockQuery.mockClear();
    mockLogRecordChange.mockClear();
    mockValidateColor.mockClear();
    mockValidateRecordName.mockClear();
});

describe('ministry', () => {
    describe('getMinistries', () => {
        it('gets ministries with default arguments', async () => {
            mockQuery.mockImplementation((): DBMinistry[] => [mockDBMinistry]);

            await getMinistries(mockQuery);

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
        });

        it('gets ministries with all arguments', async () => {
            mockQuery.mockImplementation((): DBMinistry[] => [mockDBMinistry]);

            await getMinistries(mockQuery, {
                archived: true,
                ministryIds: [1],
            });

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
                    `),
                values: [[1]],
            });
        });

        it('returns an empty array if there are no ministries', async () => {
            mockQuery.mockImplementation((): DBMinistry[] => []);

            const result = await getMinistries(mockQuery, { ministryIds: [4] });

            expect(result).toEqual([]);
        });
    });
    describe('addMinistry', () => {
        it('adds a minimal ministry', async () => {
            mockQuery.mockImplementation(() => ({
                insertId: 1,
            }));

            const result = await addMinistry(
                mockQuery,
                {
                    name: 'Choir',
                },
                1
            );

            expect(result).toBe(1);
            expect(mockQuery).toBeCalledWith({
                sql: sqlFormat(`
                INSERT INTO
                    ministry (name, color, created_by, modified_by)
                VALUES
                    (?, ?, ?, ?)
                `),
                values: ['Choir', 11780024, 1, 1],
            });
        });

        it('adds a full ministry', async () => {
            mockQuery.mockImplementation(() => ({
                insertId: 1,
            }));

            const result = await addMinistry(
                mockQuery,
                {
                    name: 'Choir',
                    color: '#FFFFFF',
                },
                1
            );

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

        it('throws an error if the database fails to insert row', async () => {
            mockQuery.mockImplementation(() => undefined);

            await expect(
                addMinistry(
                    mockQuery,
                    {
                        name: 'Choir',
                        color: '#FFFFFF',
                    },
                    1
                )
            ).rejects.toThrowError(DatabaseError);

            expect(mockQuery).toBeCalled();
        });
    });

    describe('updateMinistry', () => {
        let spyGetMinistries: SpyInstance<unknown, unknown[]>;

        beforeEach(() => {
            spyGetMinistries = spyOn(ministryModule, 'getMinistries');
        });

        afterEach(() => {
            spyGetMinistries.mockRestore();
        });
        it('updates a ministry', async () => {
            spyGetMinistries.mockImplementation(() => [mockMinistry]);
            mockQuery.mockImplementation(
                (): DBUpdateResponse => ({
                    affectedRows: 1,
                    changedRows: 1,
                })
            );

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

            expect(spyGetMinistries).toHaveBeenCalled();

            expect(mockQuery).toHaveBeenCalledWith({
                sql: sqlFormat(`
                        UPDATE
                            ministry
                        SET
                            modified_by = ?,
                            name = ?,
                            color = ?
                        WHERE
                            ID = ?;
                    `),
                values: [2, 'Council', 0, 1],
            });

            expect(mockLogRecordChange).toHaveBeenCalledWith(
                RecordTable.MINISTRY,
                1,
                2
            );
        });

        it('throws an error if no the ministry does not exists', async () => {
            spyGetMinistries.mockImplementation(() => []);

            await expect(
                updateMinistry(
                    mockQuery,
                    mockLogRecordChange,
                    {
                        id: 10,
                    },
                    2
                )
            ).rejects.toThrowError(NotFoundError);

            expect(mockQuery).toHaveBeenCalledTimes(0);
        });

        it('throws an error if no changes are provided', async () => {
            spyGetMinistries.mockImplementation(() => [mockMinistry]);

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

        it('throws an error if the ministry was not updated on the database', async () => {
            spyGetMinistries.mockImplementation(() => [mockMinistry]);
            mockQuery.mockImplementation(
                (): DBUpdateResponse => ({
                    affectedRows: 0,
                    changedRows: 0,
                })
            );

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

            expect(mockQuery).toHaveBeenCalledWith({
                sql: sqlFormat(`
                    UPDATE ministry
                    SET
                        archived = 1
                    WHERE ID = ?;
                `),
                values: [1],
            });
            expect(mockLogRecordChange).toHaveBeenCalledWith(
                RecordTable.MINISTRY,
                1,
                2
            );
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

    describe('_validateMinistryProperties', () => {
        it('accepts valid ministry properties', () => {
            ministryModule._validateMinistryProperties({
                color: '#F15025',
                name: 'Choir',
            } as MinistryAddInput);

            expect(mockValidateColor).toBeCalled();
            expect(mockValidateRecordName).toBeCalled();
        });
    });
});
