import { EventResolvers } from '../types/generated/graphql';

const Event: EventResolvers = {
    createdBy: async ({ createdBy }, _, { dataLoaders: { clients } }) => {
        if (!createdBy) {
            return null;
        }
        const [clientResult] = (await clients.load(createdBy?.id)) ?? [null];

        return clientResult;
    },

    modifiedBy: async ({ createdBy }, _, { dataLoaders: { clients } }) => {
        if (!createdBy) {
            return null;
        }
        const [clientResult] = (await clients.load(createdBy?.id)) ?? [null];

        return clientResult;
    },

    attendance: async (
        { id },
        _,
        { dataLoaders: { eventAttendanceByEvent } }
    ) => {
        return (await eventAttendanceByEvent.load(id)) ?? [];
    },
};

export { Event };
