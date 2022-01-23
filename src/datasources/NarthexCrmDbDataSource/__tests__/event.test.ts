import { UserInputError } from 'apollo-server';
import { mocked, SpyInstance, spyOn } from 'jest-mock';
import { format as sqlFormat } from 'sql-formatter';

import { mockDBEvent } from '../../../__mocks__/database';
import { mockEvent } from '../../../__mocks__/schema';
import {
    DBEvent,
    DBUpdateResponse,
    RecordTable,
} from '../../../types/database';
import { EventSortKey, SortOrder } from '../../../types/generated/graphql';
import { DatabaseError, NotFoundError } from '../../../util/error';
import { validateRecordName, validateDateTime } from '../../../util/validation';
import * as eventModule from '../event';
import { addEvent, archiveEvent, getEvents, updateEvent } from '../event';

const mockQuery = jest.fn();
const mockLogRecordChange = jest.fn();

jest.mock('../../../util/validation');
const mockValidateRecordName = mocked(validateRecordName).mockImplementation(
    () => true
);
const mockValidateDateTime = mocked(validateDateTime).mockImplementation(
    () => true
);

beforeEach(() => {
    mockQuery.mockClear();
    mockLogRecordChange.mockClear();
    mockValidateDateTime.mockClear();
    mockValidateRecordName.mockClear();
});

describe('event', () => {
    describe('getEvents', () => {
        it('gets events with default arguments', async () => {
            mockQuery.mockImplementation((): DBEvent[] => [mockDBEvent]);

            await getEvents(mockQuery);

            expect(mockQuery).toBeCalledWith({
                sql: sqlFormat(`
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
                    WHERE
                        archived <> 1
                    `),
                values: [],
            });
        });

        it('gets events with all arguments', async () => {
            mockQuery.mockImplementation((): DBEvent[] => [mockDBEvent]);

            await getEvents(mockQuery, {
                archived: true,
                eventIds: [1],
                sortKey: EventSortKey.Id,
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

        it('returns an empty array if there are no events', async () => {
            mockQuery.mockImplementation((): DBEvent[] => []);

            const result = await getEvents(mockQuery, { eventIds: [4] });

            expect(result).toEqual([]);
        });
    });
    describe('addEvent', () => {
        it('adds a minimal event', async () => {
            mockQuery.mockImplementation(() => ({
                insertId: 1,
            }));

            const result = await addEvent(
                mockQuery,
                {
                    datetime: '2021-01-22 09:30',
                    name: 'Divine Liturgy',
                },
                1
            );

            expect(result).toBe(1);
            expect(mockQuery).toBeCalledWith({
                sql: sqlFormat(`
                INSERT INTO
                    event (name, datetime, created_by, modified_by)
                VALUES
                    (?, ?, ?, ?)
                `),
                values: ['Divine Liturgy', '2021-01-22 09:30', 1, 1],
            });
        });

        it('adds a full event', async () => {
            mockQuery.mockImplementation(() => ({
                insertId: 1,
            }));

            const result = await addEvent(
                mockQuery,
                {
                    datetime: '2021-01-22 09:30',
                    name: 'Divine Liturgy',
                    location: '2430 ave Charland',
                },
                1
            );

            expect(result).toBe(1);
            expect(mockQuery).toBeCalledWith({
                sql: sqlFormat(`
                INSERT INTO
                    event (name, datetime, created_by, modified_by, location)
                VALUES
                    (?, ?, ?, ?, ?)
                `),
                values: [
                    'Divine Liturgy',
                    '2021-01-22 09:30',
                    1,
                    1,
                    '2430 ave Charland',
                ],
            });
        });

        it('throws an error if the database fails to insert row', async () => {
            mockQuery.mockImplementation(() => undefined);

            await expect(
                addEvent(
                    mockQuery,
                    {
                        datetime: '2021-01-22 09:30',
                        name: 'Divine Liturgy',
                    },
                    1
                )
            ).rejects.toThrowError(DatabaseError);

            expect(mockQuery).toBeCalled();
        });
    });

    describe('updateEvent', () => {
        let spyGetEvents: SpyInstance<unknown, unknown[]>;

        beforeEach(() => {
            spyGetEvents = spyOn(eventModule, 'getEvents');
        });

        afterEach(() => {
            spyGetEvents.mockRestore();
        });
        it('updates a event', async () => {
            spyGetEvents.mockImplementation(() => [mockEvent]);
            mockQuery.mockImplementation(
                (): DBUpdateResponse => ({
                    affectedRows: 1,
                    changedRows: 1,
                })
            );

            await updateEvent(
                mockQuery,
                mockLogRecordChange,
                {
                    id: 1,
                    datetime: '2021-01-22 09:30',
                    name: 'Divine Liturgy',
                    location: '2430 ave Charland',
                },
                2
            );

            expect(spyGetEvents).toHaveBeenCalled();

            expect(mockQuery).toHaveBeenCalledWith({
                sql: sqlFormat(`
                        UPDATE
                            event
                        SET
                            modified_by = ?,
                            name = ?,
                            datetime = ?,
                            location = ?
                        WHERE
                            ID = ?;
                    `),
                values: [
                    2,
                    'Divine Liturgy',
                    '2021-01-22 09:30',
                    '2430 ave Charland',
                    1,
                ],
            });

            expect(mockLogRecordChange).toHaveBeenCalledWith(
                RecordTable.EVENT,
                1,
                2
            );
        });

        it('throws an error if no the event does not exists', async () => {
            spyGetEvents.mockImplementation(() => []);

            await expect(
                updateEvent(
                    mockQuery,
                    mockLogRecordChange,
                    {
                        id: 10,
                    },
                    2
                )
            ).rejects.toThrowError(NotFoundError);

            expect(mockQuery).toHaveBeenCalledTimes(0);
        });

        it('throws an error if no changes are provided', async () => {
            spyGetEvents.mockImplementation(() => [mockEvent]);

            await expect(
                updateEvent(
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

        it('throws an error if the event was not updated on the database', async () => {
            spyGetEvents.mockImplementation(() => [mockEvent]);
            mockQuery.mockImplementation(
                (): DBUpdateResponse => ({
                    affectedRows: 0,
                    changedRows: 0,
                })
            );

            await expect(
                updateEvent(
                    mockQuery,
                    mockLogRecordChange,
                    {
                        id: 1,
                        name: 'Council',
                    },
                    2
                )
            ).rejects.toThrowError(DatabaseError);
        });
    });

    describe('archiveEvent', () => {
        it('archives a event', async () => {
            mockQuery.mockImplementation(
                (): DBUpdateResponse => ({
                    affectedRows: 1,
                    changedRows: 1,
                })
            );

            await archiveEvent(mockQuery, mockLogRecordChange, 1, 2);

            expect(mockQuery).toHaveBeenCalledWith({
                sql: sqlFormat(`
                    UPDATE event
                    SET
                        archived = 1
                    WHERE ID = ?;
                `),
                values: [1],
            });
            expect(mockLogRecordChange).toHaveBeenCalledWith(
                RecordTable.EVENT,
                1,
                2
            );
        });

        it('throws an error if the event was not archived on the database', async () => {
            mockQuery.mockImplementation(
                (): DBUpdateResponse => ({
                    affectedRows: 0,
                    changedRows: 0,
                })
            );

            await expect(
                archiveEvent(mockQuery, mockLogRecordChange, 1, 2)
            ).rejects.toThrowError(DatabaseError);
        });
    });

    describe('_validateEventProperties', () => {
        it('accepts valid event properties', () => {
            eventModule._validateEventProperties({
                id: 1,
                datetime: '2021-01-22 09:30',
                name: 'Divine Liturgy',
                location: '2430 ave Charland',
            });

            expect(mockValidateDateTime).toBeCalled();
            expect(mockValidateRecordName).toBeCalled();
        });
    });
});
