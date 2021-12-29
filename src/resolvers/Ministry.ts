import { MinistryResolvers } from '../types/generated/graphql';

const Ministry: MinistryResolvers = {
    createdBy: async ({ createdBy }, _, { dataLoaders: { clients } }) => {
        if (!createdBy) {
            return null;
        }
        const [peopleResult] = await clients.load(createdBy?.id);

        return peopleResult ?? null;
    },

    modifiedBy: async ({ createdBy }, _, { dataLoaders: { clients } }) => {
        if (!createdBy) {
            return null;
        }
        const [peopleResult] = await clients.load(createdBy?.id);

        return peopleResult ?? null;
    },

    delegations: async (
        { id },
        _,
        { dataLoaders: { ministryDelegationsByMinistry } }
    ) => {
        return (await ministryDelegationsByMinistry.load(id)) ?? [];
    },
};

export { Ministry };
