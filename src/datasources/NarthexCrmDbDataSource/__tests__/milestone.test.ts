import { UserInputError } from 'apollo-server';
import { mocked, SpyInstance, spyOn } from 'jest-mock';
import { format as sqlFormat } from 'sql-formatter';

import { mockDBMilestone } from '../../../__mocks__/database';
import { mockMilestone } from '../../../__mocks__/schema';
import {
    DBMilestone,
    DBUpdateResponse,
    RecordTable,
} from '../../../types/database';
import { MilestoneType } from '../../../types/generated/graphql';
import { DatabaseError, NotFoundError } from '../../../util/error';
import { validateDate } from '../../../util/validation';
import * as milestoneModule from '../milestone';
import {
    addMilestone,
    archiveMilestone,
    getMilestones,
    updateMilestone,
} from '../milestone';

const mockQuery = jest.fn();
const mockLogRecordChange = jest.fn();

jest.mock('../../../util/validation');
const mockValidateDate = mocked(validateDate).mockImplementation(() => true);

beforeEach(() => {
    mockQuery.mockClear();
    mockLogRecordChange.mockClear();
    mockValidateDate.mockClear();
});

describe('milestone', () => {
    describe('getMilestones', () => {
        it('gets milestones with default arguments', async () => {
            mockQuery.mockImplementation((): DBMilestone[] => [
                mockDBMilestone,
            ]);

            await getMilestones(mockQuery);

            expect(mockQuery).toBeCalledWith({
                sql: sqlFormat(`
                    SELECT
                        id,
                        person_id,
                        type,
                        date,
                        notes,
                        created_by,
                        creation_timestamp,
                        modified_by,
                        modification_timestamp,
                        archived
                    FROM
                        milestone
                    WHERE
                        archived <> 1
                    ORDER BY
                        date ASC
                    `),
                values: [],
            });
        });

        it('gets milestones with all arguments', async () => {
            mockQuery.mockImplementation((): DBMilestone[] => [
                mockDBMilestone,
            ]);

            await getMilestones(mockQuery, {
                archived: true,
                milestoneIds: [1],
            });

            expect(mockQuery).toBeCalledWith({
                sql: sqlFormat(`
                    SELECT
                        id,
                        person_id,
                        type,
                        date,
                        notes,
                        created_by,
                        creation_timestamp,
                        modified_by,
                        modification_timestamp,
                        archived
                    FROM
                        milestone
                    WHERE
                        id in (?)
                    ORDER BY
                        date ASC
                    `),
                values: [[1]],
            });
        });

        it('returns an empty array if there are no milestones', async () => {
            mockQuery.mockImplementation((): DBMilestone[] => []);

            const result = await getMilestones(mockQuery, {
                milestoneIds: [4],
            });

            expect(result).toEqual([]);
        });
    });
    describe('addMilestone', () => {
        it('adds a minimal milestone', async () => {
            mockQuery.mockImplementation(() => ({
                insertId: 1,
            }));

            const result = await addMilestone(
                mockQuery,
                {
                    type: MilestoneType.Baptism,
                    date: '2020-05-22',
                    personId: 1,
                },
                1
            );

            expect(result).toBe(1);
            expect(mockQuery).toBeCalledWith({
                sql: sqlFormat(`
                INSERT INTO
                    milestone (person_id, date, type, created_by, modified_by)
                VALUES
                    (?, ?, ?, ?, ?)
                `),
                values: [1, '2020-05-22', 'baptism', 1, 1],
            });
        });

        it('adds a full milestone', async () => {
            mockQuery.mockImplementation(() => ({
                insertId: 1,
            }));

            const result = await addMilestone(
                mockQuery,
                {
                    type: MilestoneType.Baptism,
                    date: '2020-05-22',
                    notes: 'Pandemic baptism',
                    personId: 1,
                },
                1
            );

            expect(result).toBe(1);
            expect(mockQuery).toBeCalledWith({
                sql: sqlFormat(`
                INSERT INTO
                    milestone (person_id, date, type, created_by, modified_by, notes)
                VALUES
                    (?, ?, ?, ?, ?, ?)
                `),
                values: [1, '2020-05-22', 'baptism', 1, 1, 'Pandemic baptism'],
            });
        });

        it('throws an error if the database fails to insert row', async () => {
            mockQuery.mockImplementation(() => undefined);

            await expect(
                addMilestone(
                    mockQuery,
                    {
                        type: MilestoneType.Baptism,
                        date: '2020-05-22',
                        personId: 1,
                    },
                    1
                )
            ).rejects.toThrowError(DatabaseError);

            expect(mockQuery).toBeCalled();
        });
    });

    describe('updateMilestone', () => {
        let spyGetMilestones: SpyInstance<unknown, unknown[]>;

        beforeEach(() => {
            spyGetMilestones = spyOn(milestoneModule, 'getMilestones');
        });

        afterEach(() => {
            spyGetMilestones.mockRestore();
        });
        it('updates a milestone', async () => {
            spyGetMilestones.mockImplementation(() => [mockMilestone]);
            mockQuery.mockImplementation(
                (): DBUpdateResponse => ({
                    affectedRows: 1,
                    changedRows: 1,
                })
            );

            await updateMilestone(
                mockQuery,
                mockLogRecordChange,
                {
                    id: 1,
                    type: MilestoneType.Baptism,
                    date: '2020-05-22',
                    notes: 'Pandemic baptism',
                },
                2
            );

            expect(spyGetMilestones).toHaveBeenCalled();

            expect(mockQuery).toHaveBeenCalledWith({
                sql: sqlFormat(`
                        UPDATE
                            milestone
                        SET
                            modified_by = ?,
                            date = ?,
                            type = ?,
                            notes = ?
                        WHERE
                            ID = ?;
                    `),
                values: [2, '2020-05-22', 'baptism', 'Pandemic baptism', 1],
            });

            expect(mockLogRecordChange).toHaveBeenCalledWith(
                RecordTable.MILESTONE,
                1,
                2
            );
        });

        it('throws an error if no the milestone does not exists', async () => {
            spyGetMilestones.mockImplementation(() => []);

            await expect(
                updateMilestone(
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
            spyGetMilestones.mockImplementation(() => [mockMilestone]);

            await expect(
                updateMilestone(
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

        it('throws an error if the milestone was not updated on the database', async () => {
            spyGetMilestones.mockImplementation(() => [mockMilestone]);
            mockQuery.mockImplementation(
                (): DBUpdateResponse => ({
                    affectedRows: 0,
                    changedRows: 0,
                })
            );

            await expect(
                updateMilestone(
                    mockQuery,
                    mockLogRecordChange,
                    {
                        id: 1,
                        type: MilestoneType.Baptism,
                    },
                    2
                )
            ).rejects.toThrowError(DatabaseError);
        });
    });

    describe('archiveMilestone', () => {
        it('archives a milestone', async () => {
            mockQuery.mockImplementation(
                (): DBUpdateResponse => ({
                    affectedRows: 1,
                    changedRows: 1,
                })
            );

            await archiveMilestone(mockQuery, mockLogRecordChange, 1, 2);

            expect(mockQuery).toHaveBeenCalledWith({
                sql: sqlFormat(`
                    UPDATE milestone
                    SET
                        archived = 1
                    WHERE ID = ?;
                `),
                values: [1],
            });
            expect(mockLogRecordChange).toHaveBeenCalledWith(
                RecordTable.MILESTONE,
                1,
                2
            );
        });

        it('throws an error if the milestone was not archived on the database', async () => {
            mockQuery.mockImplementation(
                (): DBUpdateResponse => ({
                    affectedRows: 0,
                    changedRows: 0,
                })
            );

            await expect(
                archiveMilestone(mockQuery, mockLogRecordChange, 1, 2)
            ).rejects.toThrowError(DatabaseError);
        });
    });

    describe('_validateMilestoneProperties', () => {
        it('accepts valid milestone properties', () => {
            milestoneModule._validateMilestoneProperties({
                id: 1,
                type: MilestoneType.Baptism,
                date: '2020-05-22',
            });

            expect(mockValidateDate).toBeCalled();
        });
    });
});
