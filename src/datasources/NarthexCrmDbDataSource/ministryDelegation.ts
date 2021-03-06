import { UserInputError } from 'apollo-server';
import { format as sqlFormat } from 'sql-formatter';

import { DBMinistryDelegation, DBUpdateResponse } from '../../types/database';
import {
    MinistryDelegation,
    MinistryDelegationSetInput,
} from '../../types/generated/graphql';
import { DatabaseError } from '../../util/error';
import { mapMinistryDelegation } from '../../util/mappers';
import { buildInsertClause, buildWhereClause } from '../../util/query';
import { MySqlDataSource } from '../MySqlDataSource';

import * as ministryModule from './ministry';
import * as personModule from './person';

const getMinistryDelegations = async (
    query: MySqlDataSource['query'],
    ministryIds: number[],
    personIds: number[]
): Promise<MinistryDelegation[]> => {
    const whereClause = buildWhereClause([
        { clause: 'person_id in (?)', condition: personIds?.length !== 0 },
        { clause: 'ministry_id in (?)', condition: ministryIds?.length !== 0 },
    ]);

    const sql = sqlFormat(`
        SELECT
            ministry_id,
            person_id,
            created_by,
            creation_timestamp,
            modified_by,
            modification_timestamp
        FROM
        ministry_delegation
        ${whereClause}
    `);

    const values = [
        ...(personIds.length > 0 ? [personIds] : []),
        ...(ministryIds.length > 0 ? [ministryIds] : []),
    ];

    const rows = await query<DBMinistryDelegation[]>({
        sql,
        values,
    });

    return rows?.map(mapMinistryDelegation) ?? [];
};

const setMinistryDelegation = async (
    query: MySqlDataSource['query'],
    ministryDelegationSetInput: MinistryDelegationSetInput,
    clientId: number
): Promise<void> => {
    const { ministryId, personId } = ministryDelegationSetInput;

    const [person] = await personModule.getPeople(query, {
        personIds: [personId],
    });
    const [ministry] = await ministryModule.getMinistries(query, {
        ministryIds: [ministryId],
    });

    if (!person || person.archived) {
        throw new UserInputError('Person does not exist');
    }

    if (!ministry || ministry.archived) {
        throw new UserInputError('Ministry does not exist');
    }

    const insertClause = buildInsertClause([
        { key: 'ministry_id', condition: true },
        { key: 'person_id', condition: true },
        { key: 'created_by', condition: true },
        { key: 'modified_by', condition: true },
    ]);

    const sql = sqlFormat(`
        INSERT INTO ministry_delegation
            ${insertClause.insert}
        VALUES
            ${insertClause.values}
    `);

    const rows = await query<DBUpdateResponse>({
        sql,
        values: [ministryId, personId, clientId, clientId],
    });

    if (!rows || rows.affectedRows === 0) {
        throw new DatabaseError('Could not add person to ministry');
    }
};

const deleteMinistryDelegation = async (
    query: MySqlDataSource['query'],
    ministryIds: number[],
    personIds: number[]
): Promise<void> => {
    const whereClause = buildWhereClause([
        { clause: 'ministry_id in (?)', condition: ministryIds?.length !== 0 },
        { clause: 'person_id in (?)', condition: personIds?.length !== 0 },
    ]);

    const sql = sqlFormat(`
        DELETE FROM ministry_delegation
        ${whereClause}
    `);

    const values = [
        ...(ministryIds.length > 0 ? [ministryIds] : []),
        ...(personIds.length > 0 ? [personIds] : []),
    ];

    const rows = await query<DBUpdateResponse>({
        sql,
        values,
    });

    if (!rows || rows.affectedRows === 0) {
        throw new DatabaseError('Could not delete minstry delegation');
    }
};

export {
    setMinistryDelegation,
    getMinistryDelegations,
    deleteMinistryDelegation,
};
