import { NarthexCrmDbDataSource } from '../datasources/NarthexCrmDbDataSource';

export type Context = {
    dataSources: {
        narthexCrmDbDataSource: NarthexCrmDbDataSource;
    };
};
