import DataLoader from 'dataloader';

import { NarthexCrmDbDataSource } from '../datasources/NarthexCrmDbDataSource';
import { Person } from '../types/generated/graphql';

const getPersonLoader = (narthexCrmDataSource: NarthexCrmDbDataSource) => {
    const batchPersonById = async (
        personIds: readonly number[]
    ): Promise<Person[]> => {
        const persons = await narthexCrmDataSource.getPeople(
            personIds as number[]
        );

        const personIndex = persons.map(({ id, ...person }) => ({
            id,
            person: { ...person, id },
        }));
        const personMap = personIndex.reduce<{ [id: number]: Person }>(
            (prev, curr) => ({
                ...prev,
                [curr.id]: curr.person,
            }),
            {}
        );

        return personIds.map((personId) => personMap[personId] ?? undefined);
    };

    return new DataLoader(batchPersonById);
};

export { getPersonLoader };
