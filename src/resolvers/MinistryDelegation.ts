import { MinistryDelegationResolvers } from '../types/generated/graphql';

const MinistryDelegation: MinistryDelegationResolvers = {
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

    delegee: async ({ delegee }, _, { dataLoaders: { people } }) => {
        const [peopleResult] = await people.load(delegee.id);

        return peopleResult;
    },

    ministry: async ({ ministry }, _, { dataLoaders: { ministries } }) => {
        const [ministryResult] = await ministries.load(ministry.id);

        return ministryResult;
    },
};

export { MinistryDelegation };
