import DataLoader from 'dataloader';
import * as R from 'ramda';

import { NarthexCrmDbDataSource } from '../datasources/NarthexCrmDbDataSource';
import { DonationCampaign } from '../types/generated/graphql';

const getDonationCampaignLoader = (
    narthexCrmDataSource: NarthexCrmDbDataSource
) => {
    const batchDonationCampaignById = async (
        donationCampaignIds: readonly number[]
    ): Promise<DonationCampaign[][]> => {
        const donationCampaigns =
            await narthexCrmDataSource.getDonationCampaigns({
                donationCampaignIds: donationCampaignIds as number[],
            });

        const donationCampaignMap = R.groupBy(
            ({ id }) => id.toString(),
            donationCampaigns
        );

        return donationCampaignIds.map(
            (donationCampaignId) =>
                donationCampaignMap[donationCampaignId] ?? undefined
        );
    };

    return new DataLoader(batchDonationCampaignById);
};

export { getDonationCampaignLoader };
