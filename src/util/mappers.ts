import { getUnixTime } from 'date-fns';

import { DBClient } from '../types/database';
import { Client } from '../types/generated/graphql';

const mapClient = (dbClient: DBClient): Client => ({
    id: dbClient.id,
    emailAddress: dbClient.email_address,
    permissionScope: dbClient.permission_scope,
    active: Boolean(dbClient.active),
    lastLoginTimestamp:
        dbClient.last_login_timestamp &&
        getUnixTime(dbClient.last_login_timestamp),
    creationTimestamp: getUnixTime(dbClient.creation_timestamp),
});

export { mapClient };
