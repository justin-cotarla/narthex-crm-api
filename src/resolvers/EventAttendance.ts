import { EventAttendanceResolvers } from '../types/generated/graphql';

const EventAttendance: EventAttendanceResolvers = {
    createdBy: async ({ createdBy }, _, { dataLoaders: { clients } }) => {
        if (!createdBy) {
            return null;
        }
        const [clientResult] = await clients.load(createdBy?.id);

        return clientResult ?? null;
    },

    modifiedBy: async ({ createdBy }, _, { dataLoaders: { clients } }) => {
        if (!createdBy) {
            return null;
        }
        const [clientResult] = await clients.load(createdBy?.id);

        return clientResult ?? null;
    },

    attendee: async ({ attendee }, _, { dataLoaders: { people } }) => {
        const [peopleResult] = await people.load(attendee.id);

        return peopleResult;
    },

    event: async ({ event }, _, { dataLoaders: { events } }) => {
        const [eventResult] = await events.load(event.id);

        return eventResult;
    },
};

export { EventAttendance };
