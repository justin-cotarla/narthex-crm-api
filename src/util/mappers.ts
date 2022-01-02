import { differenceInYears, getUnixTime, parse } from 'date-fns';

import {
    DBClient,
    DBHousehold,
    DBMinistry,
    DBMinistryDelegation,
    DBPerson,
    DBRecord,
} from '../types/database';
import {
    Client,
    Household,
    Ministry,
    MinistryDelegation,
    Person,
    Record,
} from '../types/generated/graphql';

const mapRecord = (dbRecord: DBRecord): Record => ({
    createdBy: {
        id: dbRecord.created_by!,
    },
    creationTimestamp:
        dbRecord.creation_timestamp && getUnixTime(dbRecord.creation_timestamp),
    modifiedBy: {
        id: dbRecord.modified_by!,
    },
    modificationTimestamp:
        dbRecord.modification_timestamp &&
        getUnixTime(dbRecord.modification_timestamp),
    archived: Boolean(dbRecord.archived),
});

const mapClient = (dbClient: DBClient): Client => ({
    id: dbClient.id,
    emailAddress: dbClient.email_address,
    permissionScope: dbClient.permission_scope,
    active: Boolean(dbClient.active),
    lastLoginTimestamp:
        dbClient.last_login_timestamp &&
        getUnixTime(dbClient.last_login_timestamp),
    creationTimestamp:
        dbClient.creation_timestamp && getUnixTime(dbClient.creation_timestamp),
});

const mapMinistry = (dbMinistry: DBMinistry): Ministry => ({
    id: dbMinistry.id,
    name: dbMinistry.name,
    color: `#${dbMinistry.color?.toString(16).padStart(6, '0').toUpperCase()}`,
    ...mapRecord(dbMinistry),
});

const mapHousehold = (dbHousehold: DBHousehold): Household => ({
    id: dbHousehold.id,
    name: dbHousehold.name,
    ...(dbHousehold.head_id
        ? {
              head: {
                  id: dbHousehold.head_id,
              },
          }
        : {}),
    address: {
        line1: dbHousehold.address_line_1,
        line2: dbHousehold.address_line_2,
        city: dbHousehold.city,
        state: dbHousehold.state,
        postalCode: dbHousehold.postal_code,
        country: dbHousehold.country,
    },
    ...mapRecord(dbHousehold),
});

const mapPerson = (dbPerson: DBPerson): Person => ({
    id: dbPerson.id,
    firstName: dbPerson.first_name,
    lastName: dbPerson.last_name,
    gender: dbPerson.gender,
    household: {
        id: dbPerson.household_id,
    },
    phoneNumber: dbPerson.primary_phone_number,
    emailAddress: dbPerson.email_address,
    birthDate: dbPerson.birth_date,
    title: dbPerson.title,
    age: differenceInYears(
        new Date(),
        parse(dbPerson.birth_date, 'yyyy-MM-dd', new Date())
    ),
    ...mapRecord(dbPerson),
});

const mapMinistryDelegation = (
    dbMinistryDelegation: DBMinistryDelegation
): MinistryDelegation => ({
    delegee: {
        id: dbMinistryDelegation.person_id,
    },
    ministry: {
        id: dbMinistryDelegation.ministry_id,
    },
    ...mapRecord({ ...dbMinistryDelegation, archived: 0 }),
});

export {
    mapClient,
    mapMinistry,
    mapHousehold,
    mapPerson,
    mapMinistryDelegation,
};
