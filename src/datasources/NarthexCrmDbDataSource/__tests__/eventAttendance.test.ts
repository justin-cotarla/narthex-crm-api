import { mocked } from 'jest-mock';
import { format as sqlFormat } from 'sql-formatter';

import { mockDBEventAttendance } from '../../../__mocks__/database';
import { mockEvent, mockPerson } from '../../../__mocks__/schema';
import { DBEventAttendance, DBUpdateResponse } from '../../../types/database';
import { Event, Person } from '../../../types/generated/graphql';
import { DatabaseError } from '../../../util/error';
import { validateDate } from '../../../util/validation';
import { getEvents } from '../event';
import {
    _validateEventAttendanceProperties,
    deleteEventAttendance,
    setEventAttendance,
    getEventAttendance,
} from '../eventAttendance';
import { getPeople } from '../person';

const mockQuery = jest.fn();

jest.mock('../person');
const mockGetPeople = mocked(getPeople).mockImplementation(
    async (): Promise<Person[]> => [mockPerson]
);

jest.mock('../event');
const mockGetEvents = mocked(getEvents).mockImplementation(
    async (): Promise<Event[]> => [mockEvent]
);

jest.mock('../../../util/validation');
const mockValidateDate = mocked(validateDate).mockImplementation(() => true);

beforeEach(() => {
    mockQuery.mockClear();
    mockGetPeople.mockClear();
    mockGetEvents.mockClear();
    mockValidateDate.mockClear();
});

describe('eventAttendance', () => {
    describe('getEventAttendance', () => {
        it('gets event attendance', async () => {
            mockQuery.mockImplementation((): DBEventAttendance[] => [
                mockDBEventAttendance,
            ]);

            await getEventAttendance(mockQuery, [], []);

            expect(mockQuery).toBeCalledWith({
                sql: sqlFormat(`
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
                `),
                values: [],
            });
        });

        it('gets certain event attendances', async () => {
            mockQuery.mockImplementation((): DBEventAttendance[] => [
                mockDBEventAttendance,
            ]);

            await getEventAttendance(mockQuery, [3], [1]);

            expect(mockQuery).toBeCalledWith({
                sql: sqlFormat(`
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
                    WHERE
                    event_id in (?)
                        and person_id in (?)
                    `),
                values: [[3], [1]],
            });
        });

        it('returns an empty array if query returns nothing', async () => {
            mockQuery.mockImplementation(() => undefined);

            const result = await getEventAttendance(mockQuery, [4], [3]);

            expect(result).toEqual([]);
        });
    });
    describe('setEventAttendance', () => {
        it('sets minimal event attendance', async () => {
            mockQuery.mockImplementation(() => ({
                affectedRows: 1,
            }));

            await setEventAttendance(
                mockQuery,
                {
                    eventId: 2,
                    personId: 3,
                },
                1
            );

            expect(mockQuery).toBeCalledWith({
                sql: sqlFormat(`
                    INSERT INTO event_attendance
                        (event_id, person_id, created_by, modified_by)
                    VALUES
                        (?, ?, ?, ?) ON DUPLICATE KEY
                        UPDATE
                            modification_timestamp = CURRENT_TIMESTAMP,
                            modified_by = ?
                `),
                values: [2, 3, 1, 1, 1],
            });
        });

        it('sets full event attendance', async () => {
            mockQuery.mockImplementation(() => ({
                affectedRows: 1,
            }));

            await setEventAttendance(
                mockQuery,
                {
                    eventId: 1,
                    personId: 1,
                    attended: true,
                    dateRegistered: '2022-01-21',
                },
                1
            );

            expect(mockQuery).toBeCalledWith({
                sql: sqlFormat(`
                INSERT INTO
                    event_attendance (
                        event_id,
                        person_id,
                        created_by,
                        modified_by,
                        attended,
                        date_registered
                    )
                VALUES
                    (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY
                UPDATE
                    modification_timestamp = CURRENT_TIMESTAMP,
                    modified_by = ?,
                    attended = ?,
                    date_registered = ?
                `),
                values: [1, 1, 1, 1, true, '2022-01-21', 1, true, '2022-01-21'],
            });
        });

        it('throws an error if the database fails to insert row', async () => {
            mockQuery.mockImplementation(() => undefined);

            await expect(
                setEventAttendance(
                    mockQuery,
                    {
                        eventId: 2,
                        personId: 3,
                    },
                    1
                )
            ).rejects.toThrowError(Error);

            expect(mockQuery).toBeCalled();
        });

        it('throws an error if the person does not exist', async () => {
            mockGetPeople.mockImplementationOnce(
                async (): Promise<Person[]> => []
            );

            await expect(
                setEventAttendance(
                    mockQuery,
                    {
                        eventId: 2,
                        personId: 3,
                    },
                    1
                )
            ).rejects.toThrowError(Error);

            expect(mockQuery).toHaveBeenCalledTimes(0);
        });
        it('throws an error if the event does not exist', async () => {
            mockGetEvents.mockImplementationOnce(
                async (): Promise<Event[]> => []
            );

            await expect(
                setEventAttendance(
                    mockQuery,
                    {
                        eventId: 2,
                        personId: 3,
                    },
                    1
                )
            ).rejects.toThrowError(Error);

            expect(mockQuery).toHaveBeenCalledTimes(0);
        });
    });

    describe('deleteEventAttendance', () => {
        it("deletes an event's attendance", async () => {
            mockQuery.mockImplementation(
                (): DBUpdateResponse => ({
                    affectedRows: 1,
                    changedRows: 1,
                })
            );

            await deleteEventAttendance(mockQuery, [1], [2]);

            expect(mockQuery).toHaveBeenCalledWith({
                sql: sqlFormat(`
                    DELETE FROM event_attendance
                    WHERE
                        event_id in (?)
                        and person_id in (?)
                `),
                values: [[1], [2]],
            });
        });

        it('throws an error if the event delegation was not deleted', async () => {
            mockQuery.mockImplementation(
                (): DBUpdateResponse => ({
                    affectedRows: 0,
                    changedRows: 0,
                })
            );

            await expect(
                deleteEventAttendance(mockQuery, [1], [2])
            ).rejects.toThrowError(DatabaseError);
        });
    });

    describe('_validateEventAttendanceProperties', () => {
        it('validates all person properties', () => {
            _validateEventAttendanceProperties({
                eventId: 1,
                personId: 2,
                attended: true,
                dateRegistered: '2022-01-21',
            });

            expect(mockValidateDate).toHaveBeenCalled();
        });
    });
});
