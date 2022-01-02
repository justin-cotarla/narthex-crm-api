import { PersonResolvers } from '../types/generated/graphql';

const Person: PersonResolvers = {
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

    ministryDelegations: async (
        { id },
        _,
        { dataLoaders: { ministryDelegationsByPerson } }
    ) => {
        return (await ministryDelegationsByPerson.load(id)) ?? [];
    },

    household: async ({ household }, _, { dataLoaders: { households } }) => {
        if (!household?.id) {
            return null;
        }
        const [householdResult] = await households.load(household.id);

        return householdResult ?? null;
    },
};

export { Person };
