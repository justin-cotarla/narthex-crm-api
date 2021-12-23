import { Ministry, QueryResolvers } from '../types/generated/graphql';
import { authorize } from '../util/auth';

const ministries: Ministry[] = [
    {
        id: 1,
        color: '#3b82f6',
        name: 'Choir',
        creationTimestamp: 1639246358,
        modificationTimestamp: 1639246358,
        archived: false,
    },
];

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

        const clients = await narthexCrmDbDataSource.getClients();
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
};

export { Query };
