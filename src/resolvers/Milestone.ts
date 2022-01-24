import { MilestoneResolvers } from '../types/generated/graphql';

const Milestone: MilestoneResolvers = {
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

    subject: async ({ subject }, _, { dataLoaders: { people } }) => {
        const [personResult] = (await people.load(subject!.id)) ?? [null];

        return personResult;
    },
};

export { Milestone };
