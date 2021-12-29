import DataLoader from 'dataloader';

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

        const ministryDelegationIndex = ministryDelegations.map(
            ({ ministry, ...ministryDelegation }) => ({
                ministryId: ministry.id,
                ministryDelegation: { ...ministryDelegation, ministry },
            })
        );
        const ministryDelegationMap = ministryDelegationIndex.reduce<{
            [id: number]: MinistryDelegation[];
        }>(
            (prev, curr) => ({
                ...prev,
                [curr.ministryId]: [
                    ...(prev[curr.ministryId] ? prev[curr.ministryId] : []),
                    curr.ministryDelegation,
                ],
            }),
            {}
        );

        return ministryIds.map(
            (delegeeId) => ministryDelegationMap[delegeeId] ?? undefined
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

        const ministryDelegationIndex = ministryDelegations.map(
            ({ delegee, ...ministryDelegation }) => ({
                personId: delegee.id,
                ministryDelegation: { ...ministryDelegation, delegee },
            })
        );
        const ministryDelegationMap = ministryDelegationIndex.reduce<{
            [id: number]: MinistryDelegation[];
        }>(
            (prev, curr) => ({
                ...prev,
                [curr.personId]: [
                    ...(prev[curr.personId] ? prev[curr.personId] : []),
                    curr.ministryDelegation,
                ],
            }),
            {}
        );

        return personIds.map(
            (delegeeId) => ministryDelegationMap[delegeeId] ?? undefined
        );
    };

    return new DataLoader(batchMinistryDelegationsByPersonId);
};

export {
    getMinistryDelegationsByPersonLoader,
    getMinistryDelegationsByMinistryLoader,
};
