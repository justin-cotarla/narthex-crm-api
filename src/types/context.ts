import { Logger } from 'winston';

import { createDataLoaders } from '../dataloaders';
import type { NarthexCrmDbDataSource } from '../datasources/NarthexCrmDbDataSource';

import { ClientToken } from './auth';

interface Context {
    dataSources: {
        narthexCrmDbDataSource: NarthexCrmDbDataSource;
    };
    dataLoaders: ReturnType<typeof createDataLoaders>;
    jwtSecret: string;
    clientToken: ClientToken | null;
    logger: Logger;
}

export type { Context };
