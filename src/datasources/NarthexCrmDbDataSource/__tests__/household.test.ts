import { UserInputError } from 'apollo-server';
import { mocked, SpyInstance, spyOn } from 'jest-mock';
import { format as sqlFormat } from 'sql-formatter';

import { mockDBHousehold } from '../../../__mocks__/database';
import { mockHousehold, mockPerson } from '../../../__mocks__/schema';
import { DBHousehold, DBUpdateResponse } from '../../../types/database';
import {
    HouseholdAddInput,
    HouseholdSortKey,
    SortOrder,
} from '../../../types/generated/graphql';
import { DatabaseError, NotFoundError } from '../../../util/error';
import { validateRecordName, validateAddress } from '../../../util/validation';
import * as householdModule from '../household';
import {
    addHousehold,
    archiveHousehold,
    getHouseholds,
    updateHousehold,
    clearHouseholdHead,
    _validateHouseholdProperties,
} from '../household';
import { getPeople } from '../person';

const mockQuery = jest.fn();
const mockLogRecordChange = jest.fn();

jest.mock('../person');
const mockGetPeople = mocked(getPeople);

jest.mock('../../../util/validation');
const mockValidateRecordName = mocked(validateRecordName).mockImplementation(
    () => true
);
const mockValidateAddress = mocked(validateAddress).mockImplementation(
    () => true
);

beforeEach(() => {
    mockQuery.mockClear();
    mockLogRecordChange.mockClear();
    mockGetPeople.mockClear();
    mockValidateRecordName.mockClear();
    mockValidateAddress.mockClear();
});

describe('household', () => {
    describe('getHouseholds', () => {
        it('gets households with default arguments', async () => {
            mockQuery.mockImplementation((): DBHousehold[] => [
                mockDBHousehold,
            ]);

            await getHouseholds(mockQuery);

            expect(mockQuery).toBeCalledWith({
                sql: sqlFormat(`
                    SELECT
                        id,
                        head_id,
                        name,
                        address_line_1,
                        address_line_2,
                        city,
                        state,
                        postal_code,
                        country,
                        created_by,
                        creation_timestamp,
                        modified_by,
                        modification_timestamp,
                        archived
                    FROM
                        household
                    WHERE
                        archived <> 1
                `),
                values: [],
            });
        });

        it('gets households with all arguments', async () => {
            mockQuery.mockImplementation((): DBHousehold[] => [
                mockDBHousehold,
            ]);

            await getHouseholds(mockQuery, {
                archived: true,
                householdIds: [1],
                sortKey: HouseholdSortKey.Id,
                paginationOptions: {
                    limit: 1,
                    offset: 1,
                    sortOrder: SortOrder.Desc,
                },
            });

            expect(mockQuery).toBeCalledWith({
                sql: sqlFormat(`
                    SELECT
                        id,
                        head_id,
                        name,
                        address_line_1,
                        address_line_2,
                        city,
                        state,
                        postal_code,
                        country,
                        created_by,
                        creation_timestamp,
                        modified_by,
                        modification_timestamp,
                        archived
                    FROM
                        household
                    WHERE
                        id in (?)
                    order by
                        ID DESC
                    limit
                        1 offset 1
                `),
                values: [[1]],
            });
        });

        it('returns an empty array if query returns nothing', async () => {
            mockQuery.mockImplementation(() => undefined);

            const result = await getHouseholds(mockQuery);

            expect(result).toStrictEqual([]);
        });
    });
    describe('addHousehold', () => {
        it('adds a minimal household', async () => {
            mockQuery.mockImplementation(() => ({
                insertId: 1,
            }));

            const result = await addHousehold(
                mockQuery,
                {
                    address: {
                        line1: '123 rue Guy',
                        city: 'Anjou',
                        state: 'Quebec',
                        postalCode: 'H0H 0H0',
                        country: 'CA',
                    },
                    name: 'Smith Family',
                },
                1
            );

            expect(result).toBe(1);
            expect(mockQuery).toBeCalledWith({
                sql: sqlFormat(`
                    INSERT INTO
                        household (
                            name,
                            address_line_1,
                            city,
                            state,
                            postal_code,
                            country,
                            created_by,
                            modified_by
                        )
                    VALUES
                        (?, ?, ?, ?, ?, ?, ?, ?)
                `),
                values: [
                    'Smith Family',
                    '123 rue Guy',
                    'Anjou',
                    'Quebec',
                    'H0H 0H0',
                    'CA',
                    1,
                    1,
                ],
            });
        });

        it('adds a full household', async () => {
            mockQuery.mockImplementation(() => ({
                insertId: 1,
            }));

            const result = await addHousehold(
                mockQuery,
                {
                    address: {
                        line1: '123 rue Guy',
                        line2: 'Apt 123',
                        city: 'Anjou',
                        state: 'Quebec',
                        postalCode: 'H0H 0H0',
                        country: 'CA',
                    },
                    name: 'Smith Family',
                },
                1
            );

            expect(result).toBe(1);
            expect(mockQuery).toBeCalledWith({
                sql: sqlFormat(`
                    INSERT INTO
                        household (
                            name,
                            address_line_1,
                            city,
                            state,
                            postal_code,
                            country,
                            created_by,
                            modified_by,
                            address_line_2
                        )
                    VALUES
                        (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `),
                values: [
                    'Smith Family',
                    '123 rue Guy',
                    'Anjou',
                    'Quebec',
                    'H0H 0H0',
                    'CA',
                    1,
                    1,
                    'Apt 123',
                ],
            });
        });

        it('throws an error if the database fails to insert row', async () => {
            mockQuery.mockImplementation(() => undefined);
            await expect(
                addHousehold(
                    mockQuery,
                    {
                        address: {
                            line1: '123 rue Guy',
                            line2: 'Apt 123',
                            city: 'Anjou',
                            state: 'Quebec',
                            postalCode: 'H0H 0H0',
                            country: 'CA',
                        },
                        name: 'Smith Family',
                    },
                    1
                )
            ).rejects.toThrowError(Error);

            expect(mockQuery).toBeCalled();
        });
    });

    describe('updateHousehold', () => {
        let spyGetHouseholds: SpyInstance<unknown, unknown[]>;

        beforeEach(() => {
            spyGetHouseholds = spyOn(householdModule, 'getHouseholds');
        });

        afterEach(() => {
            spyGetHouseholds.mockRestore();
        });
        it('updates a household', async () => {
            spyGetHouseholds.mockImplementation(() => [mockHousehold]);
            mockGetPeople.mockImplementation(async () => [mockPerson]);
            mockQuery.mockImplementation(
                (): DBUpdateResponse => ({
                    affectedRows: 1,
                    changedRows: 1,
                })
            );

            await updateHousehold(
                mockQuery,
                mockLogRecordChange,
                {
                    id: 1,
                    headId: 1,
                    address: {
                        line1: '123 rue Guy',
                        line2: 'Apt 123',
                        city: 'Anjou',
                        state: 'Quebec',
                        postalCode: 'H0H 0H0',
                        country: 'CA',
                    },
                    name: 'Smith Family',
                },
                2
            );

            expect(spyGetHouseholds).toHaveBeenCalled();

            expect(mockQuery).toHaveBeenCalledWith({
                sql: sqlFormat(`
                    UPDATE
                        household
                    SET
                        modified_by = ?,
                        name = ?,
                        head_id = ?,
                        address_line_1 = ?,
                        address_line_2 = ?,
                        city = ?,
                        state = ?,
                        postal_code = ?,
                        country = ?
                    WHERE
                        ID = ?;
                `),
                values: [
                    2,
                    'Smith Family',
                    1,
                    '123 rue Guy',
                    'Apt 123',
                    'Anjou',
                    'Quebec',
                    'H0H 0H0',
                    'CA',
                    1,
                ],
            });

            expect(mockLogRecordChange).toHaveBeenCalledWith('household', 1, 2);
        });

        it('throws an error if the provided head does not exist', async () => {
            spyGetHouseholds.mockImplementation(() => [mockHousehold]);
            mockGetPeople.mockImplementation(async () => []);

            await expect(
                updateHousehold(
                    mockQuery,
                    mockLogRecordChange,
                    {
                        id: 1,
                        headId: 1,
                    },
                    2
                )
            ).rejects.toThrowError(UserInputError);

            expect(spyGetHouseholds).toHaveBeenCalled();
            expect(mockGetPeople).toHaveBeenCalled();

            expect(mockQuery).toHaveBeenCalledTimes(0);
            expect(mockLogRecordChange).toHaveBeenCalledTimes(0);
        });

        it('throws an error if the provided head is not part of the household', async () => {
            spyGetHouseholds.mockImplementation(() => [mockHousehold]);
            mockGetPeople.mockImplementation(async () => [
                {
                    ...mockPerson,
                    household: {
                        id: 10,
                    },
                },
            ]);

            await expect(
                updateHousehold(
                    mockQuery,
                    mockLogRecordChange,
                    {
                        id: 2,
                        headId: 1,
                    },
                    2
                )
            ).rejects.toThrowError(UserInputError);

            expect(spyGetHouseholds).toHaveBeenCalled();
            expect(mockGetPeople).toHaveBeenCalled();

            expect(mockQuery).toHaveBeenCalledTimes(0);
            expect(mockLogRecordChange).toHaveBeenCalledTimes(0);
        });

        it('throws an error if the household does not exist', async () => {
            spyGetHouseholds.mockImplementationOnce((): DBHousehold[] => []);

            await expect(
                updateHousehold(
                    mockQuery,
                    mockLogRecordChange,
                    {
                        id: 10,
                        name: 'Smith Family',
                    },
                    2
                )
            ).rejects.toThrowError(NotFoundError);

            expect(mockQuery).toHaveBeenCalledTimes(0);
        });

        it('throws an error if no changes are provided', async () => {
            spyGetHouseholds.mockImplementationOnce(() => ['household']);

            await expect(
                updateHousehold(
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

        it('throws an error if the household was not updated on the database', async () => {
            spyGetHouseholds.mockImplementation(() => [mockHousehold]);
            mockQuery.mockImplementation(
                (): DBUpdateResponse => ({
                    affectedRows: 0,
                    changedRows: 0,
                })
            );

            await expect(
                updateHousehold(
                    mockQuery,
                    mockLogRecordChange,
                    {
                        id: 1,
                        name: 'Smith Family',
                    },
                    2
                )
            ).rejects.toThrowError(DatabaseError);
        });
    });

    describe('archiveHousehold', () => {
        it('archives a household', async () => {
            mockGetPeople.mockImplementation(async () => []);
            mockQuery.mockImplementation(
                (): DBUpdateResponse => ({
                    affectedRows: 1,
                    changedRows: 1,
                })
            );

            await archiveHousehold(mockQuery, mockLogRecordChange, 1, 2);

            expect(mockQuery).toHaveBeenNthCalledWith(1, {
                sql: sqlFormat(`
                    UPDATE household
                    SET
                        archived = 1
                    WHERE ID = ?;
                `),
                values: [1],
            });
            expect(mockGetPeople).toHaveBeenCalled();
            expect(mockLogRecordChange).toHaveBeenCalledWith('household', 1, 2);
        });

        it('throws an error if the household has people', async () => {
            mockGetPeople.mockImplementation(async () => [mockPerson]);
            mockQuery.mockImplementation(
                (): DBUpdateResponse => ({
                    affectedRows: 1,
                    changedRows: 1,
                })
            );

            await expect(
                archiveHousehold(mockQuery, mockLogRecordChange, 1, 2)
            ).rejects.toThrowError(UserInputError);

            expect(mockGetPeople).toHaveBeenCalled();
            expect(mockLogRecordChange).toHaveBeenCalledTimes(0);
        });

        it('throws an error if the household was not archived on the database', async () => {
            mockGetPeople.mockImplementation(async () => []);
            mockQuery.mockImplementation(
                (): DBUpdateResponse => ({
                    affectedRows: 0,
                    changedRows: 0,
                })
            );

            await expect(
                archiveHousehold(mockQuery, mockLogRecordChange, 1, 2)
            ).rejects.toThrowError(DatabaseError);
        });
    });

    describe('_validateHouseholdProperties', () => {
        it('validates all household properties', () => {
            _validateHouseholdProperties({
                address: {
                    line1: '123 rue Guy',
                    city: 'Anjou',
                    state: 'Quebec',
                    postalCode: 'H0H 0H0',
                    country: 'CA',
                },
                name: 'Smith Family',
            } as HouseholdAddInput);
            expect(mockValidateRecordName).toBeCalled();
            expect(mockValidateAddress).toBeCalled();
        });
    });

    describe('clearHouseholdHead', () => {
        it('clears the household head', async () => {
            await clearHouseholdHead(mockQuery, 1);

            expect(mockQuery).toHaveBeenCalledWith({
                sql: sqlFormat(`
                    UPDATE
                        household
                    SET
                        head_id = null
                    WHERE
                        head_id = ?;
                `),
                values: [1],
            });
        });
    });
});
