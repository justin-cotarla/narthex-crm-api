import DataLoader from 'dataloader';
import * as R from 'ramda';

import { NarthexCrmDbDataSource } from '../datasources/NarthexCrmDbDataSource';
import { Person } from '../types/generated/graphql';

const getPersonLoader = (narthexCrmDataSource: NarthexCrmDbDataSource) => {
    const batchPersonById = async (
        personIds: readonly number[]
    ): Promise<Person[][]> => {
        const persons = await narthexCrmDataSource.getPeople({
            personIds: personIds as number[],
        });

        const personMap = R.groupBy(({ id }) => id.toString(), persons);

        return personIds.map((personId) => personMap[personId] ?? undefined);
    };

    return new DataLoader(batchPersonById);
};

const getPeopleByHouseholdLoader = (
    narthexCrmDataSource: NarthexCrmDbDataSource
) => {
    const batchPeopleByHouseholdId = async (
        householdIds: readonly number[]
    ): Promise<Person[][]> => {
        const persons = await narthexCrmDataSource.getPeople({
            householdIds: householdIds as number[],
        });

        const personMap = R.groupBy(
            ({ household }) => household!.id.toString(),
            persons
        );

        return householdIds.map(
            (householdId) => personMap[householdId] ?? undefined
        );
    };

    return new DataLoader(batchPeopleByHouseholdId);
};

export { getPersonLoader, getPeopleByHouseholdLoader };
