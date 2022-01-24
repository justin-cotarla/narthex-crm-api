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
    setMinistryDelegation: async (
        _,
        { ministryDelegationSetInput },
        { dataSources: { narthexCrmDbDataSource }, clientToken }
    ) => {
        authorize(clientToken, {
            scopes: ['admin'],
        });

        await narthexCrmDbDataSource.setMinistryDelegation(
            ministryDelegationSetInput,
            clientToken!.id
        );

        const [ministryDelegation] =
            await narthexCrmDbDataSource.getMinistryDelegations(
                [ministryDelegationSetInput.ministryId],
                [ministryDelegationSetInput.personId]
            );

        return ministryDelegation;
    },
    deleteMinistryDelegation: async (
        _,
        { ministryId, personId },
        { dataSources: { narthexCrmDbDataSource }, clientToken }
    ) => {
        authorize(clientToken, {
            scopes: ['admin'],
        });

        await narthexCrmDbDataSource.deleteMinistryDelegation(
            [ministryId],
            [personId]
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
    addDonationCampaign: async (
        _,
        { donationCampaignAddInput },
        { dataSources: { narthexCrmDbDataSource }, clientToken }
    ) => {
        authorize(clientToken, {
            scopes: ['admin'],
        });

        const donationCampaignId =
            await narthexCrmDbDataSource.addDonationCampaign(
                donationCampaignAddInput,
                clientToken!.id
            );

        const [donationCampaign] =
            await narthexCrmDbDataSource.getDonationCampaigns({
                donationCampaignIds: [donationCampaignId],
            });
        return donationCampaign;
    },
    updateDonationCampaign: async (
        _,
        { donationCampaignUpdateInput },
        { dataSources: { narthexCrmDbDataSource }, clientToken }
    ) => {
        authorize(clientToken, {
            scopes: ['admin'],
        });

        await narthexCrmDbDataSource.updateDonationCampaign(
            donationCampaignUpdateInput,
            clientToken!.id
        );
        const [donationCampaign] =
            await narthexCrmDbDataSource.getDonationCampaigns({
                donationCampaignIds: [donationCampaignUpdateInput.id],
            });

        return donationCampaign;
    },
    deleteDonationCampaign: async (
        _,
        { donationCampaignId },
        { dataSources: { narthexCrmDbDataSource }, clientToken }
    ) => {
        authorize(clientToken, {
            scopes: ['admin'],
        });

        await narthexCrmDbDataSource.archiveDonationCampaign(
            donationCampaignId,
            clientToken!.id
        );

        return {
            id: donationCampaignId,
        };
    },
    addMilestone: async (
        _,
        { milestoneAddInput },
        { dataSources: { narthexCrmDbDataSource }, clientToken }
    ) => {
        authorize(clientToken, {
            scopes: ['admin'],
        });

        const milestoneId = await narthexCrmDbDataSource.addMilestone(
            milestoneAddInput,
            clientToken!.id
        );

        const [milestone] = await narthexCrmDbDataSource.getMilestones({
            milestoneIds: [milestoneId],
        });
        return milestone;
    },
    updateMilestone: async (
        _,
        { milestoneUpdateInput },
        { dataSources: { narthexCrmDbDataSource }, clientToken }
    ) => {
        authorize(clientToken, {
            scopes: ['admin'],
        });

        await narthexCrmDbDataSource.updateMilestone(
            milestoneUpdateInput,
            clientToken!.id
        );
        const [milestone] = await narthexCrmDbDataSource.getMilestones({
            milestoneIds: [milestoneUpdateInput.id],
        });

        return milestone;
    },
    deleteMilestone: async (
        _,
        { milestoneId },
        { dataSources: { narthexCrmDbDataSource }, clientToken }
    ) => {
        authorize(clientToken, {
            scopes: ['admin'],
        });

        await narthexCrmDbDataSource.archiveMilestone(
            milestoneId,
            clientToken!.id
        );

        return {
            id: milestoneId,
        };
    },
    addEvent: async (
        _,
        { eventAddInput },
        { dataSources: { narthexCrmDbDataSource }, clientToken }
    ) => {
        authorize(clientToken, {
            scopes: ['admin'],
        });

        const eventId = await narthexCrmDbDataSource.addEvent(
            eventAddInput,
            clientToken!.id
        );

        const [event] = await narthexCrmDbDataSource.getEvents({
            eventIds: [eventId],
        });
        return event;
    },
    updateEvent: async (
        _,
        { eventUpdateInput },
        { dataSources: { narthexCrmDbDataSource }, clientToken }
    ) => {
        authorize(clientToken, {
            scopes: ['admin'],
        });

        await narthexCrmDbDataSource.updateEvent(
            eventUpdateInput,
            clientToken!.id
        );
        const [event] = await narthexCrmDbDataSource.getEvents({
            eventIds: [eventUpdateInput.id],
        });

        return event;
    },
    deleteEvent: async (
        _,
        { eventId },
        { dataSources: { narthexCrmDbDataSource }, clientToken }
    ) => {
        authorize(clientToken, {
            scopes: ['admin'],
        });

        await narthexCrmDbDataSource.archiveEvent(eventId, clientToken!.id);

        return {
            id: eventId,
        };
    },
    setEventRegistration: async (
        _,
        { eventAttendanceSetInput },
        { dataSources: { narthexCrmDbDataSource }, clientToken }
    ) => {
        authorize(clientToken, {
            scopes: ['admin'],
        });

        await narthexCrmDbDataSource.setEventAttendance(
            eventAttendanceSetInput,
            clientToken!.id
        );

        const [eventAttendence] =
            await narthexCrmDbDataSource.getEventAttendance(
                [eventAttendanceSetInput.eventId],
                [eventAttendanceSetInput.personId]
            );

        return eventAttendence;
    },

    deleteEventRegistration: async (
        _,
        { eventId, personId },
        { dataSources: { narthexCrmDbDataSource }, clientToken }
    ) => {
        authorize(clientToken, {
            scopes: ['admin'],
        });

        await narthexCrmDbDataSource.deleteEventAttendance(
            [eventId],
            [personId]
        );

        return {
            eventId,
            personId,
        };
    },
};

export { Mutation };
