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
};

export { Mutation };
