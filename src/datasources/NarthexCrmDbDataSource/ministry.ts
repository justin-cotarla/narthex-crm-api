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
import { DatabaseError } from '../../util/error';
import { mapMinistry } from '../../util/mappers';
import { buildWhereClause, buildSetClause } from '../../util/query';
import { validateColor, validateRecordName } from '../../util/validation';
import { MySqlDataSource } from '../MySqlDataSource';

import { NarthexCrmDbDataSource } from './';

const getMinistries = async (
    query: MySqlDataSource['query'],
    ministryIds: number[],
    archived?: boolean | null
): Promise<Ministry[]> => {
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

    if (!validateColor(color!)) {
        throw new UserInputError('Invalid color');
    }

    if (!validateRecordName(name)) {
        throw new UserInputError('Invalid ministry name');
    }

    const sql = sqlFormat(`
        INSERT INTO ministry
            (name, color, created_by, modified_by)
        VALUES
            (?, ?, ?, ?)
    `);

    const rows = await query<DBInsertResponse>({
        sql,
        values: [name, parseInt(color!.substring(1), 16), clientId, clientId],
    });

    if (!rows) {
        throw new Error('Could not add ministry');
    }

    return rows.insertId;
};

const updateMinistry = async (
    query: MySqlDataSource['query'],
    logRecordChange: NarthexCrmDbDataSource['logRecordChange'],
    ministryUpdateInput: MinistryUpdateInput,
    clientId: number
): Promise<void> => {
    if (Object.keys(ministryUpdateInput).length <= 1) {
        throw new UserInputError('Nothing to update');
    }

    const { id, name, color } = ministryUpdateInput;

    if (color && !validateColor(color!)) {
        throw new UserInputError('Invalid color');
    }

    if (name && !validateRecordName(name)) {
        throw new UserInputError('Invalid ministry name');
    }

    const setClause = buildSetClause([
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
        ...(name ? [name] : []),
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

    await logRecordChange(RecordTable.MINISTRY, ministryId, clientId);
};

export { getMinistries, addMinistry, updateMinistry, archiveMinistry };
