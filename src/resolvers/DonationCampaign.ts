import { DonationCampaignResolvers } from '../types/generated/graphql';

const DonationCampaign: DonationCampaignResolvers = {
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

    donations: async ({ id }, _, { dataLoaders: { donations } }) => {
        const donationResult = await donations.load(id);

        return donationResult ?? [];
    },
};

export { DonationCampaign };
