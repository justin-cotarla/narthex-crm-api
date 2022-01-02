import { UserInputError } from 'apollo-server';
import { differenceInYears, parse } from 'date-fns';
import { mocked, SpyInstance, spyOn } from 'jest-mock';
import { format as sqlFormat } from 'sql-formatter';

import { DBPerson, DBUpdateResponse } from '../../../types/database';
import { Gender, PersonAddInput } from '../../../types/generated/graphql';
import { DatabaseError, NotFoundError } from '../../../util/error';
import * as mappersModule from '../../../util/mappers';
import * as validationModule from '../../../util/validation';
import { getHouseholds } from '../household';
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

const spyMapPerson = spyOn(mappersModule, 'mapPerson');

jest.mock('../household');
const mockGetHouseholds = mocked(getHouseholds);

beforeEach(() => {
    mockQuery.mockClear();
    mockLogRecordChange.mockClear();
    mockGetHouseholds.mockClear();
});

describe('person', () => {
    describe('getPeople', () => {
        beforeEach(() => {
            spyMapPerson.mockClear();
        });

        it('gets people', async () => {
            mockQuery.mockImplementation((): DBPerson[] => [
                {
                    id: 1,
                    first_name: 'John',
                    last_name: 'Doe',
                    gender: Gender.Male,
                    household_id: 1,
                    primary_phone_number: '(514) 123-4567',
                    title: 'Mr',
                    birth_date: '1995-01-01',
                    email_address: 'email@test.com',
                    created_by: 1,
                    creation_timestamp: new Date('2021/12/19'),
                    modified_by: 1,
                    modification_timestamp: new Date('2021/12/19'),
                    archived: 0,
                },
                {
                    id: 2,
                    first_name: 'Jane',
                    last_name: 'Poe',
                    gender: Gender.Female,
                    household_id: 1,
                    birth_date: '1995-01-01',
                    created_by: 1,
                    creation_timestamp: new Date('2021/12/19'),
                    modified_by: 1,
                    modification_timestamp: new Date('2021/12/19'),
                    archived: 0,
                },
            ]);

            const result = await getPeople(mockQuery, [], {
                archived: true,
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
                `),
                values: [],
            });
            expect(spyMapPerson).toHaveBeenCalled();
            expect(result).toStrictEqual([
                {
                    age: differenceInYears(
                        new Date(),
                        parse('1995-01-01', 'yyyy-MM-dd', new Date())
                    ),
                    archived: false,
                    birthDate: '1995-01-01',
                    createdBy: {
                        id: 1,
                    },
                    creationTimestamp: 1639872000,
                    emailAddress: 'email@test.com',
                    firstName: 'John',
                    gender: 'male',
                    household: {
                        id: 1,
                    },
                    id: 1,
                    lastName: 'Doe',
                    modificationTimestamp: 1639872000,
                    modifiedBy: {
                        id: 1,
                    },
                    phoneNumber: '(514) 123-4567',
                    title: 'Mr',
                },
                {
                    age: differenceInYears(
                        new Date(),
                        parse('1995-01-01', 'yyyy-MM-dd', new Date())
                    ),
                    archived: false,
                    birthDate: '1995-01-01',
                    createdBy: {
                        id: 1,
                    },
                    creationTimestamp: 1639872000,
                    emailAddress: undefined,
                    firstName: 'Jane',
                    gender: 'female',
                    household: {
                        id: 1,
                    },
                    id: 2,
                    lastName: 'Poe',
                    modificationTimestamp: 1639872000,
                    modifiedBy: {
                        id: 1,
                    },
                    phoneNumber: undefined,
                    title: undefined,
                },
            ]);
        });

        it('gets unarchived people', async () => {
            mockQuery.mockImplementation((): DBPerson[] => [
                {
                    id: 2,
                    first_name: 'Jane',
                    last_name: 'Poe',
                    gender: Gender.Female,
                    household_id: 1,
                    birth_date: '1995-01-01',
                    created_by: 1,
                    creation_timestamp: new Date('2021/12/19'),
                    modified_by: 1,
                    modification_timestamp: new Date('2021/12/19'),
                    archived: 0,
                },
            ]);

            const result = await getPeople(mockQuery, []);

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
            expect(spyMapPerson).toHaveBeenCalled();
            expect(result).toStrictEqual([
                {
                    age: differenceInYears(
                        new Date(),
                        parse('1995-01-01', 'yyyy-MM-dd', new Date())
                    ),
                    archived: false,
                    birthDate: '1995-01-01',
                    createdBy: {
                        id: 1,
                    },
                    creationTimestamp: 1639872000,
                    emailAddress: undefined,
                    firstName: 'Jane',
                    gender: 'female',
                    household: {
                        id: 1,
                    },
                    id: 2,
                    lastName: 'Poe',
                    modificationTimestamp: 1639872000,
                    modifiedBy: {
                        id: 1,
                    },
                    phoneNumber: undefined,
                    title: undefined,
                },
            ]);
        });

        it('gets people by id', async () => {
            mockQuery.mockImplementation((): DBPerson[] => [
                {
                    id: 2,
                    first_name: 'Jane',
                    last_name: 'Poe',
                    gender: Gender.Female,
                    household_id: 1,
                    birth_date: '1995-01-01',
                    created_by: 1,
                    creation_timestamp: new Date('2021/12/19'),
                    modified_by: 1,
                    modification_timestamp: new Date('2021/12/19'),
                    archived: 0,
                },
            ]);

            const result = await getPeople(mockQuery, [2]);

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
                        and archived <> 1
                `),
                values: [[2]],
            });
            expect(spyMapPerson).toHaveBeenCalled();
            expect(result).toStrictEqual([
                {
                    age: differenceInYears(
                        new Date(),
                        parse('1995-01-01', 'yyyy-MM-dd', new Date())
                    ),
                    archived: false,
                    birthDate: '1995-01-01',
                    createdBy: {
                        id: 1,
                    },
                    creationTimestamp: 1639872000,
                    emailAddress: undefined,
                    firstName: 'Jane',
                    gender: 'female',
                    household: {
                        id: 1,
                    },
                    id: 2,
                    lastName: 'Poe',
                    modificationTimestamp: 1639872000,
                    modifiedBy: {
                        id: 1,
                    },
                    phoneNumber: undefined,
                    title: undefined,
                },
            ]);
        });

        it('returns an empty array if there are no people', async () => {
            mockQuery.mockImplementation((): DBPerson[] => []);

            const result = await getPeople(mockQuery, [4]);

            expect(result).toEqual([]);
        });
    });
    describe('addPerson', () => {
        let spyValidatePersonProperties: SpyInstance<unknown, unknown[]>;

        beforeEach(() => {
            spyValidatePersonProperties = spyOn(
                personModule,
                '_validatePersonProperties'
            ).mockImplementation(jest.fn());
        });

        afterEach(() => {
            spyValidatePersonProperties.mockRestore();
        });

        it('adds a new person', async () => {
            mockQuery.mockImplementation(() => ({
                insertId: 1,
            }));

            mockGetHouseholds.mockImplementation(async () => [
                {
                    id: 1,
                },
            ]);

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

            expect(spyValidatePersonProperties).toBeCalled();
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
                            created_by,
                            modified_by,
                            household_id
                        )
                    VALUES
                        (?, ?, ?, ?, ?, ?, ?)
                `),
                values: ['Jane', 'Poe', 'female', '1995-01-01', 1, 1, 1],
            });
        });

        it('throws an error if the database fails to insert row', async () => {
            mockQuery.mockImplementation(() => undefined);
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
            ).rejects.toThrowError(Error);

            expect(spyValidatePersonProperties).toBeCalled();
            expect(mockQuery).toBeCalled();
        });
    });

    describe('updatePerson', () => {
        let spyValidatePersonProperties: SpyInstance<unknown, unknown[]>;
        let spyGetPeople: SpyInstance<unknown, unknown[]>;

        beforeEach(() => {
            spyValidatePersonProperties = spyOn(
                personModule,
                '_validatePersonProperties'
            ).mockImplementation(jest.fn());
            spyGetPeople = spyOn(personModule, 'getPeople');
        });

        afterEach(() => {
            spyValidatePersonProperties.mockRestore();
            spyGetPeople.mockRestore();
        });
        it('updates a person', async () => {
            spyGetPeople.mockImplementation(() => ['person']);
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
                    firstName: 'Jane',
                    lastName: 'Doe',
                },
                2
            );

            expect(spyGetPeople).toHaveBeenCalled();
            expect(spyValidatePersonProperties).toHaveBeenCalled();

            expect(mockQuery).toHaveBeenCalledWith({
                sql: sqlFormat(`
                    UPDATE
                        person
                    SET
                        modified_by = ?,
                        first_name = ?,
                        last_name = ?
                    WHERE
                        ID = ?;
                `),
                values: [2, 'Jane', 'Doe', 1],
            });

            expect(mockLogRecordChange).toHaveBeenCalledWith('person', 1, 2);
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
            spyGetPeople.mockImplementationOnce(() => ['person']);

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
            spyGetPeople.mockImplementation(() => ['person']);
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
            expect(mockLogRecordChange).toHaveBeenCalledWith('person', 1, 2);
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
        let spyValidateRecordName: SpyInstance<unknown, unknown[]>;
        let spyValidateBirthDate: SpyInstance<unknown, unknown[]>;
        let spyValidateEmail: SpyInstance<unknown, unknown[]>;

        beforeEach(() => {
            spyValidateRecordName = spyOn(
                validationModule,
                'validateRecordName'
            ).mockImplementation(() => true);
            spyValidateBirthDate = spyOn(
                validationModule,
                'validateBirthDate'
            ).mockImplementation(() => true);
            spyValidateEmail = spyOn(
                validationModule,
                'validateEmail'
            ).mockImplementation(() => true);
        });

        afterEach(() => {
            spyValidateRecordName.mockRestore();
            spyValidateBirthDate.mockRestore();
            spyValidateEmail.mockRestore();
        });

        it('accepts valid person properties', () => {
            _validatePersonProperties({
                birthDate: '1995-01-01',
                emailAddress: 'email@example.com',
                firstName: 'Jane',
                lastName: 'Poe',
            } as PersonAddInput);
        });

        it('throws an error given an invalid first name', () => {
            spyValidateRecordName.mockImplementation(() => false);

            expect(() => {
                _validatePersonProperties({
                    birthDate: '1995-01-01',
                    emailAddress: 'email@example.com',
                    firstName: 'J',
                    lastName: 'Poe',
                } as PersonAddInput);
            }).toThrowError(UserInputError);
        });

        it('throws an error given an invalid last name', () => {
            spyValidateRecordName.mockImplementationOnce(() => true);
            spyValidateRecordName.mockImplementationOnce(() => false);

            expect(() => {
                _validatePersonProperties({
                    birthDate: '1995-01-01',
                    emailAddress: 'email@example.com',
                    firstName: 'Jane',
                    lastName: 'P',
                } as PersonAddInput);
            }).toThrowError(UserInputError);
        });

        it('throws an error given an invalid email address', () => {
            spyValidateEmail.mockImplementation(() => false);

            expect(() => {
                _validatePersonProperties({
                    birthDate: '1995-01-01',
                    emailAddress: 's',
                    firstName: 'Jane',
                    lastName: 'Poe',
                } as PersonAddInput);
            }).toThrowError(UserInputError);
        });

        it('throws an error given an invalid date of birth', () => {
            spyValidateBirthDate.mockImplementation(() => false);

            expect(() => {
                _validatePersonProperties({
                    birthDate: '95-01-01',
                    emailAddress: 'email@example.com',
                    firstName: 'Jane',
                    lastName: 'Poe',
                } as PersonAddInput);
            }).toThrowError(UserInputError);
        });
    });
});
