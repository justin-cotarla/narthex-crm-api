import { NarthexCrmDbDataSource } from '../datasources/NarthexCrmDbDataSource';

import { getClientLoader } from './clientLoader';

const createDataLoaders = (narthexCrmDataSource: NarthexCrmDbDataSource) => ({
    clients: getClientLoader(narthexCrmDataSource),
});

export { createDataLoaders };
