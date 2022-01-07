import {
    DonationCampaignSortKey,
    DonationSortKey,
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

        const ministries = await narthexCrmDbDataSource.getMinistries({
            archived,
        });

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

        const [ministry] = await narthexCrmDbDataSource.getMinistries({
            ministryIds: [ministryId],
        });

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

        const people = await narthexCrmDbDataSource.getPeople({
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

        const [person] = await narthexCrmDbDataSource.getPeople({
            personIds: [personId],
        });

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

        const households = await narthexCrmDbDataSource.getHouseholds({
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

        const [household] = await narthexCrmDbDataSource.getHouseholds({
            householdIds: [householdId],
        });

        return household;
    },

    donations: async (
        _,
        {
            archived,
            sortKey = DonationSortKey.Date,
            paginationOptions = defaultPaginationOptions,
        },
        { dataSources: { narthexCrmDbDataSource }, clientToken }
    ) => {
        authorize(clientToken, {
            scopes: ['admin'],
        });

        const donations = await narthexCrmDbDataSource.getDonations({
            sortKey: sortKey!,
            paginationOptions: paginationOptions!,
            archived,
        });
        return donations;
    },

    donationById: async (
        _,
        { donationId },
        { dataSources: { narthexCrmDbDataSource }, clientToken }
    ) => {
        authorize(clientToken, {
            scopes: ['admin'],
        });

        const [donation] = await narthexCrmDbDataSource.getDonations({
            donationIds: [donationId],
        });

        return donation;
    },

    donationCampaigns: async (
        _,
        {
            archived,
            sortKey = DonationCampaignSortKey.StartDate,
            paginationOptions = defaultPaginationOptions,
            afterDate,
            beforeDate,
        },
        { dataSources: { narthexCrmDbDataSource }, clientToken }
    ) => {
        authorize(clientToken, {
            scopes: ['admin'],
        });

        const donationCampaigns =
            await narthexCrmDbDataSource.getDonationCampaigns({
                sortKey: sortKey!,
                paginationOptions: paginationOptions!,
                archived,
                beforeDate,
                afterDate,
            });
        return donationCampaigns;
    },

    donationCampaignById: async (
        _,
        { donationCampaignId },
        { dataSources: { narthexCrmDbDataSource }, clientToken }
    ) => {
        authorize(clientToken, {
            scopes: ['admin'],
        });

        const [donationCampaign] =
            await narthexCrmDbDataSource.getDonationCampaigns({
                donationCampaignIds: [donationCampaignId],
            });

        return donationCampaign;
    },
};

export { Query };
