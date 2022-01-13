import { UserInputError } from 'apollo-server';
import { format as sqlFormat } from 'sql-formatter';

import {
    DBDonationCampaign,
    DBInsertResponse,
    DBUpdateResponse,
    RecordTable,
} from '../../types/database';
import {
    PaginationOptions,
    DonationCampaign,
    DonationCampaignAddInput,
    DonationCampaignSortKey,
    DonationCampaignUpdateInput,
} from '../../types/generated/graphql';
import { DatabaseError, NotFoundError } from '../../util/error';
import { mapDonationCampaign } from '../../util/mappers';
import {
    buildWhereClause,
    buildSetClause,
    buildInsertClause,
    buildPaginationClause,
} from '../../util/query';
import {
    validateDate,
    validateDateRange,
    validateRecordName,
} from '../../util/validation';
import { MySqlDataSource } from '../MySqlDataSource';

import * as donationModule from './donation';
import * as donationCampaignModule from './donationCampaign';

import { NarthexCrmDbDataSource } from '.';

export const _validateDonationCampaignProperties = (
    donationCampaignInput:
        | DonationCampaignAddInput
        | DonationCampaignUpdateInput
) => {
    const { name, dateRange } = donationCampaignInput;

    if (name === null || dateRange === null) {
        throw new UserInputError('Mandatory input cannot be null');
    }

    if (
        dateRange &&
        !validateDateRange(dateRange.startDate, dateRange.endDate)
    ) {
        throw new UserInputError('Invalid date range');
    }

    if (name && !validateRecordName(name)) {
        throw new UserInputError('Invalid donation campaign name');
    }
};

const getDonationCampaigns = async (
    query: MySqlDataSource['query'],
    options: {
        donationCampaignIds?: number[];
        beforeDate?: string | null;
        afterDate?: string | null;
        sortKey?: DonationCampaignSortKey;
        paginationOptions?: PaginationOptions;
        archived?: boolean | null;
    } = {}
): Promise<DonationCampaign[]> => {
    const {
        donationCampaignIds = [],
        paginationOptions,
        sortKey,
        archived = false,
        beforeDate = null,
        afterDate = null,
    } = options;

    if (beforeDate && !validateDate(beforeDate)) {
        throw new UserInputError(
            "Invalid before date, expected format: 'YYYY-MM-DD'"
        );
    }
    if (afterDate && !validateDate(afterDate)) {
        throw new UserInputError(
            "Invalid after date, expected format: 'YYYY-MM-DD'"
        );
    }

    const whereClause = buildWhereClause([
        { clause: 'id in (?)', condition: donationCampaignIds.length !== 0 },
        { clause: 'end_date <= ?', condition: beforeDate !== null },
        { clause: 'after_date >= ?', condition: afterDate !== null },
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
            name,
            start_date,
            end_date,
            notes,
            created_by,
            creation_timestamp,
            modified_by,
            modification_timestamp,
            archived
        FROM
        donation_campaign
        ${whereClause}
        ${paginationClause}
    `);

    const values = [
        ...(donationCampaignIds.length !== 0 ? [donationCampaignIds] : []),
        ...(beforeDate ? [beforeDate] : []),
        ...(afterDate ? [afterDate] : []),
    ];

    const rows = await query<DBDonationCampaign[]>({
        sql,
        values,
    });

    return rows?.map(mapDonationCampaign) ?? [];
};

const addDonationCampaign = async (
    query: MySqlDataSource['query'],
    donationCampaignAddInput: DonationCampaignAddInput,
    clientId: number
): Promise<number> => {
    const {
        name,
        dateRange: { startDate, endDate },
        notes,
    } = donationCampaignAddInput;

    donationCampaignModule._validateDonationCampaignProperties(
        donationCampaignAddInput
    );

    const insertClause = buildInsertClause([
        { key: 'name', condition: true },
        { key: 'start_date', condition: true },
        { key: 'end_date', condition: true },
        { key: 'created_by', condition: true },
        { key: 'modified_by', condition: true },
        { key: 'notes', condition: notes !== undefined },
    ]);

    const sql = sqlFormat(`
        INSERT INTO donation_campaign
            ${insertClause.insert}
        VALUES
            ${insertClause.values}
    `);

    const rows = await query<DBInsertResponse>({
        sql,
        values: [
            name,
            startDate,
            endDate,
            clientId,
            clientId,
            ...(notes !== undefined ? [notes] : []),
        ],
    });

    if (!rows) {
        throw new DatabaseError('Could not add donation campaign');
    }

    return rows.insertId;
};

const updateDonationCampaign = async (
    query: MySqlDataSource['query'],
    logRecordChange: NarthexCrmDbDataSource['logRecordChange'],
    donationCampaignUpdateInput: DonationCampaignUpdateInput,
    clientId: number
): Promise<void> => {
    const { id, name, dateRange, notes } = donationCampaignUpdateInput;

    const [donationCampaign] =
        await donationCampaignModule.getDonationCampaigns(query, {
            donationCampaignIds: [id],
        });

    if (!donationCampaign) {
        throw new NotFoundError('DonationCampaign does not exist');
    }

    if (dateRange) {
        const donationCount = (
            await donationModule.getDonations(query, {
                donationCampaignIds: [id],
                afterDate: donationCampaign.startDate!,
                beforeDate: donationCampaign.endDate!,
            })
        ).length;

        const updatedRangeDonationCount = (
            await donationModule.getDonations(query, {
                donationCampaignIds: [id],
                afterDate: dateRange.startDate,
                beforeDate: dateRange.endDate,
            })
        ).length;

        if (donationCount !== updatedRangeDonationCount) {
            throw new UserInputError(
                'New range does not cover existing donations'
            );
        }
    }

    if (Object.keys(donationCampaignUpdateInput).length <= 1) {
        throw new UserInputError('Nothing to update');
    }

    donationCampaignModule._validateDonationCampaignProperties(
        donationCampaignUpdateInput
    );

    const setClause = buildSetClause([
        { key: 'modified_by', condition: true },
        { key: 'name', condition: name !== undefined },
        { key: 'start_date', condition: !(dateRange == undefined) },
        { key: 'end_date', condition: !(dateRange == undefined) },
        { key: 'notes', condition: notes !== undefined },
    ]);

    const sql = sqlFormat(`
        UPDATE donation_campaign
        SET
        ${setClause}
        WHERE ID = ?;
    `);

    const values = [
        clientId,
        ...(name !== undefined ? [name] : []),
        ...(dateRange ? [dateRange.startDate] : []),
        ...(dateRange ? [dateRange.endDate] : []),
        ...(notes !== undefined ? [notes] : []),
        id,
    ];

    const rows = await query<DBUpdateResponse>({
        sql,
        values,
    });

    if (!rows || rows.affectedRows === 0) {
        throw new DatabaseError('Could not update donation campaign');
    }

    await logRecordChange(RecordTable.DONATION_CAMPAIGN, id, clientId);
};

const archiveDonationCampaign = async (
    query: MySqlDataSource['query'],
    logRecordChange: NarthexCrmDbDataSource['logRecordChange'],
    donationCampaignId: number,
    clientId: number
): Promise<void> => {
    const sql = sqlFormat(`
        UPDATE donation_campaign
        SET
            archived = 1
        WHERE ID = ?;
    `);

    const rows = await query<DBUpdateResponse>({
        sql,
        values: [donationCampaignId],
    });

    if (!rows || rows.affectedRows === 0) {
        throw new DatabaseError('Could not archive donation campaign');
    }

    await logRecordChange(
        RecordTable.DONATION_CAMPAIGN,
        donationCampaignId,
        clientId
    );
};

export {
    getDonationCampaigns,
    addDonationCampaign,
    updateDonationCampaign,
    archiveDonationCampaign,
};
