import DataLoader from 'dataloader';
import * as R from 'ramda';

import { NarthexCrmDbDataSource } from '../datasources/NarthexCrmDbDataSource';
import { Ministry } from '../types/generated/graphql';

const getMinistryLoader = (narthexCrmDataSource: NarthexCrmDbDataSource) => {
    const batchMinistryById = async (
        ministryIds: readonly number[]
    ): Promise<Ministry[][]> => {
        const ministries = await narthexCrmDataSource.getMinistries(
            ministryIds as number[]
        );

        const ministryMap = R.groupBy(({ id }) => id.toString(), ministries);

        return ministryIds.map(
            (ministryId) => ministryMap[ministryId] ?? undefined
        );
    };

    return new DataLoader(batchMinistryById);
};

export { getMinistryLoader };
