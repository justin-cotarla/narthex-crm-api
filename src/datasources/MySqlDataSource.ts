import crypto from 'crypto';
import { promisify } from 'util';

import { DataSource, DataSourceConfig } from 'apollo-datasource';
import { InMemoryLRUCache, KeyValueCache } from 'apollo-server-caching';
import mysql, { Pool, PoolConfig, QueryOptions, MysqlError } from 'mysql';

import { Context } from '../types/context';
import { MySqlErrorCode } from '../types/database';
import { DatabaseError, DuplicateEntryError } from '../util/error';

class MySqlDataSource extends DataSource {
    protected context?: Context;
    private cache?: KeyValueCache<unknown>;

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
            dateStrings: ['DATE'],
        });
    }

    initialize(config: DataSourceConfig<Context>) {
        this.context = config.context;
        this.cache = config.cache || new InMemoryLRUCache();
    }

    private logQuery = (options: QueryOptions): void => {
        this.context?.logger.debug(`SQL Query\n${options.sql}`);

        if (options.values?.length > 0) {
            this.context?.logger.debug(
                `SQL Query Values\n[${options.values.join(', ')}]`
            );
        }
    };

    protected async query<T>(options: QueryOptions): Promise<T | void> {
        if (!this.pool) {
            throw new Error('Pool not initialized');
        }

        try {
            this.logQuery(options);

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
                throw new DatabaseError('Query could not be executed');
            }

            if ((e as MysqlError).errno === MySqlErrorCode.DUPLICATE_ENTRY) {
                throw new DuplicateEntryError();
            }

            throw new DatabaseError(e.message);
        }
    }

    protected async cacheQuery<T>(
        options: QueryOptions,
        ttl = 5
    ): Promise<T | void> {
        if (!this.cache) {
            throw new Error('Cache not initialized');
        }

        const cacheKey = crypto
            .createHash('sha1')
            .update(`${options.sql}${JSON.stringify(options.values)}`)
            .digest('base64');

        const entry = await this.cache.get(cacheKey);

        if (entry) {
            this.context?.logger.debug(`Cache Hit`);
            this.logQuery(options);
            return entry as T;
        }

        const rows = await this.query<T>(options);

        if (rows) {
            this.cache.set(cacheKey, rows, { ttl });
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
