import { MinistryDelegationResolvers } from '../types/generated/graphql';

const MinistryDelegation: MinistryDelegationResolvers = {
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

    delegee: async ({ delegee }, _, { dataLoaders: { people } }) => {
        const [peopleResult] = (await people.load(delegee.id)) ?? [null];

        return peopleResult;
    },

    ministry: async ({ ministry }, _, { dataLoaders: { ministries } }) => {
        const [ministryResult] = (await ministries.load(ministry.id)) ?? [null];

        return ministryResult;
    },
};

export { MinistryDelegation };
