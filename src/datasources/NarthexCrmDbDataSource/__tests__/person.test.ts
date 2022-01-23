import { UserInputError } from 'apollo-server';
import { mocked, SpyInstance, spyOn } from 'jest-mock';
import { format as sqlFormat } from 'sql-formatter';

import { mockDBPerson } from '../../../__mocks__/database';
import { mockHousehold, mockPerson } from '../../../__mocks__/schema';
import {
    DBPerson,
    DBUpdateResponse,
    RecordTable,
} from '../../../types/database';
import {
    Gender,
    Person,
    PersonSortKey,
    SortOrder,
} from '../../../types/generated/graphql';
import { DatabaseError, NotFoundError } from '../../../util/error';
import {
    validateRecordName,
    validateDate,
    validateEmail,
} from '../../../util/validation';
import { clearHouseholdHead, getHouseholds } from '../household';
import * as personModule from '../person';
import {
    addPerson,
    archivePerson,
    getPeople,
    updatePerson,
    _validatePersonProperties,
} from '../person';

const mockQuery = jest.fn();
const mockLogRecordChange = jest.fn();

jest.mock('../household');
const mockGetHouseholds = mocked(getHouseholds);
const mockClearHouseholdHead = mocked(clearHouseholdHead);

jest.mock('../../../util/validation');
const mockValidateRecordName = mocked(validateRecordName).mockImplementation(
    () => true
);
const mockValidateDate = mocked(validateDate).mockImplementation(() => true);
const mockValidateEmail = mocked(validateEmail).mockImplementation(() => true);

beforeEach(() => {
    mockQuery.mockClear();
    mockLogRecordChange.mockClear();
    mockGetHouseholds.mockClear();
    mockClearHouseholdHead.mockClear();
    mockValidateRecordName.mockClear();
    mockValidateDate.mockClear();
    mockValidateEmail.mockClear();
});

describe('person', () => {
    describe('getPeople', () => {
        it('gets people with default arguments', async () => {
            mockQuery.mockImplementation((): DBPerson[] => [mockDBPerson]);

            await getPeople(mockQuery);

            expect(mockQuery).toBeCalledWith({
                sql: sqlFormat(`
                    SELECT
                        id,
                        first_name,
                        last_name,
                        gender,
                        primary_phone_number,
                        email_address,
                        birth_date,
                        title,
                        created_by,
                        creation_timestamp,
                        modified_by,
                        modification_timestamp,
                        archived,
                        household_id
                    FROM
                        person
                    WHERE
                        archived <> 1
                `),
                values: [],
            });
        });

        it('gets people with all arguments', async () => {
            mockQuery.mockImplementation((): DBPerson[] => [mockDBPerson]);

            await getPeople(mockQuery, {
                archived: true,
                householdIds: [1],
                sortKey: PersonSortKey.Id,
                paginationOptions: {
                    limit: 1,
                    offset: 1,
                    sortOrder: SortOrder.Desc,
                },
                personIds: [2],
            });

            expect(mockQuery).toBeCalledWith({
                sql: sqlFormat(`
                    SELECT
                        id,
                        first_name,
                        last_name,
                        gender,
                        primary_phone_number,
                        email_address,
                        birth_date,
                        title,
                        created_by,
                        creation_timestamp,
                        modified_by,
                        modification_timestamp,
                        archived,
                        household_id
                    FROM
                        person
                    WHERE
                        id in (?)
                        and household_id in (?)
                    order by
                        ID DESC
                    limit
                        1 offset 1
                `),
                values: [[2], [1]],
            });
        });

        it('returns an empty array if query returns nothing', async () => {
            mockQuery.mockImplementation(() => undefined);

            const result = await getPeople(mockQuery, { personIds: [4] });

            expect(result).toEqual([]);
        });
    });
    describe('addPerson', () => {
        it('adds a minimal person', async () => {
            mockQuery.mockImplementation(() => ({
                insertId: 1,
            }));

            mockGetHouseholds.mockImplementation(async () => [mockHousehold]);

            const result = await addPerson(
                mockQuery,
                {
                    firstName: 'Jane',
                    lastName: 'Poe',
                    gender: Gender.Female,
                    householdId: 1,
                    birthDate: '1995-01-01',
                },
                1
            );

            expect(mockGetHouseholds).toBeCalled();
            expect(result).toBe(1);
            expect(mockQuery).toBeCalledWith({
                sql: sqlFormat(`
                    INSERT INTO
                        person (
                            first_name,
                            last_name,
                            gender,
                            birth_date,
                            household_id,
                            created_by,
                            modified_by
                        )
                    VALUES
                        (?, ?, ?, ?, ?, ?, ?)
                `),
                values: ['Jane', 'Poe', 'female', '1995-01-01', 1, 1, 1],
            });
        });

        it('adds a full person', async () => {
            mockQuery.mockImplementation(() => ({
                insertId: 1,
            }));

            mockGetHouseholds.mockImplementation(async () => [mockHousehold]);

            const result = await addPerson(
                mockQuery,
                {
                    firstName: 'Jane',
                    lastName: 'Poe',
                    gender: Gender.Female,
                    householdId: 1,
                    birthDate: '1995-01-01',
                    emailAddress: 'email@test.com',
                    phoneNumber: '(514) 123-4567',
                    title: 'Mr',
                },
                1
            );

            expect(mockGetHouseholds).toBeCalled();
            expect(result).toBe(1);
            expect(mockQuery).toBeCalledWith({
                sql: sqlFormat(`
                    INSERT INTO
                        person (
                            first_name,
                            last_name,
                            gender,
                            birth_date,
                            household_id,
                            created_by,
                            modified_by,
                            primary_phone_number,
                            email_address,
                            title
                        )
                    VALUES
                        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `),
                values: [
                    'Jane',
                    'Poe',
                    'female',
                    '1995-01-01',
                    1,
                    1,
                    1,
                    '(514) 123-4567',
                    'email@test.com',
                    'Mr',
                ],
            });
        });

        it('throws an error if the household does not exist', async () => {
            mockQuery.mockImplementation(() => ({
                insertId: 1,
            }));

            mockGetHouseholds.mockImplementation(async () => []);

            await expect(
                addPerson(
                    mockQuery,
                    {
                        firstName: 'Jane',
                        lastName: 'Poe',
                        gender: Gender.Female,
                        householdId: 1,
                        birthDate: '19-01-01',
                    },
                    1
                )
            ).rejects.toThrowError(UserInputError);

            expect(mockQuery).toBeCalledTimes(0);
        });

        it('throws an error if the database fails to insert row', async () => {
            mockQuery.mockImplementation(() => undefined);
            mockGetHouseholds.mockImplementation(async () => [mockHousehold]);

            await expect(
                addPerson(
                    mockQuery,
                    {
                        firstName: 'Jane',
                        lastName: 'Poe',
                        gender: Gender.Female,
                        householdId: 1,
                        birthDate: '19-01-01',
                    },
                    1
                )
            ).rejects.toThrowError(DatabaseError);

            expect(mockQuery).toBeCalled();
        });
    });

    describe('updatePerson', () => {
        let spyGetPeople: SpyInstance<unknown, unknown[]>;

        beforeEach(() => {
            spyGetPeople = spyOn(personModule, 'getPeople');
        });

        afterEach(() => {
            spyGetPeople.mockRestore();
        });
        it('updates a person', async () => {
            spyGetPeople.mockImplementation((): Person[] => [
                { ...mockPerson, household: { id: 1 } },
            ]);
            mockGetHouseholds.mockImplementation(async () => [mockHousehold]);
            mockQuery.mockImplementation(
                (): DBUpdateResponse => ({
                    affectedRows: 1,
                    changedRows: 1,
                })
            );

            await updatePerson(
                mockQuery,
                mockLogRecordChange,
                {
                    id: 1,
                    birthDate: '1995-01-01',
                    emailAddress: 'email@test.com',
                    firstName: 'John',
                    gender: Gender.Male,
                    householdId: 2,
                    lastName: 'Doe',
                    phoneNumber: '(514) 123-4567',
                    title: 'Mr',
                },
                2
            );

            expect(spyGetPeople).toHaveBeenCalled();

            expect(mockQuery).toHaveBeenCalledWith({
                sql: sqlFormat(`
                    UPDATE
                        person
                    SET
                        modified_by = ?,
                        first_name = ?,
                        last_name = ?,
                        household_id = ?,
                        gender = ?,
                        birth_date = ?,
                        primary_phone_number = ?,
                        email_address = ?,
                        title = ?
                    WHERE
                        ID = ?;
                `),
                values: [
                    2,
                    'John',
                    'Doe',
                    2,
                    'male',
                    '1995-01-01',
                    '(514) 123-4567',
                    'email@test.com',
                    'Mr',
                    1,
                ],
            });
            expect(clearHouseholdHead).toHaveBeenCalledTimes(1);
            expect(mockLogRecordChange).toHaveBeenCalledWith(
                RecordTable.PERSON,
                1,
                2
            );
        });

        it('does not clear the household if a new household is not provided', async () => {
            spyGetPeople.mockImplementation((): Person[] => [mockPerson]);
            mockGetHouseholds.mockImplementation(async () => [mockHousehold]);
            mockQuery.mockImplementation(
                (): DBUpdateResponse => ({
                    affectedRows: 1,
                    changedRows: 1,
                })
            );

            await updatePerson(
                mockQuery,
                mockLogRecordChange,
                {
                    id: 1,
                    firstName: 'John',
                },
                2
            );

            expect(spyGetPeople).toHaveBeenCalled();

            expect(mockQuery).toHaveBeenCalled();

            expect(clearHouseholdHead).toHaveBeenCalledTimes(0);

            expect(mockLogRecordChange).toHaveBeenCalledWith(
                RecordTable.PERSON,
                1,
                2
            );
        });

        it('does not clear the household head if the household is not changed', async () => {
            spyGetPeople.mockImplementation((): Person[] => [
                { ...mockPerson, household: { id: 1 } },
            ]);
            mockGetHouseholds.mockImplementation(async () => [mockHousehold]);
            mockQuery.mockImplementation(
                (): DBUpdateResponse => ({
                    affectedRows: 1,
                    changedRows: 1,
                })
            );

            await updatePerson(
                mockQuery,
                mockLogRecordChange,
                {
                    id: 1,
                    householdId: 1,
                },
                2
            );

            expect(spyGetPeople).toHaveBeenCalled();

            expect(mockQuery).toHaveBeenCalled();

            expect(clearHouseholdHead).toHaveBeenCalledTimes(0);

            expect(mockLogRecordChange).toHaveBeenCalledWith(
                RecordTable.PERSON,
                1,
                2
            );
        });

        it('throws an error if the household does not exist', async () => {
            spyGetPeople.mockImplementation((): Person[] => [
                { ...mockPerson, household: { id: 1 } },
            ]);
            mockGetHouseholds.mockImplementation(async () => []);
            mockQuery.mockImplementation(() => ({
                insertId: 1,
            }));

            mockGetHouseholds.mockImplementation(async () => []);

            await expect(
                updatePerson(
                    mockQuery,
                    mockLogRecordChange,
                    {
                        id: 1,
                        householdId: 2,
                    },
                    1
                )
            ).rejects.toThrowError(UserInputError);

            expect(mockQuery).toBeCalledTimes(0);
        });
        it('throws an error if the person does not exists', async () => {
            spyGetPeople.mockImplementationOnce((): DBPerson[] => []);

            await expect(
                updatePerson(
                    mockQuery,
                    mockLogRecordChange,
                    {
                        id: 10,
                        birthDate: '1995-01-01',
                    },
                    2
                )
            ).rejects.toThrowError(NotFoundError);

            expect(mockQuery).toHaveBeenCalledTimes(0);
        });

        it('throws an error if no changes are provided', async () => {
            spyGetPeople.mockImplementationOnce(() => [mockPerson]);

            await expect(
                updatePerson(
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

        it('throws an error if the person was not updated on the database', async () => {
            spyGetPeople.mockImplementation(() => [mockPerson]);
            mockQuery.mockImplementation(
                (): DBUpdateResponse => ({
                    affectedRows: 0,
                    changedRows: 0,
                })
            );

            await expect(
                updatePerson(
                    mockQuery,
                    mockLogRecordChange,
                    {
                        id: 1,
                        birthDate: '1995-01-01',
                    },
                    2
                )
            ).rejects.toThrowError(DatabaseError);
        });
    });

    describe('archivePerson', () => {
        it('archives a person', async () => {
            mockQuery.mockImplementation(
                (): DBUpdateResponse => ({
                    affectedRows: 1,
                    changedRows: 1,
                })
            );

            await archivePerson(mockQuery, mockLogRecordChange, 1, 2);

            expect(mockQuery).toHaveBeenNthCalledWith(1, {
                sql: sqlFormat(`
                    UPDATE person
                    SET
                        archived = 1
                    WHERE ID = ?;
                `),
                values: [1],
            });
            expect(clearHouseholdHead).toHaveBeenCalled();
            expect(mockLogRecordChange).toHaveBeenCalledWith(
                RecordTable.PERSON,
                1,
                2
            );
        });

        it('throws an error if the person was not archived on the database', async () => {
            mockQuery.mockImplementation(
                (): DBUpdateResponse => ({
                    affectedRows: 0,
                    changedRows: 0,
                })
            );

            await expect(
                archivePerson(mockQuery, mockLogRecordChange, 1, 2)
            ).rejects.toThrowError(DatabaseError);
        });
    });

    describe('_validatePersonProperties', () => {
        it('validates all person properties', () => {
            _validatePersonProperties({
                id: 1,
                birthDate: '1995-01-01',
                emailAddress: 'email@example.com',
                firstName: 'Jane',
                lastName: 'Poe',
            });

            expect(mockValidateRecordName).toHaveBeenCalled();
            expect(mockValidateDate).toHaveBeenCalled();
            expect(mockValidateEmail).toHaveBeenCalled();
        });
    });
});
