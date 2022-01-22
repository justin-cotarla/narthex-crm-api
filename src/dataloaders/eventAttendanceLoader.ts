import DataLoader from 'dataloader';
import * as R from 'ramda';

import { NarthexCrmDbDataSource } from '../datasources/NarthexCrmDbDataSource';
import { EventAttendance } from '../types/generated/graphql';

const getEventAttendanceByEventLoader = (
    narthexCrmDataSource: NarthexCrmDbDataSource
) => {
    const batchEventAttendanceByEventId = async (
        eventIds: readonly number[]
    ): Promise<EventAttendance[][]> => {
        const eventAttendance = await narthexCrmDataSource.getEventAttendance(
            eventIds as number[],
            []
        );

        const eventAttendanceMap = R.groupBy(
            ({ event: { id } }) => id.toString(),
            eventAttendance
        );

        return eventIds.map(
            (eventId) => eventAttendanceMap[eventId] ?? undefined
        );
    };

    return new DataLoader(batchEventAttendanceByEventId);
};

const getEventAttendanceByPersonLoader = (
    narthexCrmDataSource: NarthexCrmDbDataSource
) => {
    const batchEventAttendanceByPersonId = async (
        personIds: readonly number[]
    ): Promise<EventAttendance[][]> => {
        const eventAttendance = await narthexCrmDataSource.getEventAttendance(
            [],
            personIds as number[]
        );

        const eventAttendanceMap = R.groupBy(
            ({ attendee: { id } }) => id.toString(),
            eventAttendance
        );

        return personIds.map(
            (attendeeId) =>
                eventAttendanceMap[attendeeId.toString()] ?? undefined
        );
    };

    return new DataLoader(batchEventAttendanceByPersonId);
};

export { getEventAttendanceByPersonLoader, getEventAttendanceByEventLoader };
