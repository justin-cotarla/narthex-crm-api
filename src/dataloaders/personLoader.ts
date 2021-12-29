import DataLoader from 'dataloader';
import * as R from 'ramda';

import { NarthexCrmDbDataSource } from '../datasources/NarthexCrmDbDataSource';
import { Person } from '../types/generated/graphql';

const getPersonLoader = (narthexCrmDataSource: NarthexCrmDbDataSource) => {
    const batchPersonById = async (
        personIds: readonly number[]
    ): Promise<Person[][]> => {
        const persons = await narthexCrmDataSource.getPeople(
            personIds as number[]
        );

        const personMap = R.groupBy(({ id }) => id.toString(), persons);

        return personIds.map((personId) => personMap[personId] ?? undefined);
    };

    return new DataLoader(batchPersonById);
};

export { getPersonLoader };
