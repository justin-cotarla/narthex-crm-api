import { NarthexCrmDbDataSource } from '../datasources/NarthexCrmDbDataSource';

import { getClientLoader } from './clientLoader';
import {
    getMinistryDelegationsByMinistryLoader,
    getMinistryDelegationsByPersonLoader,
} from './ministryDelegationLoader';
import { getMinistryLoader } from './ministryLoader';
import { getPersonLoader } from './personLoader';

const createDataLoaders = (narthexCrmDataSource: NarthexCrmDbDataSource) => ({
    clients: getClientLoader(narthexCrmDataSource),
    people: getPersonLoader(narthexCrmDataSource),
    ministries: getMinistryLoader(narthexCrmDataSource),
    ministryDelegationsByPerson:
        getMinistryDelegationsByPersonLoader(narthexCrmDataSource),
    ministryDelegationsByMinistry:
        getMinistryDelegationsByMinistryLoader(narthexCrmDataSource),
});

export { createDataLoaders };
