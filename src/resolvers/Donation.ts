import { DonationResolvers } from '../types/generated/graphql';

const Donation: DonationResolvers = {
    createdBy: async ({ createdBy }, _, { dataLoaders: { clients } }) => {
        if (!createdBy) {
            return null;
        }
        const [clientResult] = (await clients.load(createdBy?.id)) ?? [null];

        return clientResult;
    },

    modifiedBy: async ({ createdBy }, _, { dataLoaders: { clients } }) => {
        if (!createdBy) {
            return null;
        }
        const [clientResult] = (await clients.load(createdBy?.id)) ?? [null];

        return clientResult;
    },

    household: async ({ household }, _, { dataLoaders: { households } }) => {
        if (!household?.id) {
            return null;
        }
        const [householdResult] = (await households.load(household.id)) ?? [
            null,
        ];

        return householdResult;
    },

    donationCampaign: async (
        { donationCampaign },
        _,
        { dataLoaders: { donationCampaigns } }
    ) => {
        if (!donationCampaign?.id) {
            return null;
        }

        const [donationCampaignResult] = (await donationCampaigns.load(
            donationCampaign.id
        )) ?? [null];

        return donationCampaignResult;
    },
};

export { Donation };
