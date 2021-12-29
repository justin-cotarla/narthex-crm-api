import DataLoader from 'dataloader';
import * as R from 'ramda';

import { NarthexCrmDbDataSource } from '../datasources/NarthexCrmDbDataSource';
import { MinistryDelegation } from '../types/generated/graphql';

const getMinistryDelegationsByMinistryLoader = (
    narthexCrmDataSource: NarthexCrmDbDataSource
) => {
    const batchMinistryDelegationsByMinistryId = async (
        ministryIds: readonly number[]
    ): Promise<MinistryDelegation[][]> => {
        const ministryDelegations =
            await narthexCrmDataSource.getMinistryDelegations(
                [],
                ministryIds as number[]
            );

        const ministryDelegationMap = R.groupBy(
            ({ ministry: { id } }) => id.toString(),
            ministryDelegations
        );

        return ministryIds.map(
            (ministryId) => ministryDelegationMap[ministryId] ?? undefined
        );
    };

    return new DataLoader(batchMinistryDelegationsByMinistryId);
};

const getMinistryDelegationsByPersonLoader = (
    narthexCrmDataSource: NarthexCrmDbDataSource
) => {
    const batchMinistryDelegationsByPersonId = async (
        personIds: readonly number[]
    ): Promise<MinistryDelegation[][]> => {
        const ministryDelegations =
            await narthexCrmDataSource.getMinistryDelegations(
                personIds as number[],
                []
            );

        const ministryDelegationMap = R.groupBy(
            ({ delegee: { id } }) => id.toString(),
            ministryDelegations
        );

        return personIds.map(
            (delegeeId) =>
                ministryDelegationMap[delegeeId.toString()] ?? undefined
        );
    };

    return new DataLoader(batchMinistryDelegationsByPersonId);
};

export {
    getMinistryDelegationsByPersonLoader,
    getMinistryDelegationsByMinistryLoader,
};
