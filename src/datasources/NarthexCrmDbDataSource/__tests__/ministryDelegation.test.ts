import { mocked, spyOn } from 'jest-mock';
import { format as sqlFormat } from 'sql-formatter';

import {
    DBMinistryDelegation,
    DBUpdateResponse,
} from '../../../types/database';
import { Ministry, Person } from '../../../types/generated/graphql';
import { DatabaseError } from '../../../util/error';
import * as mappers from '../../../util/mappers';
import { getMinistries } from '../ministry';
import {
    addPersonToMinsitry,
    removePersonFromMinistry,
    getMinistryDelegations,
} from '../ministryDelegation';
import { getPeople } from '../person';

const mockQuery = jest.fn();

jest.mock('../person');
const mockGetPeople = mocked(getPeople).mockImplementation(
    async (): Promise<Person[]> => [
        {
            id: 1,
            archived: false,
        },
    ]
);

jest.mock('../ministry');
const mockGetMinistries = mocked(getMinistries).mockImplementation(
    async (): Promise<Ministry[]> => [
        {
            id: 1,
            archived: false,
        },
    ]
);

const spyMapMinistryDelegation = spyOn(mappers, 'mapMinistryDelegation');

beforeEach(() => {
    mockQuery.mockClear();
    mockGetPeople.mockClear();
    mockGetMinistries.mockClear();
});

describe('ministryDelegation', () => {
    describe('getMinistryDelegations', () => {
        beforeEach(() => {
            spyMapMinistryDelegation.mockClear();
        });

        it('gets all ministry delegations', async () => {
            mockQuery.mockImplementation((): DBMinistryDelegation[] => [
                {
                    ministry_id: 1,
                    person_id: 2,
                    created_by: 1,
                    creation_timestamp: new Date('2021/12/19'),
                    modified_by: 1,
                    modification_timestamp: new Date('2021/12/19'),
                    archived: 0,
                },
                {
                    ministry_id: 1,
                    person_id: 3,
                    created_by: 1,
                    creation_timestamp: new Date('2021/12/19'),
                    modified_by: 1,
                    modification_timestamp: new Date('2021/12/19'),
                    archived: 0,
                },
            ]);

            const result = await getMinistryDelegations(mockQuery, [], []);

            expect(mockQuery).toBeCalledWith({
                sql: sqlFormat(`
                    SELECT
                        ministry_id,
                        person_id,
                        created_by,
                        creation_timestamp,
                        modified_by,
                        modification_timestamp
                    FROM
                        ministry_delegation
                `),
                values: [],
            });
            expect(spyMapMinistryDelegation).toHaveBeenCalled();
            expect(result).toStrictEqual([
                {
                    archived: false,
                    createdBy: {
                        id: 1,
                    },
                    creationTimestamp: 1639872000,
                    delegee: {
                        id: 2,
                    },
                    ministry: {
                        id: 1,
                    },
                    modificationTimestamp: 1639872000,
                    modifiedBy: {
                        id: 1,
                    },
                },
                {
                    archived: false,
                    createdBy: {
                        id: 1,
                    },
                    creationTimestamp: 1639872000,
                    delegee: {
                        id: 3,
                    },
                    ministry: {
                        id: 1,
                    },
                    modificationTimestamp: 1639872000,
                    modifiedBy: {
                        id: 1,
                    },
                },
            ]);
        });

        it('gets certain ministries', async () => {
            mockQuery.mockImplementation((): DBMinistryDelegation[] => [
                {
                    ministry_id: 1,
                    person_id: 3,
                    created_by: 1,
                    creation_timestamp: new Date('2021/12/19'),
                    modified_by: 1,
                    modification_timestamp: new Date('2021/12/19'),
                    archived: 0,
                },
            ]);

            const result = await getMinistryDelegations(mockQuery, [3], [1]);

            expect(mockQuery).toBeCalledWith({
                sql: sqlFormat(`
                    SELECT
                        ministry_id,
                        person_id,
                        created_by,
                        creation_timestamp,
                        modified_by,
                        modification_timestamp
                    FROM
                        ministry_delegation
                    WHERE
                        person_id in (?)
                        and ministry_id in (?)
                    `),
                values: [[1], [3]],
            });
            expect(spyMapMinistryDelegation).toHaveBeenCalled();
            expect(result).toStrictEqual([
                {
                    archived: false,
                    createdBy: {
                        id: 1,
                    },
                    creationTimestamp: 1639872000,
                    delegee: {
                        id: 3,
                    },
                    ministry: {
                        id: 1,
                    },
                    modificationTimestamp: 1639872000,
                    modifiedBy: {
                        id: 1,
                    },
                },
            ]);
        });

        it('returns an empty array if there are no ministries', async () => {
            mockQuery.mockImplementation((): DBMinistryDelegation[] => []);

            const result = await getMinistryDelegations(mockQuery, [4], [3]);

            expect(result).toEqual([]);
        });
    });
    describe('addPersonToMinsitry', () => {
        it('adds a delegee to a ministry', async () => {
            mockQuery.mockImplementation(() => ({
                affectedRows: 1,
            }));

            await addPersonToMinsitry(mockQuery, 2, 3, 1);

            expect(mockQuery).toBeCalledWith({
                sql: sqlFormat(`
                    INSERT INTO ministry_delegation
                        (ministry_id, person_id, created_by, modified_by)
                    VALUES
                        (?, ?, ?, ?)
                `),
                values: [2, 3, 1, 1],
            });
        });

        it('throws an error if the database fails to insert row', async () => {
            mockQuery.mockImplementation(() => undefined);

            await expect(
                addPersonToMinsitry(mockQuery, 2, 3, 1)
            ).rejects.toThrowError(Error);

            expect(mockQuery).toBeCalled();
        });

        it('throws an error if the person does not exist', async () => {
            mockGetPeople.mockImplementationOnce(
                async (): Promise<Person[]> => []
            );

            await expect(
                addPersonToMinsitry(mockQuery, 2, 3, 1)
            ).rejects.toThrowError(Error);

            expect(mockQuery).toHaveBeenCalledTimes(0);
        });
        it('throws an error if the person does not exist', async () => {
            mockGetMinistries.mockImplementationOnce(
                async (): Promise<Ministry[]> => []
            );

            await expect(
                addPersonToMinsitry(mockQuery, 2, 3, 1)
            ).rejects.toThrowError(Error);

            expect(mockQuery).toHaveBeenCalledTimes(0);
        });
    });

    describe('removePersonFromMinistry', () => {
        it('removes a person from a ministry delegation', async () => {
            mockQuery.mockImplementation(
                (): DBUpdateResponse => ({
                    affectedRows: 1,
                    changedRows: 1,
                })
            );

            await removePersonFromMinistry(mockQuery, 1, 2);

            expect(mockQuery).toHaveBeenCalledWith({
                sql: sqlFormat(`
                    DELETE FROM ministry_delegation
                    WHERE
                        ministry_id = ?
                        and person_id = ?
                `),
                values: [1, 2],
            });
        });

        it('throws an error if the ministry delegation was not deleted', async () => {
            mockQuery.mockImplementation(
                (): DBUpdateResponse => ({
                    affectedRows: 0,
                    changedRows: 0,
                })
            );

            await expect(
                removePersonFromMinistry(mockQuery, 1, 2)
            ).rejects.toThrowError(DatabaseError);
        });
    });
});
