import { PersonResolvers } from '../types/generated/graphql';

const Person: PersonResolvers = {
    createdBy: async ({ createdBy }, _, { dataLoaders: { clients } }) => {
        return (createdBy && clients.load(createdBy.id)) || null;
    },

    modifiedBy: async ({ createdBy }, _, { dataLoaders: { clients } }) => {
        return (createdBy && clients.load(createdBy.id)) || null;
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
