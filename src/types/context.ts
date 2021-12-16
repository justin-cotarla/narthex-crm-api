import type { NarthexCrmDbDataSource } from '../datasources/NarthexCrmDbDataSource';

interface Context {
    dataSources: {
        narthexCrmDbDataSource: NarthexCrmDbDataSource;
    };
    jwtSecret: string;
}

export type { Context };
