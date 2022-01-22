import DataLoader from 'dataloader';
import * as R from 'ramda';

import { NarthexCrmDbDataSource } from '../datasources/NarthexCrmDbDataSource';
import { Event } from '../types/generated/graphql';

const getEventLoader = (narthexCrmDataSource: NarthexCrmDbDataSource) => {
    const batchEventById = async (
        eventIds: readonly number[]
    ): Promise<Event[][]> => {
        const events = await narthexCrmDataSource.getEvents({
            eventIds: eventIds as number[],
        });

        const eventMap = R.groupBy(({ id }) => id.toString(), events);

        return eventIds.map((eventId) => eventMap[eventId] ?? undefined);
    };

    return new DataLoader(batchEventById);
};

export { getEventLoader };
