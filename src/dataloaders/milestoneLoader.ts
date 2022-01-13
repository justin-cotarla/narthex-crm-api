import DataLoader from 'dataloader';
import * as R from 'ramda';

import { NarthexCrmDbDataSource } from '../datasources/NarthexCrmDbDataSource';
import { Milestone } from '../types/generated/graphql';

const getMilestoneByPersonLoader = (
    narthexCrmDataSource: NarthexCrmDbDataSource
) => {
    const batchMilestoneByPersonId = async (
        personIds: readonly number[]
    ): Promise<Milestone[][]> => {
        const milestones = await narthexCrmDataSource.getMilestones({
            personIds: personIds as number[],
        });

        const milestoneMap = R.groupBy(
            ({ subject }) => subject!.id.toString(),
            milestones
        );

        return personIds.map(
            (milestoneId) => milestoneMap[milestoneId] ?? undefined
        );
    };

    return new DataLoader(batchMilestoneByPersonId);
};

export { getMilestoneByPersonLoader };
