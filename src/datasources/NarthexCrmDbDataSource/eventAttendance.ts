import { UserInputError } from 'apollo-server';
import { format as sqlFormat } from 'sql-formatter';

import { DBEventAttendance, DBUpdateResponse } from '../../types/database';
import {
    EventAttendance,
    EventAttendanceSetInput,
} from '../../types/generated/graphql';
import { DatabaseError } from '../../util/error';
import { mapEventAttendance } from '../../util/mappers';
import {
    buildInsertClause,
    buildSetClause,
    buildWhereClause,
} from '../../util/query';
import { validateDate } from '../../util/validation';
import { MySqlDataSource } from '../MySqlDataSource';

import * as eventModule from './event';
import * as eventAttendanceModule from './eventAttendance';
import * as personModule from './person';

const _validateEventAttendanceProperties = (
    eventInput: EventAttendanceSetInput
) => {
    const { dateRegistered } = eventInput;

    if (dateRegistered && !validateDate(dateRegistered)) {
        throw new UserInputError('Invalid registration date');
    }
};

const getEventAttendance = async (
    query: MySqlDataSource['query'],
    eventIds: number[],
    personIds: number[]
): Promise<EventAttendance[]> => {
    const whereClause = buildWhereClause([
        { clause: 'event_id in (?)', condition: eventIds?.length !== 0 },
        { clause: 'person_id in (?)', condition: personIds?.length !== 0 },
    ]);

    const sql = sqlFormat(`
        SELECT
            event_id,
            person_id,
            date_registered,
            attended,
            created_by,
            creation_timestamp,
            modified_by,
            modification_timestamp
        FROM
        event_attendance
        ${whereClause}
    `);

    const values = [
        ...(eventIds.length > 0 ? [eventIds] : []),
        ...(personIds.length > 0 ? [personIds] : []),
    ];

    const rows = await query<DBEventAttendance[]>({
        sql,
        values,
    });

    return rows?.map(mapEventAttendance) ?? [];
};

const setEventAttendance = async (
    query: MySqlDataSource['query'],
    eventAttendanceSetInput: EventAttendanceSetInput,
    clientId: number
): Promise<void> => {
    const { eventId, personId, attended, dateRegistered } =
        eventAttendanceSetInput;

    const [person] = await personModule.getPeople(query, {
        personIds: [personId],
    });
    const [event] = await eventModule.getEvents(query, {
        eventIds: [eventId],
    });

    if (!person || person.archived) {
        throw new UserInputError('Person does not exist');
    }

    if (!event || event.archived) {
        throw new UserInputError('Event does not exist');
    }

    eventAttendanceModule._validateEventAttendanceProperties(
        eventAttendanceSetInput
    );

    const sqlConditions = [
        { key: 'modified_by', condition: true },
        { key: 'attended', condition: attended !== undefined },
        { key: 'date_registered', condition: dateRegistered !== undefined },
    ];

    const insertClause = buildInsertClause([
        { key: 'event_id', condition: true },
        { key: 'person_id', condition: true },
        { key: 'created_by', condition: true },
        ...sqlConditions,
    ]);

    const setClause = buildSetClause(sqlConditions);

    const sql = sqlFormat(`
        INSERT INTO event_attendance
            ${insertClause.insert}
        VALUES
            ${insertClause.values}
        ON DUPLICATE KEY UPDATE
            modification_timestamp = CURRENT_TIMESTAMP,
            ${setClause}
    `);

    const rows = await query<DBUpdateResponse>({
        sql,
        values: [
            eventId,
            personId,
            clientId,
            clientId,
            ...(attended !== undefined ? [attended] : []),
            ...(dateRegistered !== undefined ? [dateRegistered] : []),
            clientId,
            ...(attended !== undefined ? [attended] : []),
            ...(dateRegistered !== undefined ? [dateRegistered] : []),
        ],
    });

    if (!rows || rows.affectedRows === 0) {
        throw new DatabaseError('Could not add register person to event');
    }
};

const deleteEventAttendance = async (
    query: MySqlDataSource['query'],
    eventId: number,
    personId: number
): Promise<void> => {
    const sql = sqlFormat(`
        DELETE FROM event_attendance
        WHERE
            event_id = ?
            and person_id = ?
    `);

    const rows = await query<DBUpdateResponse>({
        sql,
        values: [eventId, personId],
    });

    if (!rows || rows.affectedRows === 0) {
        throw new DatabaseError('Could not delete event attendance');
    }
};

export {
    _validateEventAttendanceProperties,
    getEventAttendance,
    setEventAttendance,
    deleteEventAttendance,
};
