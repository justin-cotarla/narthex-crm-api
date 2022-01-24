import DataLoader from 'dataloader';
import * as R from 'ramda';

import { NarthexCrmDbDataSource } from '../datasources/NarthexCrmDbDataSource';
import { Household } from '../types/generated/graphql';

const getHouseholdLoader = (narthexCrmDataSource: NarthexCrmDbDataSource) => {
    const batchHouseholdById = async (
        householdIds: readonly number[]
    ): Promise<Household[][]> => {
        const households = await narthexCrmDataSource.getHouseholds({
            householdIds: householdIds as number[],
            archived: true,
        });

        const householdMap = R.groupBy(({ id }) => id.toString(), households);

        return householdIds.map(
            (householdId) => householdMap[householdId] ?? undefined
        );
    };

    return new DataLoader(batchHouseholdById);
};

export { getHouseholdLoader };
