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
    deleteMinistry: async (
        _,
        { ministryId },
        { dataSources: { narthexCrmDbDataSource }, clientToken }
    ) => {
        authorize(clientToken, {
            scopes: ['admin'],
        });

        await narthexCrmDbDataSource.archiveMinistry(
            ministryId,
            clientToken!.id
        );

        return {
            id: ministryId,
        };
    },
    addPerson: async (
        _,
        { personAddInput },
        { dataSources: { narthexCrmDbDataSource }, clientToken }
    ) => {
        authorize(clientToken, {
            scopes: ['admin'],
        });

        const personId = await narthexCrmDbDataSource.addPerson(
            personAddInput,
            clientToken!.id
        );

        const [person] = await narthexCrmDbDataSource.getPeople([personId]);
        return person;
    },
    updatePerson: async (
        _,
        { personUpdateInput },
        { dataSources: { narthexCrmDbDataSource }, clientToken }
    ) => {
        authorize(clientToken, {
            scopes: ['admin'],
        });

        await narthexCrmDbDataSource.updatePerson(
            personUpdateInput,
            clientToken!.id
        );
        const [person] = await narthexCrmDbDataSource.getPeople([
            personUpdateInput.id,
        ]);

        return person;
    },
    deletePerson: async (
        _,
        { personId },
        { dataSources: { narthexCrmDbDataSource }, clientToken }
    ) => {
        authorize(clientToken, {
            scopes: ['admin'],
        });

        await narthexCrmDbDataSource.archivePerson(personId, clientToken!.id);

        return {
            id: personId,
        };
    },
};

export { Mutation };
