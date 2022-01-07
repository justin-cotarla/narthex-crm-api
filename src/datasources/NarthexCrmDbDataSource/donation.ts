import { UserInputError } from 'apollo-server';
import { format as sqlFormat } from 'sql-formatter';

import {
    DBDonation,
    DBInsertResponse,
    DBUpdateResponse,
    RecordTable,
} from '../../types/database';
import {
    PaginationOptions,
    Donation,
    DonationAddInput,
    DonationSortKey,
    DonationUpdateInput,
} from '../../types/generated/graphql';
import { DatabaseError, NotFoundError } from '../../util/error';
import { mapDonation } from '../../util/mappers';
import {
    buildWhereClause,
    buildSetClause,
    buildInsertClause,
    buildPaginationClause,
} from '../../util/query';
import { validateCurrency, validateDate } from '../../util/validation';
import { MySqlDataSource } from '../MySqlDataSource';

import * as donationModule from './donation';
import * as householdModule from './household';

import { NarthexCrmDbDataSource } from '.';

export const _validateDonationProperties = (
    donationInput: DonationAddInput | DonationUpdateInput
) => {
    const { amount, date } = donationInput;

    if (date && !validateDate(date)) {
        throw new UserInputError("Invalid date, expected format: 'YYYY-MM-DD'");
    }
    if (amount && !validateCurrency(amount)) {
        throw new UserInputError('Invalid amount');
    }
};

const getDonations = async (
    query: MySqlDataSource['query'],
    options: {
        donationIds?: number[];
        householdIds?: number[];
        sortKey?: DonationSortKey;
        paginationOptions?: PaginationOptions;
        archived?: boolean | null;
    } = {}
): Promise<Donation[]> => {
    const {
        householdIds = [],
        donationIds = [],
        paginationOptions,
        sortKey,
        archived = false,
    } = options;

    const whereClause = buildWhereClause([
        { clause: 'id in (?)', condition: donationIds.length !== 0 },
        {
            clause: 'household_id in (?)',
            condition: householdIds.length !== 0,
        },
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
            household_id,
            donation_campaign_id,
            date,
            amount,
            notes,
            created_by,
            creation_timestamp,
            modified_by,
            modification_timestamp,
            archived
        FROM
        donation
        ${whereClause}
        ${paginationClause}
    `);

    const values = [
        ...(donationIds.length !== 0 ? [donationIds] : []),
        ...(householdIds.length !== 0 ? [householdIds] : []),
    ];

    const rows = await query<DBDonation[]>({
        sql,
        values,
    });

    return rows?.map(mapDonation) ?? [];
};

const addDonation = async (
    query: MySqlDataSource['query'],
    donationAddInput: DonationAddInput,
    clientId: number
): Promise<number> => {
    const { amount, date, householdId, notes } = donationAddInput;

    donationModule._validateDonationProperties(donationAddInput);

    const [household] = await householdModule.getHouseholds(query, {
        householdIds: [householdId],
    });
    if (!household) {
        throw new UserInputError('Household does not exist');
    }

    const insertClause = buildInsertClause([
        { key: 'date', condition: true },
        { key: 'amount', condition: true },
        { key: 'household_id', condition: true },
        { key: 'created_by', condition: true },
        { key: 'modified_by', condition: true },
        { key: 'notes', condition: notes !== undefined },
    ]);

    const sql = sqlFormat(`
        INSERT INTO donation
            ${insertClause.insert}
        VALUES
            ${insertClause.values}
    `);

    const rows = await query<DBInsertResponse>({
        sql,
        values: [
            date,
            amount,
            householdId,
            clientId,
            clientId,
            ...(notes !== undefined ? [notes] : []),
        ],
    });

    if (!rows) {
        throw new DatabaseError('Could not add donation');
    }

    return rows.insertId;
};

const updateDonation = async (
    query: MySqlDataSource['query'],
    logRecordChange: NarthexCrmDbDataSource['logRecordChange'],
    donationUpdateInput: DonationUpdateInput,
    clientId: number
): Promise<void> => {
    const { id, amount, date, notes } = donationUpdateInput;

    const [donation] = await donationModule.getDonations(query, {
        donationIds: [id],
    });

    if (!donation) {
        throw new NotFoundError('Donation does not exist');
    }

    if (Object.keys(donationUpdateInput).length <= 1) {
        throw new UserInputError('Nothing to update');
    }

    donationModule._validateDonationProperties(donationUpdateInput);

    const setClause = buildSetClause([
        { key: 'modified_by', condition: true },
        { key: 'amount', condition: amount !== undefined },
        { key: 'date', condition: date !== undefined },
        { key: 'notes', condition: notes !== undefined },
    ]);

    const sql = sqlFormat(`
        UPDATE donation
        SET
        ${setClause}
        WHERE ID = ?;
    `);

    const values = [
        clientId,
        ...(amount !== undefined ? [amount] : []),
        ...(date !== undefined ? [date] : []),
        ...(notes !== undefined ? [notes] : []),
        id,
    ];

    const rows = await query<DBUpdateResponse>({
        sql,
        values,
    });

    if (!rows || rows.affectedRows === 0) {
        throw new DatabaseError('Could not update donation');
    }

    await logRecordChange(RecordTable.DONATION, id, clientId);
};

const archiveDonation = async (
    query: MySqlDataSource['query'],
    logRecordChange: NarthexCrmDbDataSource['logRecordChange'],
    donationId: number,
    clientId: number
): Promise<void> => {
    await householdModule.clearHouseholdHead(query, donationId);

    const sql = sqlFormat(`
        UPDATE donation
        SET
            archived = 1
        WHERE ID = ?;
    `);

    const rows = await query<DBUpdateResponse>({
        sql,
        values: [donationId],
    });

    if (!rows || rows.affectedRows === 0) {
        throw new DatabaseError('Could not archive donation');
    }

    await logRecordChange(RecordTable.DONATION, donationId, clientId);
};

export { getDonations, addDonation, updateDonation, archiveDonation };
