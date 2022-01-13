import { UserInputError } from 'apollo-server';
import { format as sqlFormat } from 'sql-formatter';

import {
    DBHousehold,
    DBInsertResponse,
    DBUpdateResponse,
    RecordTable,
} from '../../types/database';
import {
    PaginationOptions,
    Household,
    HouseholdAddInput,
    HouseholdSortKey,
    HouseholdUpdateInput,
} from '../../types/generated/graphql';
import { DatabaseError, NotFoundError } from '../../util/error';
import { mapHousehold } from '../../util/mappers';
import {
    buildWhereClause,
    buildSetClause,
    buildInsertClause,
    buildPaginationClause,
} from '../../util/query';
import { validateAddress, validateRecordName } from '../../util/validation';
import { MySqlDataSource } from '../MySqlDataSource';

import * as householdModule from './household';
import * as personModule from './person';

import { NarthexCrmDbDataSource } from '.';

const _validateHouseholdProperties = (
    householdInput: HouseholdAddInput | HouseholdUpdateInput
) => {
    const { address, name } = householdInput;

    if (name === null || address === null) {
        throw new UserInputError('Mandatory input cannot be null');
    }

    if (name && !validateRecordName(name)) {
        throw new UserInputError('Invalid household name');
    }
    if (address && !validateAddress(address)) {
        throw new UserInputError('Invalid address');
    }
};

const clearHouseholdHead = async (
    query: MySqlDataSource['query'],
    personId: number
): Promise<void> => {
    const sql = sqlFormat(`
        UPDATE household
            SET head_id = null
        WHERE
            head_id = ?;
    `);

    const values = [personId];

    await query<DBHousehold[]>({
        sql,
        values,
    });
};

const getHouseholds = async (
    query: MySqlDataSource['query'],
    options: {
        householdIds?: number[];
        sortKey?: HouseholdSortKey;
        paginationOptions?: PaginationOptions;
        archived?: boolean | null;
    } = {}
): Promise<Household[]> => {
    const {
        paginationOptions,
        sortKey,
        archived = false,
        householdIds = [],
    } = options;

    const whereClause = buildWhereClause([
        { clause: 'id in (?)', condition: householdIds.length !== 0 },
        { clause: 'archived <> 1', condition: !archived },
    ]);

    const paginationClause =
        (paginationOptions &&
            sortKey &&
            buildPaginationClause(paginationOptions, sortKey.toString())) ||
        '';

    const sql = sqlFormat(`
        SELECT
            id,
            head_id,
            name,
            address_line_1,
            address_line_2,
            city,
            state,
            postal_code,
            country,
            created_by,
            creation_timestamp,
            modified_by,
            modification_timestamp,
            archived
        FROM
        household
        ${whereClause}
        ${paginationClause}
    `);

    const values = [...(householdIds.length !== 0 ? [householdIds] : [])];

    const rows = await query<DBHousehold[]>({
        sql,
        values,
    });

    return rows?.map(mapHousehold) ?? [];
};

const addHousehold = async (
    query: MySqlDataSource['query'],
    householdAddInput: HouseholdAddInput,
    clientId: number
): Promise<number> => {
    const { address, name } = householdAddInput;

    householdModule._validateHouseholdProperties(householdAddInput);

    const insertClause = buildInsertClause([
        { key: 'name', condition: true },
        { key: 'address_line_1', condition: true },
        { key: 'city', condition: true },
        { key: 'state', condition: true },
        { key: 'postal_code', condition: true },
        { key: 'country', condition: true },
        { key: 'created_by', condition: true },
        { key: 'modified_by', condition: true },
        { key: 'address_line_2', condition: address.line2 !== undefined },
    ]);

    const sql = sqlFormat(`
        INSERT INTO household
            ${insertClause.insert}
        VALUES
            ${insertClause.values}
    `);

    const rows = await query<DBInsertResponse>({
        sql,
        values: [
            name,
            address.line1,
            address.city,
            address.state,
            address.postalCode,
            address.country,
            clientId,
            clientId,
            ...(address.line2 !== undefined ? [address.line2] : []),
        ],
    });

    if (!rows) {
        throw new Error('Could not add household');
    }

    return rows.insertId;
};

const updateHousehold = async (
    query: MySqlDataSource['query'],
    logRecordChange: NarthexCrmDbDataSource['logRecordChange'],
    householdUpdateInput: HouseholdUpdateInput,
    clientId: number
): Promise<void> => {
    const { id, address, name, headId } = householdUpdateInput;

    const [household] = await householdModule.getHouseholds(query, {
        householdIds: [id],
    });

    if (!household) {
        throw new NotFoundError('Household does not exist');
    }

    if (Object.keys(householdUpdateInput).length <= 1) {
        throw new UserInputError('Nothing to update');
    }

    householdModule._validateHouseholdProperties(householdUpdateInput);

    if (headId) {
        const [householdHead] = await personModule.getPeople(query, {
            personIds: [headId],
        });
        if (!householdHead) {
            throw new UserInputError('Household head not valid');
        }

        if (householdHead.household!.id !== id) {
            throw new UserInputError('Household head not member of household');
        }
    }

    const setClause = buildSetClause([
        { key: 'modified_by', condition: true },
        { key: 'name', condition: name !== undefined },
        { key: 'head_id', condition: headId !== undefined },
        { key: 'address_line_1', condition: address?.line1 !== undefined },
        { key: 'address_line_2', condition: address?.line2 !== undefined },
        { key: 'city', condition: address?.city !== undefined },
        { key: 'state', condition: address?.state !== undefined },
        { key: 'postal_code', condition: address?.postalCode !== undefined },
        { key: 'country', condition: address?.country !== undefined },
    ]);

    const sql = sqlFormat(`
        UPDATE household
        SET
        ${setClause}
        WHERE ID = ?;
    `);

    const values = [
        clientId,
        ...(name !== undefined ? [name] : []),
        ...(headId !== undefined ? [headId] : []),
        ...(address?.line1 !== undefined ? [address.line1] : []),
        ...(address?.line2 !== undefined ? [address.line2] : []),
        ...(address?.city !== undefined ? [address.city] : []),
        ...(address?.state !== undefined ? [address.state] : []),
        ...(address?.postalCode !== undefined ? [address.postalCode] : []),
        ...(address?.country !== undefined ? [address.country] : []),
        id,
    ];

    const rows = await query<DBUpdateResponse>({
        sql,
        values,
    });

    if (!rows || rows.affectedRows === 0) {
        throw new DatabaseError('Could not update household');
    }

    await logRecordChange(RecordTable.HOUSEHOLD, id, clientId);
};

const archiveHousehold = async (
    query: MySqlDataSource['query'],
    logRecordChange: NarthexCrmDbDataSource['logRecordChange'],
    householdId: number,
    clientId: number
): Promise<void> => {
    const householdMembers = await personModule.getPeople(query, {
        householdIds: [householdId],
    });

    if (householdMembers.length > 0) {
        throw new UserInputError(
            'Household must not have members to be removed'
        );
    }

    const sql = sqlFormat(`
        UPDATE household
        SET
            archived = 1
        WHERE ID = ?;
    `);

    const rows = await query<DBUpdateResponse>({
        sql,
        values: [householdId],
    });

    if (!rows || rows.affectedRows === 0) {
        throw new DatabaseError('Could not archive household');
    }

    await logRecordChange(RecordTable.HOUSEHOLD, householdId, clientId);
};

export {
    _validateHouseholdProperties,
    clearHouseholdHead,
    getHouseholds,
    addHousehold,
    updateHousehold,
    archiveHousehold,
};
