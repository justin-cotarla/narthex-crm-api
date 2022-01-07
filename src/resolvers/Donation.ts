import { DonationResolvers } from '../types/generated/graphql';

const Donation: DonationResolvers = {
    createdBy: async ({ createdBy }, _, { dataLoaders: { clients } }) => {
        if (!createdBy) {
            return null;
        }
        const [clientResult] = await clients.load(createdBy?.id);

        return clientResult ?? null;
    },

    modifiedBy: async ({ createdBy }, _, { dataLoaders: { clients } }) => {
        if (!createdBy) {
            return null;
        }
        const [clientResult] = await clients.load(createdBy?.id);

        return clientResult ?? null;
    },

    household: async ({ household }, _, { dataLoaders: { households } }) => {
        if (!household?.id) {
            return null;
        }
        const [householdResult] = await households.load(household.id);

        return householdResult ?? null;
    },

    donationCampaign: async (
        { donationCampaign },
        _,
        { dataLoaders: { donationCampaigns } }
    ) => {
        if (!donationCampaign?.id) {
            return null;
        }

        const [donationCampaignResult] = await donationCampaigns.load(
            donationCampaign.id
        );

        return donationCampaignResult ?? null;
    },
};

export { Donation };
