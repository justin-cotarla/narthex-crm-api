import { HouseholdResolvers } from '../types/generated/graphql';

const Household: HouseholdResolvers = {
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

    head: async ({ head }, _, { dataLoaders: { people } }) => {
        if (!head?.id) {
            return null;
        }
        const [personResult] = (await people.load(head.id)) ?? [null];

        return personResult;
    },

    members: async ({ id }, _, { dataLoaders: { peopleByHousehold } }) => {
        const personResult = await peopleByHousehold.load(id);

        return personResult ?? [];
    },

    donations: async ({ id }, _, { dataLoaders: { donationsByHousehold } }) => {
        const donationResult = await donationsByHousehold.load(id);

        return donationResult ?? [];
    },
};

export { Household };
