import { ForbiddenError } from 'apollo-server';

import { Ministry, QueryResolvers } from '../types/generated/graphql';

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
    ministries: async () => {
        return ministries;
    },
    getToken: async (
        _,
        { emailAddress, password },
        { dataSources: { narthexCrmDbDataSource }, jwtSecret }
    ) => {
        const token = await narthexCrmDbDataSource.getToken(
            emailAddress,
            password,
            jwtSecret
        );
        return token;
    },
    getClientById: async (
        _,
        { clientId },
        { dataSources: { narthexCrmDbDataSource }, clientToken }
    ) => {
        if (
            !clientToken ||
            clientToken.permissionScope !== 'admin' ||
            clientToken.id !== clientId
        ) {
            throw new ForbiddenError('Not authorized');
        }
        const [client] = await narthexCrmDbDataSource.getClients([clientId]);
        return client;
    },
    getClients: async (
        _,
        __,
        { dataSources: { narthexCrmDbDataSource }, clientToken }
    ) => {
        if (!clientToken || clientToken.permissionScope !== 'admin') {
            throw new ForbiddenError('Not authorized');
        }
        const clients = await narthexCrmDbDataSource.getClients();
        return clients;
    },
};

export { Query };
