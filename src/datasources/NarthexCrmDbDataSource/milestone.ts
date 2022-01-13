import { UserInputError } from 'apollo-server';
import { format as sqlFormat } from 'sql-formatter';

import {
    DBMilestone,
    DBInsertResponse,
    DBUpdateResponse,
    RecordTable,
} from '../../types/database';
import {
    Milestone,
    MilestoneAddInput,
    MilestoneUpdateInput,
} from '../../types/generated/graphql';
import { DatabaseError, NotFoundError } from '../../util/error';
import { mapMilestone } from '../../util/mappers';
import {
    buildWhereClause,
    buildSetClause,
    buildInsertClause,
} from '../../util/query';
import { validateDate } from '../../util/validation';
import { MySqlDataSource } from '../MySqlDataSource';

import * as milestoneModule from './milestone';

import { NarthexCrmDbDataSource } from '.';

const _validateMilestoneProperties = (
    milestoneInput: MilestoneAddInput | MilestoneUpdateInput
) => {
    const { date, type } = milestoneInput;

    if (type === null || date === null) {
        throw new UserInputError('Mandatory input cannot be null');
    }

    if (date && !validateDate(date!)) {
        throw new UserInputError('Invalid date');
    }
};

const getMilestones = async (
    query: MySqlDataSource['query'],
    options: {
        milestoneIds?: number[];
        personIds?: number[];
        archived?: boolean | null;
    } = {}
): Promise<Milestone[]> => {
    const { archived = false, milestoneIds = [], personIds = [] } = options;

    const whereClause = buildWhereClause([
        { clause: 'id in (?)', condition: milestoneIds?.length !== 0 },
        { clause: 'person_id in (?)', condition: personIds?.length !== 0 },
        { clause: 'archived <> 1', condition: !archived },
    ]);

    const sql = sqlFormat(`
        SELECT
            id,
            person_id,
            type,
            date,
            notes,
            created_by,
            creation_timestamp,
            modified_by,
            modification_timestamp,
            archived
        FROM
        milestone
        ${whereClause}
        ORDER BY
        date ASC
    `);

    const values = [
        ...(milestoneIds.length !== 0 ? [milestoneIds] : []),
        ...(personIds.length !== 0 ? [personIds] : []),
    ];

    const rows = await query<DBMilestone[]>({
        sql,
        values,
    });

    return rows?.map(mapMilestone) ?? [];
};

const addMilestone = async (
    query: MySqlDataSource['query'],
    milestoneAddInput: MilestoneAddInput,
    clientId: number
): Promise<number> => {
    const { personId, date, type, notes } = milestoneAddInput;

    milestoneModule._validateMilestoneProperties(milestoneAddInput);

    const insertClause = buildInsertClause([
        { key: 'person_id', condition: true },
        { key: 'date', condition: true },
        { key: 'type', condition: true },
        { key: 'created_by', condition: true },
        { key: 'modified_by', condition: true },
        { key: 'notes', condition: notes !== undefined },
    ]);

    const sql = sqlFormat(`
        INSERT INTO milestone
            ${insertClause.insert}
        VALUES
            ${insertClause.values}
    `);

    const rows = await query<DBInsertResponse>({
        sql,
        values: [
            personId,
            date,
            type,
            clientId,
            clientId,
            ...(notes !== undefined ? [notes] : []),
        ],
    });

    if (!rows) {
        throw new DatabaseError('Could not add milestone');
    }

    return rows.insertId;
};

const updateMilestone = async (
    query: MySqlDataSource['query'],
    logRecordChange: NarthexCrmDbDataSource['logRecordChange'],
    milestoneUpdateInput: MilestoneUpdateInput,
    clientId: number
): Promise<void> => {
    const { id, date, type, notes } = milestoneUpdateInput;

    const [milestone] = await milestoneModule.getMilestones(query, {
        milestoneIds: [id],
    });

    if (!milestone) {
        throw new NotFoundError('Milestone does not exist');
    }

    if (Object.keys(milestoneUpdateInput).length <= 1) {
        throw new UserInputError('Nothing to update');
    }

    milestoneModule._validateMilestoneProperties(milestoneUpdateInput);

    const setClause = buildSetClause([
        { key: 'modified_by', condition: true },
        { key: 'date', condition: date !== undefined },
        { key: 'type', condition: type !== undefined },
        { key: 'notes', condition: notes !== undefined },
    ]);

    const sql = sqlFormat(`
        UPDATE milestone
        SET
        ${setClause}
        WHERE ID = ?;
    `);

    const values = [
        clientId,
        ...(date !== undefined ? [date] : []),
        ...(type !== undefined ? [type] : []),
        ...(notes !== undefined ? [notes] : []),
        id,
    ];

    const rows = await query<DBUpdateResponse>({
        sql,
        values,
    });

    if (!rows || rows.affectedRows === 0) {
        throw new DatabaseError('Could not update milestone');
    }

    await logRecordChange(RecordTable.MILESTONE, id, clientId);
};

const archiveMilestone = async (
    query: MySqlDataSource['query'],
    logRecordChange: NarthexCrmDbDataSource['logRecordChange'],
    milestoneId: number,
    clientId: number
): Promise<void> => {
    const sql = sqlFormat(`
        UPDATE milestone
        SET
            archived = 1
        WHERE ID = ?;
    `);

    const rows = await query<DBUpdateResponse>({
        sql,
        values: [milestoneId],
    });

    if (!rows || rows.affectedRows === 0) {
        throw new DatabaseError('Could not archive milestone');
    }

    await logRecordChange(RecordTable.MILESTONE, milestoneId, clientId);
};

export {
    _validateMilestoneProperties,
    getMilestones,
    addMilestone,
    updateMilestone,
    archiveMilestone,
};
