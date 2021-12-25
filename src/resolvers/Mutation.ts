import { MutationResolvers } from '../types/generated/graphql';
import { authorize } from '../util/auth';

const Mutation: MutationResolvers = {
    addClient: async (
        _,
        { clientAddInput },
        { dataSources: { narthexCrmDbDataSource }, clientToken }
    ) => {
        authorize(clientToken, {
            isPublic: true,
        });

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
        authorize(clientToken, {
            ownId: clientUpdateInput.id,
            scopes: ['admin'],
        });

        await narthexCrmDbDataSource.updateClient(clientUpdateInput);

        const [client] = await narthexCrmDbDataSource.getClients([
            clientUpdateInput.id,
        ]);
        return client;
    },
    addMinistry: async (
        _,
        { ministryAddInput },
        { dataSources: { narthexCrmDbDataSource }, clientToken }
    ) => {
        authorize(clientToken, {
            scopes: ['admin'],
        });

        const ministryId = await narthexCrmDbDataSource.addMinistry(
            ministryAddInput,
            clientToken!.id
        );

        const [ministry] = await narthexCrmDbDataSource.getMinistries([
            ministryId,
        ]);
        return ministry;
    },
    updateMinistry: async (
        _,
        { ministryUpdateInput },
        { dataSources: { narthexCrmDbDataSource }, clientToken }
    ) => {
        authorize(clientToken, {
            scopes: ['admin'],
        });

        await narthexCrmDbDataSource.updateMinistry(
            ministryUpdateInput,
            clientToken!.id
        );
        const [ministry] = await narthexCrmDbDataSource.getMinistries([
            ministryUpdateInput.id,
        ]);

        return ministry;
    },
};

export { Mutation };
