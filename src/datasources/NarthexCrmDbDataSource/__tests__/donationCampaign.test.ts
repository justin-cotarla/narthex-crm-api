import { UserInputError } from 'apollo-server';
import { mocked, SpyInstance, spyOn } from 'jest-mock';
import { format as sqlFormat } from 'sql-formatter';

import { mockDBDonationCampaign } from '../../../__mocks__/database';
import { mockDonation, mockDonationCampaign } from '../../../__mocks__/schema';
import {
    DBDonationCampaign,
    DBUpdateResponse,
    RecordTable,
} from '../../../types/database';
import {
    DonationCampaign,
    DonationCampaignAddInput,
    DonationCampaignSortKey,
    SortOrder,
} from '../../../types/generated/graphql';
import { DatabaseError, NotFoundError } from '../../../util/error';
import {
    validateDateRange,
    validateRecordName,
    validateDate,
} from '../../../util/validation';
import { getDonations } from '../donation';
import * as donationCampaignModule from '../donationCampaign';
import {
    addDonationCampaign,
    archiveDonationCampaign,
    getDonationCampaigns,
    updateDonationCampaign,
    _validateDonationCampaignProperties,
} from '../donationCampaign';

const mockQuery = jest.fn();
const mockLogRecordChange = jest.fn();

jest.mock('../donation');
const mockGetDonations = mocked(getDonations);

jest.mock('../../../util/validation');
const mockValidateDateRange = mocked(validateDateRange).mockImplementation(
    () => true
);
const mockValidateRecordName = mocked(validateRecordName).mockImplementation(
    () => true
);
const mockValidateDate = mocked(validateDate).mockImplementation(() => true);

beforeEach(() => {
    mockQuery.mockClear();
    mockLogRecordChange.mockClear();
    mockValidateDateRange.mockClear();
    mockValidateRecordName.mockClear();
    mockValidateDate.mockClear();
    mockGetDonations.mockClear();
});

describe('donationCampaign', () => {
    describe('getDonationCampaigns', () => {
        it('gets donation campaigns with default arguments', async () => {
            mockQuery.mockImplementation((): DBDonationCampaign[] => [
                mockDBDonationCampaign,
            ]);

            await getDonationCampaigns(mockQuery);

            expect(mockQuery).toBeCalledWith({
                sql: sqlFormat(`
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
                    WHERE
                        archived <> 1
                `),
                values: [],
            });
        });

        it('gets donation campaigns with all arguments', async () => {
            mockQuery.mockImplementation((): DBDonationCampaign[] => [
                mockDBDonationCampaign,
            ]);

            await getDonationCampaigns(mockQuery, {
                archived: true,
                sortKey: DonationCampaignSortKey.Id,
                paginationOptions: {
                    limit: 1,
                    offset: 1,
                    sortOrder: SortOrder.Desc,
                },
                donationCampaignIds: [2],
                afterDate: '2021-01-01',
                beforeDate: '2021-12-31',
            });

            expect(mockQuery).toBeCalledWith({
                sql: sqlFormat(`
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
                    WHERE
                        id in (?)
                        and end_date <= ?
                        and after_date >= ?
                    order by
                        ID DESC
                    limit
                        1 offset 1
                `),
                values: [[2], '2021-12-31', '2021-01-01'],
            });
        });

        it('throws an error if an invalid date is provided for beforeDate', async () => {
            mockValidateDate.mockImplementationOnce(() => false);

            await expect(
                getDonationCampaigns(mockQuery, {
                    beforeDate: '2021-01-01',
                })
            ).rejects.toThrowError(UserInputError);

            expect(mockQuery).toHaveBeenCalledTimes(0);
        });

        it('throws an error if an invalid date is provided for afterDate', async () => {
            mockValidateDate.mockImplementationOnce(() => false);

            await expect(
                getDonationCampaigns(mockQuery, {
                    afterDate: '2021-01-01',
                })
            ).rejects.toThrowError(UserInputError);

            expect(mockQuery).toHaveBeenCalledTimes(0);
        });

        it('returns an empty array if query returns nothing', async () => {
            mockQuery.mockImplementation(() => undefined);

            const result = await getDonationCampaigns(mockQuery, {
                donationCampaignIds: [4],
            });

            expect(result).toEqual([]);
        });
    });
    describe('addDonationCampaign', () => {
        it('adds a minimal donation campaign', async () => {
            mockQuery.mockImplementation(() => ({
                insertId: 1,
            }));

            const result = await addDonationCampaign(
                mockQuery,
                {
                    dateRange: {
                        startDate: '2021-01-01',
                        endDate: '2021-12-31',
                    },
                    name: 'Stewardship 2021',
                },
                1
            );

            expect(result).toBe(1);
            expect(mockQuery).toBeCalledWith({
                sql: sqlFormat(`
                    INSERT INTO
                        donation_campaign (
                            name,
                            start_date,
                            end_date,
                            created_by,
                            modified_by
                        )
                    VALUES
                        (?, ?, ?, ?, ?)
                `),
                values: ['Stewardship 2021', '2021-01-01', '2021-12-31', 1, 1],
            });
        });

        it('adds a full donation campaign', async () => {
            mockQuery.mockImplementation(() => ({
                insertId: 1,
            }));

            const result = await addDonationCampaign(
                mockQuery,
                {
                    dateRange: {
                        startDate: '2021-01-01',
                        endDate: '2021-12-31',
                    },
                    name: 'Stewardship 2021',
                    notes: 'Pretty bad year',
                },
                1
            );

            expect(result).toBe(1);
            expect(mockQuery).toBeCalledWith({
                sql: sqlFormat(`
                    INSERT INTO
                        donation_campaign (
                            name,
                            start_date,
                            end_date,
                            created_by,
                            modified_by,
                            notes
                        )
                    VALUES
                        (?, ?, ?, ?, ?, ?)
                `),
                values: [
                    'Stewardship 2021',
                    '2021-01-01',
                    '2021-12-31',
                    1,
                    1,
                    'Pretty bad year',
                ],
            });
        });

        it('throws an error if the database fails to insert row', async () => {
            mockQuery.mockImplementation(() => undefined);

            await expect(
                addDonationCampaign(
                    mockQuery,
                    {
                        dateRange: {
                            startDate: '2021-01-01',
                            endDate: '2021-12-31',
                        },
                        name: 'Stewardship 2021',
                    },
                    1
                )
            ).rejects.toThrowError(DatabaseError);

            expect(mockQuery).toBeCalled();
        });
    });

    describe('updateDonationCampaign', () => {
        let spyGetDonationCampaigns: SpyInstance<unknown, unknown[]>;

        beforeEach(() => {
            spyGetDonationCampaigns = spyOn(
                donationCampaignModule,
                'getDonationCampaigns'
            );
        });

        afterEach(() => {
            spyGetDonationCampaigns.mockRestore();
        });
        it('updates a donation campaign', async () => {
            spyGetDonationCampaigns.mockImplementation(
                (): DonationCampaign[] => [mockDonationCampaign]
            );
            mockGetDonations.mockImplementationOnce(async () => [mockDonation]);
            mockGetDonations.mockImplementationOnce(async () => [mockDonation]);

            mockQuery.mockImplementation(
                (): DBUpdateResponse => ({
                    affectedRows: 1,
                    changedRows: 1,
                })
            );

            await updateDonationCampaign(
                mockQuery,
                mockLogRecordChange,
                {
                    id: 1,
                    dateRange: {
                        startDate: '2021-01-01',
                        endDate: '2021-12-31',
                    },
                    name: 'Stewardship 2021',
                    notes: 'Pretty bad year',
                },
                2
            );

            expect(spyGetDonationCampaigns).toHaveBeenCalled();

            expect(mockQuery).toHaveBeenCalledWith({
                sql: sqlFormat(`
                    UPDATE
                        donation_campaign
                    SET
                        modified_by = ?,
                        name = ?,
                        start_date = ?,
                        end_date = ?,
                        notes = ?
                    WHERE
                        ID = ?;
                `),
                values: [
                    2,
                    'Stewardship 2021',
                    '2021-01-01',
                    '2021-12-31',
                    'Pretty bad year',
                    1,
                ],
            });
            expect(mockLogRecordChange).toHaveBeenCalledWith(
                RecordTable.DONATION_CAMPAIGN,
                1,
                2
            );
        });

        it('throws an error if the donation campaign exludes existing donations', async () => {
            spyGetDonationCampaigns.mockImplementation(() => [
                mockDonationCampaign,
            ]);

            mockGetDonations.mockImplementationOnce(async () => [mockDonation]);
            mockGetDonations.mockImplementationOnce(async () => []);

            mockQuery.mockImplementation(
                (): DBUpdateResponse => ({
                    affectedRows: 0,
                    changedRows: 0,
                })
            );

            await expect(
                updateDonationCampaign(
                    mockQuery,
                    mockLogRecordChange,
                    {
                        id: 1,
                        dateRange: {
                            startDate: '2021-01-01',
                            endDate: '2021-12-31',
                        },
                        name: 'Stewardship 2021',
                        notes: 'Pretty bad year',
                    },
                    2
                )
            ).rejects.toThrowError(UserInputError);
        });

        it('throws an error if the donation campaign does not exists', async () => {
            spyGetDonationCampaigns.mockImplementationOnce(
                (): DBDonationCampaign[] => []
            );

            await expect(
                updateDonationCampaign(
                    mockQuery,
                    mockLogRecordChange,
                    {
                        id: 1,
                        dateRange: {
                            startDate: '2021-01-01',
                            endDate: '2021-12-31',
                        },
                        name: 'Stewardship 2021',
                        notes: 'Pretty bad year',
                    },
                    2
                )
            ).rejects.toThrowError(NotFoundError);

            expect(mockQuery).toHaveBeenCalledTimes(0);
        });

        it('throws an error if no changes are provided', async () => {
            spyGetDonationCampaigns.mockImplementationOnce(() => [
                mockDonationCampaign,
            ]);

            await expect(
                updateDonationCampaign(
                    mockQuery,
                    mockLogRecordChange,
                    {
                        id: 1,
                    },
                    2
                )
            ).rejects.toThrowError(UserInputError);

            expect(mockQuery).toHaveBeenCalledTimes(0);
        });

        it('throws an error if the donation campaign was not updated on the database', async () => {
            spyGetDonationCampaigns.mockImplementation(() => [
                mockDonationCampaign,
            ]);

            mockGetDonations.mockImplementationOnce(async () => [mockDonation]);
            mockGetDonations.mockImplementationOnce(async () => [mockDonation]);

            mockQuery.mockImplementation(
                (): DBUpdateResponse => ({
                    affectedRows: 0,
                    changedRows: 0,
                })
            );

            await expect(
                updateDonationCampaign(
                    mockQuery,
                    mockLogRecordChange,
                    {
                        id: 1,
                        dateRange: {
                            startDate: '2021-01-01',
                            endDate: '2021-12-31',
                        },
                        name: 'Stewardship 2021',
                        notes: 'Pretty bad year',
                    },
                    2
                )
            ).rejects.toThrowError(DatabaseError);
        });
    });

    describe('archiveDonationCampaign', () => {
        it('archives a donation campaign', async () => {
            mockQuery.mockImplementation(
                (): DBUpdateResponse => ({
                    affectedRows: 1,
                    changedRows: 1,
                })
            );

            await archiveDonationCampaign(mockQuery, mockLogRecordChange, 1, 2);

            expect(mockQuery).toHaveBeenNthCalledWith(1, {
                sql: sqlFormat(`
                    UPDATE donation_campaign
                    SET
                        archived = 1
                    WHERE ID = ?;
                `),
                values: [1],
            });
            expect(mockLogRecordChange).toHaveBeenCalledWith(
                RecordTable.DONATION_CAMPAIGN,
                1,
                2
            );
        });

        it('throws an error if the donationCampaign was not archived on the database', async () => {
            mockQuery.mockImplementation(
                (): DBUpdateResponse => ({
                    affectedRows: 0,
                    changedRows: 0,
                })
            );

            await expect(
                archiveDonationCampaign(mockQuery, mockLogRecordChange, 1, 2)
            ).rejects.toThrowError(DatabaseError);
        });
    });

    describe('_validateDonationCampaignProperties', () => {
        it('validates all donationCampaign properties', () => {
            _validateDonationCampaignProperties({
                dateRange: {
                    startDate: '2021-01-01',
                    endDate: '2021-12-31',
                },
                name: 'Stewardship 2021',
                notes: 'Pretty bad year',
            } as DonationCampaignAddInput);

            expect(mockValidateDateRange).toHaveBeenCalled();
            expect(mockValidateRecordName).toHaveBeenCalled();
        });
    });
});
