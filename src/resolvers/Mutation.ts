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

        const [ministry] = await narthexCrmDbDataSource.getMinistries({
            ministryIds: [ministryId],
        });
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
        const [ministry] = await narthexCrmDbDataSource.getMinistries({
            ministryIds: [ministryUpdateInput.id],
        });

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

        const [person] = await narthexCrmDbDataSource.getPeople({
            personIds: [personId],
        });
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
        const [person] = await narthexCrmDbDataSource.getPeople({
            personIds: [personUpdateInput.id],
        });

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
    addMinistryDelegation: async (
        _,
        { ministryId, personId },
        { dataSources: { narthexCrmDbDataSource }, clientToken }
    ) => {
        authorize(clientToken, {
            scopes: ['admin'],
        });

        await narthexCrmDbDataSource.addPersonToMinsitry(
            ministryId,
            personId,
            clientToken!.id
        );

        const [ministryDelegation] =
            await narthexCrmDbDataSource.getMinistryDelegations(
                [ministryId],
                [personId]
            );

        return ministryDelegation;
    },
    removeMinistryDelegation: async (
        _,
        { ministryId, personId },
        { dataSources: { narthexCrmDbDataSource }, clientToken }
    ) => {
        authorize(clientToken, {
            scopes: ['admin'],
        });

        await narthexCrmDbDataSource.removePersonFromMinistry(
            ministryId,
            personId
        );

        return {
            ministryId,
            personId,
        };
    },
    addHousehold: async (
        _,
        { householdAddInput },
        { dataSources: { narthexCrmDbDataSource }, clientToken }
    ) => {
        authorize(clientToken, {
            scopes: ['admin'],
        });

        const householdId = await narthexCrmDbDataSource.addHousehold(
            householdAddInput,
            clientToken!.id
        );

        const [household] = await narthexCrmDbDataSource.getHouseholds({
            householdIds: [householdId],
        });
        return household;
    },
    updateHousehold: async (
        _,
        { householdUpdateInput },
        { dataSources: { narthexCrmDbDataSource }, clientToken }
    ) => {
        authorize(clientToken, {
            scopes: ['admin'],
        });

        await narthexCrmDbDataSource.updateHousehold(
            householdUpdateInput,
            clientToken!.id
        );
        const [household] = await narthexCrmDbDataSource.getHouseholds({
            householdIds: [householdUpdateInput.id],
        });

        return household;
    },
    deleteHousehold: async (
        _,
        { householdId },
        { dataSources: { narthexCrmDbDataSource }, clientToken }
    ) => {
        authorize(clientToken, {
            scopes: ['admin'],
        });

        await narthexCrmDbDataSource.archiveHousehold(
            householdId,
            clientToken!.id
        );

        return {
            id: householdId,
        };
    },
    addDonation: async (
        _,
        { donationAddInput },
        { dataSources: { narthexCrmDbDataSource }, clientToken }
    ) => {
        authorize(clientToken, {
            scopes: ['admin'],
        });

        const donationId = await narthexCrmDbDataSource.addDonation(
            donationAddInput,
            clientToken!.id
        );

        const [donation] = await narthexCrmDbDataSource.getDonations({
            donationIds: [donationId],
        });
        return donation;
    },
    updateDonation: async (
        _,
        { donationUpdateInput },
        { dataSources: { narthexCrmDbDataSource }, clientToken }
    ) => {
        authorize(clientToken, {
            scopes: ['admin'],
        });

        await narthexCrmDbDataSource.updateDonation(
            donationUpdateInput,
            clientToken!.id
        );
        const [donation] = await narthexCrmDbDataSource.getDonations({
            donationIds: [donationUpdateInput.id],
        });

        return donation;
    },
    deleteDonation: async (
        _,
        { donationId },
        { dataSources: { narthexCrmDbDataSource }, clientToken }
    ) => {
        authorize(clientToken, {
            scopes: ['admin'],
        });

        await narthexCrmDbDataSource.archiveDonation(
            donationId,
            clientToken!.id
        );

        return {
            id: donationId,
        };
    },
};

export { Mutation };
