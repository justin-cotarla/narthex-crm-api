import { NarthexCrmDbDataSource } from '../datasources/NarthexCrmDbDataSource';

import { getClientLoader } from './clientLoader';
import { getHouseholdLoader } from './householdLoader';
import {
    getMinistryDelegationsByMinistryLoader,
    getMinistryDelegationsByPersonLoader,
} from './ministryDelegationLoader';
import { getMinistryLoader } from './ministryLoader';
import { getPeopleByHouseholdLoader, getPersonLoader } from './personLoader';

const createDataLoaders = (narthexCrmDataSource: NarthexCrmDbDataSource) => ({
    clients: getClientLoader(narthexCrmDataSource),
    people: getPersonLoader(narthexCrmDataSource),
    ministries: getMinistryLoader(narthexCrmDataSource),
    ministryDelegationsByPerson:
        getMinistryDelegationsByPersonLoader(narthexCrmDataSource),
    ministryDelegationsByMinistry:
        getMinistryDelegationsByMinistryLoader(narthexCrmDataSource),
    households: getHouseholdLoader(narthexCrmDataSource),
    peopleByHousehold: getPeopleByHouseholdLoader(narthexCrmDataSource),
});

export { createDataLoaders };
