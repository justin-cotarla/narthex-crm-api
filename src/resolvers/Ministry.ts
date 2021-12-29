import { MinistryResolvers } from '../types/generated/graphql';

const Ministry: MinistryResolvers = {
    createdBy: async ({ createdBy }, _, { dataLoaders: { clients } }) => {
        return (createdBy && clients.load(createdBy.id)) || null;
    },

    modifiedBy: async ({ createdBy }, _, { dataLoaders: { clients } }) => {
        return (createdBy && clients.load(createdBy.id)) || null;
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
