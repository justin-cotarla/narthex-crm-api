import { MinistryResolvers } from '../types/generated/graphql';

const Ministry: MinistryResolvers = {
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

    delegations: async (
        { id },
        _,
        { dataLoaders: { ministryDelegationsByMinistry } }
    ) => {
        return (await ministryDelegationsByMinistry.load(id)) ?? [];
    },
};

export { Ministry };
