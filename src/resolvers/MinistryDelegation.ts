import { MinistryDelegationResolvers } from '../types/generated/graphql';

const MinistryDelegation: MinistryDelegationResolvers = {
    createdBy: async ({ createdBy }, _, { dataLoaders: { clients } }) => {
        return (createdBy && clients.load(createdBy.id)) || null;
    },

    modifiedBy: async ({ createdBy }, _, { dataLoaders: { clients } }) => {
        return (createdBy && clients.load(createdBy.id)) || null;
    },

    delegee: async ({ delegee }, _, { dataLoaders: { people } }) => {
        return (delegee && (await people.load(delegee.id))) || null;
    },

    ministry: async ({ ministry }, _, { dataLoaders: { ministries } }) => {
        return (ministry && ministries.load(ministry.id)) || null;
    },
};

export { MinistryDelegation };
