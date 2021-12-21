import { ForbiddenError } from 'apollo-server';

import { MutationResolvers } from '../types/generated/graphql';

const Mutation: MutationResolvers = {
    addClient: async (
        _,
        { clientAddInput },
        { dataSources: { narthexCrmDbDataSource } }
    ) => {
        const { emailAddress, password } = clientAddInput;

        const clientId = await narthexCrmDbDataSource.addClient(
            emailAddress,
            password
        );

        const [client] = await narthexCrmDbDataSource.getClients([clientId]);
        return client;
    },
    updateClient: async (
        _,
        { clientUpdateInput },
        { dataSources: { narthexCrmDbDataSource }, clientToken }
    ) => {
        if (
            !clientToken ||
            clientToken.permissionScope !== 'admin' ||
            clientToken.id !== clientUpdateInput.id
        ) {
            throw new ForbiddenError('Not authorized');
        }
        await narthexCrmDbDataSource.updateClient(clientUpdateInput);

        const [client] = await narthexCrmDbDataSource.getClients([
            clientUpdateInput.id,
        ]);
        return client;
    },
};

export { Mutation };
