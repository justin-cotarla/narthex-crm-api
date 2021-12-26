import { differenceInYears, getUnixTime, parse } from 'date-fns';

import { DBClient, DBMinistry, DBPerson, DBRecord } from '../types/database';
import { Client, Ministry, Person, Record } from '../types/generated/graphql';

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

const mapPerson = (dbPerson: DBPerson): Person => ({
    id: dbPerson.id,
    firstName: dbPerson.first_name,
    lastName: dbPerson.last_name,
    gender: dbPerson.gender,
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

export { mapClient, mapMinistry, mapPerson };
