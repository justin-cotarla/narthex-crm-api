import { MilestoneResolvers } from '../types/generated/graphql';

const Milestone: MilestoneResolvers = {
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

    subject: async ({ subject }, _, { dataLoaders: { people } }) => {
        const [personResult] = await people.load(subject!.id);

        return personResult ?? null;
    },
};

export { Milestone };
