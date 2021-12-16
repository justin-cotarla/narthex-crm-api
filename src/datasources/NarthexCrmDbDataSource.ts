import { PoolConfig } from 'mysql';

import { MySqlDataSource } from './MySqlDataSource';

class NarthexCrmDbDataSource extends MySqlDataSource {
    constructor(mySqlConfig: PoolConfig) {
        super(mySqlConfig);
    }
}

export { NarthexCrmDbDataSource };
