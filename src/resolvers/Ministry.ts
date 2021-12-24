import { MinistryResolvers } from '../types/generated/graphql';

const Ministry: MinistryResolvers = {
    createdBy: async (
        { createdBy: { id } },
        _,
        { dataLoaders: { clients } }
    ) => {
        return clients.load(id);
    },
    modifiedBy: async (
        { modifiedBy: { id } },
        _,
        { dataLoaders: { clients } }
    ) => clients.load(id),
};

export { Ministry };
