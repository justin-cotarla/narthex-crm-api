import { PoolConfig } from 'mysql';
import { format as sqlFormat } from 'sql-formatter';

import { DBUpdateResponse, RecordTable } from '../../types/database';
import { MySqlDataSource } from '../MySqlDataSource';

import { addClient, getClients, getToken, updateClient } from './clients';
import {
    addMinistry,
    archiveMinistry,
    getMinistries,
    updateMinistry,
} from './ministry';

type Tail<T extends unknown[]> = T extends [unknown, ...infer U] ? U : never;

class NarthexCrmDbDataSource extends MySqlDataSource {
    constructor(mySqlConfig: PoolConfig) {
        super(mySqlConfig);
    }

    private logClientConnection = async (clientId: number) => {
        const sql = sqlFormat(`
            UPDATE client
            SET
                last_login_timestamp = CURRENT_TIMESTAMP
            WHERE
                 id = ?
        `);

        const rows = await this.query<DBUpdateResponse>({
            sql,
            values: [clientId],
        });

        if (!rows || rows.changedRows === 0) {
            this.context!.logger.error('Could not log client connections');
        }
    };

    private logRecordChange = async (
        table: RecordTable,
        recordId: number,
        clientId: number
    ): Promise<void> => {
        const sql = sqlFormat(`
            UPDATE ${table}
            SET
                modified_by = ?,
                modification_timestamp = CURRENT_TIMESTAMP
            WHERE
                 id = ?
        `);

        const rows = await this.query<DBUpdateResponse>({
            sql,
            values: [clientId, recordId],
        });

        if (!rows || rows.changedRows === 0) {
            this.context!.logger.error('Could not log record change');
        }
    };

    addClient = (...args: Tail<Parameters<typeof addClient>>) =>
        addClient(this.query.bind(this), ...args);

    getClients = (...args: Tail<Parameters<typeof getClients>>) =>
        getClients(this.query.bind(this), ...args);

    getToken = (...args: Tail<Tail<Parameters<typeof getToken>>>) =>
        getToken(
            this.query.bind(this),
            this.logClientConnection.bind(this),
            ...args
        );

    updateClient = (...args: Tail<Parameters<typeof updateClient>>) =>
        updateClient(this.query.bind(this), ...args);

    getMinistries = (...args: Tail<Parameters<typeof getMinistries>>) =>
        getMinistries(this.cacheQuery.bind(this), ...args);

    addMinistry = (...args: Tail<Parameters<typeof addMinistry>>) =>
        addMinistry(this.query.bind(this), ...args);

    updateMinistry = (...args: Tail<Tail<Parameters<typeof updateMinistry>>>) =>
        updateMinistry(
            this.query.bind(this),
            this.logRecordChange.bind(this),
            ...args
        );

    archiveMinistry = (
        ...args: Tail<Tail<Parameters<typeof archiveMinistry>>>
    ) =>
        archiveMinistry(
            this.query.bind(this),
            this.logRecordChange.bind(this),
            ...args
        );
}

export { NarthexCrmDbDataSource };
