import { UserInputError } from 'apollo-server';
import { format as sqlFormat } from 'sql-formatter';

import {
    DBMinistry,
    DBInsertResponse,
    DBUpdateResponse,
    RecordTable,
} from '../../types/database';
import {
    Ministry,
    MinistryAddInput,
    MinistryUpdateInput,
} from '../../types/generated/graphql';
import { DatabaseError, NotFoundError } from '../../util/error';
import { mapMinistry } from '../../util/mappers';
import {
    buildWhereClause,
    buildSetClause,
    buildInsertClause,
} from '../../util/query';
import { validateColor, validateRecordName } from '../../util/validation';
import { MySqlDataSource } from '../MySqlDataSource';

import * as ministryModule from './ministry';
import * as ministryDelegationModule from './ministryDelegation';

import { NarthexCrmDbDataSource } from './';

const _validateMinistryProperties = (
    ministryInput: MinistryAddInput | MinistryUpdateInput
) => {
    const { name, color } = ministryInput;

    if (color && !validateColor(color!)) {
        throw new UserInputError('Invalid color');
    }

    if (name && !validateRecordName(name)) {
        throw new UserInputError('Invalid ministry name');
    }
};

const getMinistries = async (
    query: MySqlDataSource['query'],
    options: {
        ministryIds?: number[];
        archived?: boolean | null;
    } = {}
): Promise<Ministry[]> => {
    const { archived = false, ministryIds = [] } = options;

    const whereClause = buildWhereClause([
        { clause: 'id in (?)', condition: ministryIds?.length !== 0 },
        { clause: 'archived <> 1', condition: !archived },
    ]);

    const sql = sqlFormat(`
        SELECT
            id,
            name,
            color,
            created_by,
            creation_timestamp,
            modified_by,
            modification_timestamp,
            archived
        FROM
        ministry
        ${whereClause}
    `);

    const values = [...(ministryIds.length !== 0 ? [ministryIds] : [])];

    const rows = await query<DBMinistry[]>({
        sql,
        values,
    });

    return rows?.map(mapMinistry) ?? [];
};

const addMinistry = async (
    query: MySqlDataSource['query'],
    ministryAddInput: MinistryAddInput,
    clientId: number
): Promise<number> => {
    const { name, color = '#B3BFB8' } = ministryAddInput;

    ministryModule._validateMinistryProperties(ministryAddInput);

    const insertClause = buildInsertClause([
        { key: 'name', condition: true },
        { key: 'color', condition: true },
        { key: 'created_by', condition: true },
        { key: 'modified_by', condition: true },
    ]);

    const sql = sqlFormat(`
        INSERT INTO ministry
            ${insertClause.insert}
        VALUES
            ${insertClause.values}
    `);

    const rows = await query<DBInsertResponse>({
        sql,
        values: [name, parseInt(color!.substring(1), 16), clientId, clientId],
    });

    if (!rows) {
        throw new DatabaseError('Could not add ministry');
    }

    return rows.insertId;
};

const updateMinistry = async (
    query: MySqlDataSource['query'],
    logRecordChange: NarthexCrmDbDataSource['logRecordChange'],
    ministryUpdateInput: MinistryUpdateInput,
    clientId: number
): Promise<void> => {
    const { id, name, color } = ministryUpdateInput;

    const [ministry] = await ministryModule.getMinistries(query, {
        ministryIds: [id],
    });

    if (!ministry) {
        throw new NotFoundError('Ministry does not exist');
    }

    if (Object.keys(ministryUpdateInput).length <= 1) {
        throw new UserInputError('Nothing to update');
    }

    ministryModule._validateMinistryProperties(ministryUpdateInput);

    const setClause = buildSetClause([
        { key: 'modified_by', condition: true },
        { key: 'name', condition: name !== undefined },
        { key: 'color', condition: color !== undefined },
    ]);

    const sql = sqlFormat(`
        UPDATE ministry
        SET
        ${setClause}
        WHERE ID = ?;
    `);

    const values = [
        clientId,
        ...(name !== undefined ? [name] : []),
        ...(color !== undefined ? [parseInt(color!.substring(1), 16)] : []),
        id,
    ];

    const rows = await query<DBUpdateResponse>({
        sql,
        values,
    });

    if (!rows || rows.affectedRows === 0) {
        throw new DatabaseError('Could not update ministry');
    }

    await logRecordChange(RecordTable.MINISTRY, id, clientId);
};

const archiveMinistry = async (
    query: MySqlDataSource['query'],
    logRecordChange: NarthexCrmDbDataSource['logRecordChange'],
    ministryId: number,
    clientId: number
): Promise<void> => {
    const sql = sqlFormat(`
        UPDATE ministry
        SET
            archived = 1
        WHERE ID = ?;
    `);

    const rows = await query<DBUpdateResponse>({
        sql,
        values: [ministryId],
    });

    if (!rows || rows.affectedRows === 0) {
        throw new DatabaseError('Could not archive ministry');
    }

    await ministryDelegationModule.deleteMinistryDelegation(
        query,
        [ministryId],
        []
    );

    await logRecordChange(RecordTable.MINISTRY, ministryId, clientId);
};

export {
    _validateMinistryProperties,
    getMinistries,
    addMinistry,
    updateMinistry,
    archiveMinistry,
};
