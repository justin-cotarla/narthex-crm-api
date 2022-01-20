import { UserInputError } from 'apollo-server';
import { format as sqlFormat } from 'sql-formatter';

import {
    DBEvent,
    DBInsertResponse,
    DBUpdateResponse,
    RecordTable,
} from '../../types/database';
import {
    Event,
    EventAddInput,
    EventSortKey,
    EventUpdateInput,
    PaginationOptions,
} from '../../types/generated/graphql';
import { DatabaseError, NotFoundError } from '../../util/error';
import { mapEvent } from '../../util/mappers';
import {
    buildWhereClause,
    buildSetClause,
    buildInsertClause,
    buildPaginationClause,
} from '../../util/query';
import { validateDateTime, validateRecordName } from '../../util/validation';
import { MySqlDataSource } from '../MySqlDataSource';

import * as eventModule from './event';

import { NarthexCrmDbDataSource } from '.';

const _validateEventProperties = (
    eventInput: EventAddInput | EventUpdateInput
) => {
    const { name, location, datetime } = eventInput;

    if (name === null || datetime === null) {
        throw new UserInputError('Mandatory input cannot be null');
    }

    if (name && !validateRecordName(name)) {
        throw new UserInputError('Invalid event name');
    }

    if (datetime && !validateDateTime(datetime)) {
        throw new UserInputError('Invalid event time');
    }

    if (location && !validateRecordName(location)) {
        throw new UserInputError('Invalid event location');
    }
};

const getEvents = async (
    query: MySqlDataSource['query'],
    options: {
        eventIds?: number[];
        sortKey?: EventSortKey;
        paginationOptions?: PaginationOptions;
        archived?: boolean | null;
    } = {}
): Promise<Event[]> => {
    const {
        paginationOptions,
        sortKey,
        archived = false,
        eventIds = [],
    } = options;

    const whereClause = buildWhereClause([
        { clause: 'id in (?)', condition: eventIds?.length !== 0 },
        { clause: 'archived <> 1', condition: !archived },
    ]);

    const paginationClause =
        (paginationOptions &&
            sortKey &&
            buildPaginationClause(paginationOptions, sortKey.toString())) ||
        '';

    const sql = sqlFormat(`
        SELECT
            id,
            name,
            location,
            datetime,
            created_by,
            creation_timestamp,
            modified_by,
            modification_timestamp,
            archived
        FROM
        event
        ${whereClause}
        ${paginationClause}
    `);

    const values = [...(eventIds.length !== 0 ? [eventIds] : [])];

    const rows = await query<DBEvent[]>({
        sql,
        values,
    });

    return rows?.map(mapEvent) ?? [];
};

const addEvent = async (
    query: MySqlDataSource['query'],
    eventAddInput: EventAddInput,
    clientId: number
): Promise<number> => {
    const { name, datetime, location } = eventAddInput;

    eventModule._validateEventProperties(eventAddInput);

    const insertClause = buildInsertClause([
        { key: 'name', condition: true },
        { key: 'datetime', condition: true },
        { key: 'created_by', condition: true },
        { key: 'modified_by', condition: true },
        { key: 'location', condition: location !== undefined },
    ]);

    const sql = sqlFormat(`
        INSERT INTO event
            ${insertClause.insert}
        VALUES
            ${insertClause.values}
    `);

    const rows = await query<DBInsertResponse>({
        sql,
        values: [
            name,
            datetime,
            clientId,
            clientId,
            ...(location !== undefined ? [location] : []),
        ],
    });

    if (!rows) {
        throw new DatabaseError('Could not add event');
    }

    return rows.insertId;
};

const updateEvent = async (
    query: MySqlDataSource['query'],
    logRecordChange: NarthexCrmDbDataSource['logRecordChange'],
    eventUpdateInput: EventUpdateInput,
    clientId: number
): Promise<void> => {
    const { id, name, datetime, location } = eventUpdateInput;

    const [event] = await eventModule.getEvents(query, {
        eventIds: [id],
    });

    if (!event) {
        throw new NotFoundError('Event does not exist');
    }

    if (Object.keys(eventUpdateInput).length <= 1) {
        throw new UserInputError('Nothing to update');
    }

    eventModule._validateEventProperties(eventUpdateInput);

    const setClause = buildSetClause([
        { key: 'modified_by', condition: true },
        { key: 'name', condition: name !== undefined },
        { key: 'datetime', condition: datetime !== undefined },
        { key: 'location', condition: location !== undefined },
    ]);

    const sql = sqlFormat(`
        UPDATE event
        SET
        ${setClause}
        WHERE ID = ?;
    `);

    const values = [
        clientId,
        ...(name !== undefined ? [name] : []),
        ...(datetime !== undefined ? [datetime] : []),
        ...(location !== undefined ? [location] : []),
        id,
    ];

    const rows = await query<DBUpdateResponse>({
        sql,
        values,
    });

    if (!rows || rows.affectedRows === 0) {
        throw new DatabaseError('Could not update event');
    }

    await logRecordChange(RecordTable.EVENT, id, clientId);
};

const archiveEvent = async (
    query: MySqlDataSource['query'],
    logRecordChange: NarthexCrmDbDataSource['logRecordChange'],
    eventId: number,
    clientId: number
): Promise<void> => {
    const sql = sqlFormat(`
        UPDATE event
        SET
            archived = 1
        WHERE ID = ?;
    `);

    const rows = await query<DBUpdateResponse>({
        sql,
        values: [eventId],
    });

    if (!rows || rows.affectedRows === 0) {
        throw new DatabaseError('Could not archive event');
    }

    await logRecordChange(RecordTable.EVENT, eventId, clientId);
};

export {
    _validateEventProperties,
    getEvents,
    addEvent,
    updateEvent,
    archiveEvent,
};
