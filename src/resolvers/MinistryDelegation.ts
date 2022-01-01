import { MinistryDelegationResolvers } from '../types/generated/graphql';

const MinistryDelegation: MinistryDelegationResolvers = {
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
