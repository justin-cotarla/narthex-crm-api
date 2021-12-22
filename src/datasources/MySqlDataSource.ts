import crypto from 'crypto';
import { promisify } from 'util';

import { DataSource, DataSourceConfig } from 'apollo-datasource';
import { InMemoryLRUCache, KeyValueCache } from 'apollo-server-caching';
import mysql, { Pool, PoolConfig, QueryOptions, MysqlError } from 'mysql';

import { Context } from '../types/context';
import { MySqlErrorCode } from '../util/enums';
import { DatabaseError, QueryError } from '../util/error';

class MySqlDataSource extends DataSource {
    protected context?: Context;
    private cache?: KeyValueCache<string>;

    private pool?: Pool;

    constructor(mySqlConfig: PoolConfig) {
        super();

        this.pool = mysql.createPool({
            ...mySqlConfig,
            typeCast: (field, next) => {
                if (field.type === 'BIT' && field.length === 1) {
                    return Buffer.from(field.string()!).readInt8();
                } else {
                    return next();
                }
            },
        });
    }

    initialize(config: DataSourceConfig<Context>) {
        this.context = config.context;
        this.cache = config.cache || new InMemoryLRUCache();
    }

    protected async query<T>(options: QueryOptions): Promise<T | void> {
        if (!this.pool) {
            throw new Error('Pool not initialized');
        }

        try {
            const connection = await promisify(this.pool.getConnection).bind(
                this.pool
            )();

            const results = await promisify(connection.query).bind(connection)(
                options
            );

            connection.release();

            return results as T;
        } catch (e) {
            if (!(e instanceof Error)) {
                this.context?.logger.error(e);
                throw new QueryError('Query could not be executed');
            }

            if ((e as MysqlError).errno === MySqlErrorCode.DUPLICATE_ENTRY) {
                throw new DatabaseError('Duplicate Entry');
            }

            this.context?.logger.error(e);
            throw new QueryError(e.message);
        }
    }

    protected async cacheQuery(options: QueryOptions, ttl = 5) {
        if (!this.cache) {
            throw new Error('Cache not initialized');
        }

        const cacheKey = crypto
            .createHash('sha1')
            .update(options.toString())
            .digest('base64');

        const entry = await this.cache.get(cacheKey);

        if (entry) {
            return JSON.parse(entry);
        }

        const rows = await this.query(options);

        if (rows) {
            this.cache.set(cacheKey, JSON.stringify(rows), { ttl });
            return rows;
        }
    }

    destroy() {
        if (this.pool) {
            this.pool.end();
        }
    }
}

export { MySqlDataSource };
