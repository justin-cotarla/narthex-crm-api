import type { NarthexCrmDbDataSource } from '../datasources/NarthexCrmDbDataSource';

import { ClientToken } from './auth';

interface Context {
    dataSources: {
        narthexCrmDbDataSource: NarthexCrmDbDataSource;
    };
    jwtSecret: string;
    clientToken: ClientToken | null;
}

export type { Context };
