import DataLoader from 'dataloader';
import * as R from 'ramda';

import { NarthexCrmDbDataSource } from '../datasources/NarthexCrmDbDataSource';
import { Donation } from '../types/generated/graphql';

const getDonationByHouseholdLoader = (
    narthexCrmDataSource: NarthexCrmDbDataSource
) => {
    const batchDonationByHouseholdId = async (
        householdIds: readonly number[]
    ): Promise<Donation[][]> => {
        const households = await narthexCrmDataSource.getDonations({
            householdIds: householdIds as number[],
        });

        const householdMap = R.groupBy(({ id }) => id.toString(), households);

        return householdIds.map(
            (householdId) => householdMap[householdId] ?? undefined
        );
    };

    return new DataLoader(batchDonationByHouseholdId);
};

export { getDonationByHouseholdLoader };