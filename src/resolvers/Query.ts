import {
    HouseholdSortKey,
    PaginationOptions,
    PersonSortKey,
    QueryResolvers,
    SortOrder,
} from '../types/generated/graphql';
import { authorize } from '../util/auth';

const defaultPaginationOptions: PaginationOptions = {
    sortOrder: SortOrder.Asc,
    limit: 10,
    offset: 0,
};

const Query: QueryResolvers = {
    token: async (
        _,
        { emailAddress, password },
        { dataSources: { narthexCrmDbDataSource }, jwtSecret, clientToken }
    ) => {
        authorize(clientToken, {
            isPublic: true,
        });

        const token = await narthexCrmDbDataSource.getToken(
            emailAddress,
            password,
            jwtSecret
        );
        return token;
    },

    clientById: async (
        _,
        { clientId },
        { dataSources: { narthexCrmDbDataSource }, clientToken }
    ) => {
        authorize(clientToken, {
            ownId: clientId,
            scopes: ['admin'],
        });

        const [client] = await narthexCrmDbDataSource.getClients([clientId]);
        return client;
    },

    clients: async (
        _,
        __,
        { dataSources: { narthexCrmDbDataSource }, clientToken }
    ) => {
        authorize(clientToken, {
            scopes: ['admin'],
        });

        const clients = await narthexCrmDbDataSource.getClients([]);
        return clients;
    },

    ministries: async (
        _,
        { archived },
        { dataSources: { narthexCrmDbDataSource }, clientToken }
    ) => {
        authorize(clientToken, {
            scopes: ['admin'],
        });

        const ministries = await narthexCrmDbDataSource.getMinistries(
            [],
            archived
        );

        return ministries;
    },

    ministryById: async (
        _,
        { ministryId },
        { dataSources: { narthexCrmDbDataSource }, clientToken }
    ) => {
        authorize(clientToken, {
            scopes: ['admin'],
        });

        const [ministry] = await narthexCrmDbDataSource.getMinistries([
            ministryId,
        ]);

        return ministry;
    },

    people: async (
        _,
        {
            archived,
            sortKey = PersonSortKey.LastName,
            paginationOptions = defaultPaginationOptions,
        },
        { dataSources: { narthexCrmDbDataSource }, clientToken }
    ) => {
        authorize(clientToken, {
            scopes: ['admin'],
        });

        const people = await narthexCrmDbDataSource.getPeople([], {
            sortKey: sortKey!,
            paginationOptions: paginationOptions!,
            archived,
        });
        return people;
    },

    personById: async (
        _,
        { personId },
        { dataSources: { narthexCrmDbDataSource }, clientToken }
    ) => {
        authorize(clientToken, {
            scopes: ['admin'],
        });

        const [person] = await narthexCrmDbDataSource.getPeople([personId]);

        return person;
    },

    households: async (
        _,
        {
            archived,
            sortKey = HouseholdSortKey.Name,
            paginationOptions = defaultPaginationOptions,
        },
        { dataSources: { narthexCrmDbDataSource }, clientToken }
    ) => {
        authorize(clientToken, {
            scopes: ['admin'],
        });

        const households = await narthexCrmDbDataSource.getHouseholds([], {
            sortKey: sortKey!,
            paginationOptions: paginationOptions!,
            archived,
        });
        return households;
    },

    householdById: async (
        _,
        { householdId },
        { dataSources: { narthexCrmDbDataSource }, clientToken }
    ) => {
        authorize(clientToken, {
            scopes: ['admin'],
        });

        const [household] = await narthexCrmDbDataSource.getHouseholds([
            householdId,
        ]);

        return household;
    },
};

export { Query };
