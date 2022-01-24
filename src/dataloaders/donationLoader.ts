import DataLoader from 'dataloader';
import * as R from 'ramda';

import { NarthexCrmDbDataSource } from '../datasources/NarthexCrmDbDataSource';
import { Donation } from '../types/generated/graphql';

const getDonationLoader = (narthexCrmDataSource: NarthexCrmDbDataSource) => {
    const batchDonationById = async (
        donationIds: readonly number[]
    ): Promise<Donation[][]> => {
        const donations = await narthexCrmDataSource.getDonations({
            donationIds: donationIds as number[],
        });

        const donationMap = R.groupBy(({ id }) => id.toString(), donations);

        return donationIds.map(
            (donationId) => donationMap[donationId] ?? undefined
        );
    };

    return new DataLoader(batchDonationById);
};

const getDonationByHouseholdLoader = (
    narthexCrmDataSource: NarthexCrmDbDataSource
) => {
    const batchDonationByHouseholdId = async (
        householdIds: readonly number[]
    ): Promise<Donation[][]> => {
        const households = await narthexCrmDataSource.getDonations({
            householdIds: householdIds as number[],
        });

        const householdMap = R.groupBy(
            ({ household }) => household!.id.toString(),
            households
        );

        return householdIds.map(
            (householdId) => householdMap[householdId] ?? undefined
        );
    };

    return new DataLoader(batchDonationByHouseholdId);
};

export { getDonationByHouseholdLoader, getDonationLoader };
