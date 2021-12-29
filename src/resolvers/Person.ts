import { PersonResolvers } from '../types/generated/graphql';

const Person: PersonResolvers = {
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

    ministryDelegations: async (
        { id },
        _,
        { dataLoaders: { ministryDelegationsByPerson } }
    ) => {
        return (await ministryDelegationsByPerson.load(id)) ?? [];
    },
};

export { Person };
