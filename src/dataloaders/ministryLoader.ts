import DataLoader from 'dataloader';

import { NarthexCrmDbDataSource } from '../datasources/NarthexCrmDbDataSource';
import { Ministry } from '../types/generated/graphql';

const getMinistryLoader = (narthexCrmDataSource: NarthexCrmDbDataSource) => {
    const batchMinistryById = async (
        ministryIds: readonly number[]
    ): Promise<Ministry[]> => {
        const ministrys = await narthexCrmDataSource.getMinistries(
            ministryIds as number[]
        );

        const ministryIndex = ministrys.map(({ id, ...ministry }) => ({
            id,
            ministry: { ...ministry, id },
        }));
        const ministryMap = ministryIndex.reduce<{ [id: number]: Ministry }>(
            (prev, curr) => ({
                ...prev,
                [curr.id]: curr.ministry,
            }),
            {}
        );

        return ministryIds.map(
            (ministryId) => ministryMap[ministryId] ?? undefined
        );
    };

    return new DataLoader(batchMinistryById);
};

export { getMinistryLoader };
