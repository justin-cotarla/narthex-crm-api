import { getUnixTime } from 'date-fns';

import { DBClient, DBMinistry } from '../types/database';
import { Client, Ministry } from '../types/generated/graphql';

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
    color: `#${dbMinistry.color?.toString(16).toUpperCase()}`,
    createdBy: {
        id: dbMinistry.created_by!,
    },
    creationTimestamp:
        dbMinistry.creation_timestamp &&
        getUnixTime(dbMinistry.creation_timestamp),
    modifiedBy: {
        id: dbMinistry.modified_by!,
    },
    modificationTimestamp:
        dbMinistry.modification_timestamp &&
        getUnixTime(dbMinistry.modification_timestamp),
    archived: Boolean(dbMinistry.archived),
});

export { mapClient, mapMinistry };
