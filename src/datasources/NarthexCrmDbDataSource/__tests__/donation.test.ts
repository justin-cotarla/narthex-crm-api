import { UserInputError } from 'apollo-server';
import { mocked, SpyInstance, spyOn } from 'jest-mock';
import { format as sqlFormat } from 'sql-formatter';

import { mockDBDonation } from '../../../__mocks__/database';
import {
    mockHousehold,
    mockDonation,
    mockDonationCampaign,
} from '../../../__mocks__/schema';
import {
    DBDonation,
    DBUpdateResponse,
    RecordTable,
} from '../../../types/database';
import {
    Donation,
    DonationAddInput,
    DonationSortKey,
    SortOrder,
} from '../../../types/generated/graphql';
import { DatabaseError, NotFoundError } from '../../../util/error';
import {
    validateCurrency,
    validateDate,
    validateDateInRange,
} from '../../../util/validation';
import * as donationModule from '../donation';
import {
    addDonation,
    archiveDonation,
    getDonations,
    updateDonation,
    _validateDonationProperties,
} from '../donation';
import { getDonationCampaigns } from '../donationCampaign';
import { getHouseholds } from '../household';

const mockQuery = jest.fn();
const mockLogRecordChange = jest.fn();

jest.mock('../household');
const mockGetHouseholds = mocked(getHouseholds);

jest.mock('../donationCampaign');
const mockGetDonationCampaigns = mocked(getDonationCampaigns);

jest.mock('../../../util/validation');
const mockValidateCurrency = mocked(validateCurrency).mockImplementation(
    () => true
);
const mockValidateDate = mocked(validateDate).mockImplementation(() => true);
const mockValidateDateInRange = mocked(validateDateInRange).mockImplementation(
    () => true
);

beforeEach(() => {
    mockQuery.mockClear();
    mockLogRecordChange.mockClear();
    mockGetHouseholds.mockClear();
    mockValidateCurrency.mockClear();
    mockValidateDate.mockClear();
    mockValidateDateInRange.mockClear();
});

describe('donation', () => {
    describe('getDonations', () => {
        it('gets donations with default arguments', async () => {
            mockQuery.mockImplementation((): DBDonation[] => [mockDBDonation]);

            await getDonations(mockQuery);

            expect(mockQuery).toBeCalledWith({
                sql: sqlFormat(`
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
                    WHERE
                        archived <> 1
                `),
                values: [],
            });
        });

        it('gets donations with all arguments', async () => {
            mockQuery.mockImplementation((): DBDonation[] => [mockDBDonation]);

            await getDonations(mockQuery, {
                archived: true,
                householdIds: [1],
                sortKey: DonationSortKey.Id,
                paginationOptions: {
                    limit: 1,
                    offset: 1,
                    sortOrder: SortOrder.Desc,
                },
                donationIds: [2],
            });

            expect(mockQuery).toBeCalledWith({
                sql: sqlFormat(`
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
                    WHERE
                        id in (?)
                        and household_id in (?)
                    order by
                        ID DESC
                    limit
                        1 offset 1
                `),
                values: [[2], [1]],
            });
        });

        it('returns an empty array if query returns nothing', async () => {
            mockQuery.mockImplementation(() => undefined);

            const result = await getDonations(mockQuery, { donationIds: [4] });

            expect(result).toEqual([]);
        });
    });
    describe('addDonation', () => {
        it('adds a minimal donation', async () => {
            mockQuery.mockImplementation(() => ({
                insertId: 1,
            }));

            mockGetHouseholds.mockImplementation(async () => [mockHousehold]);

            const result = await addDonation(
                mockQuery,
                {
                    date: '1995-01-01',
                    amount: '123.00',
                    householdId: 1,
                },
                1
            );

            expect(mockGetHouseholds).toBeCalled();
            expect(result).toBe(1);
            expect(mockQuery).toBeCalledWith({
                sql: sqlFormat(`
                    INSERT INTO
                        donation (
                            date,
                            amount,
                            household_id,
                            created_by,
                            modified_by
                        )
                    VALUES
                        (?, ?, ?, ?, ?)
                `),
                values: ['1995-01-01', '123.00', 1, 1, 1],
            });
        });

        it('adds a full donation', async () => {
            mockQuery.mockImplementation(() => ({
                insertId: 1,
            }));

            mockGetHouseholds.mockImplementation(async () => [mockHousehold]);

            const result = await addDonation(
                mockQuery,
                {
                    date: '1995-01-01',
                    amount: '123.00',
                    householdId: 1,
                    notes: 'Stewardship 2022',
                },
                1
            );

            expect(mockGetHouseholds).toBeCalled();
            expect(result).toBe(1);
            expect(mockQuery).toBeCalledWith({
                sql: sqlFormat(`
                    INSERT INTO
                        donation (
                            date,
                            amount,
                            household_id,
                            created_by,
                            modified_by,
                            notes
                        )
                    VALUES
                        (?, ?, ?, ?, ?, ?)
                `),
                values: ['1995-01-01', '123.00', 1, 1, 1, 'Stewardship 2022'],
            });
        });

        it('throws an error if the household does not exist', async () => {
            mockQuery.mockImplementation(() => ({
                insertId: 1,
            }));

            mockGetHouseholds.mockImplementation(async () => []);

            await expect(
                addDonation(
                    mockQuery,
                    {
                        date: '1995-01-01',
                        amount: '123.00',
                        householdId: 20,
                    },
                    1
                )
            ).rejects.toThrowError(UserInputError);

            expect(mockQuery).toBeCalledTimes(0);
        });

        it('throws an error if the database fails to insert row', async () => {
            mockQuery.mockImplementation(() => undefined);
            mockGetHouseholds.mockImplementation(async () => [mockHousehold]);

            await expect(
                addDonation(
                    mockQuery,
                    {
                        date: '1995-01-01',
                        amount: '123.00',
                        householdId: 1,
                    },
                    1
                )
            ).rejects.toThrowError(DatabaseError);

            expect(mockQuery).toBeCalled();
        });
    });

    describe('updateDonation', () => {
        let spyGetDonations: SpyInstance<unknown, unknown[]>;

        beforeEach(() => {
            spyGetDonations = spyOn(donationModule, 'getDonations');
        });

        afterEach(() => {
            spyGetDonations.mockRestore();
        });
        it('updates a donation', async () => {
            spyGetDonations.mockImplementation((): Donation[] => [
                { ...mockDonation, household: { id: 1 } },
            ]);
            mockGetHouseholds.mockImplementation(async () => [mockHousehold]);
            mockGetDonationCampaigns.mockImplementation(async () => [
                mockDonationCampaign,
            ]);

            mockQuery.mockImplementation(
                (): DBUpdateResponse => ({
                    affectedRows: 1,
                    changedRows: 1,
                })
            );

            await updateDonation(
                mockQuery,
                mockLogRecordChange,
                {
                    id: 1,
                    date: '2021-03-04',
                    amount: '123.00',
                    notes: 'For Elena',
                },
                2
            );

            expect(spyGetDonations).toHaveBeenCalled();

            expect(mockQuery).toHaveBeenCalledWith({
                sql: sqlFormat(`
                    UPDATE
                        donation
                    SET
                        modified_by = ?,
                        amount = ?,
                        date = ?,
                        notes = ?
                    WHERE
                        ID = ?;
                `),
                values: [2, '123.00', '2021-03-04', 'For Elena', 1],
            });
            expect(mockLogRecordChange).toHaveBeenCalledWith(
                RecordTable.DONATION,
                1,
                2
            );
        });

        it('throws an error if the donation does not exists', async () => {
            spyGetDonations.mockImplementationOnce((): DBDonation[] => []);

            await expect(
                updateDonation(
                    mockQuery,
                    mockLogRecordChange,
                    {
                        id: 10,
                        date: '1995-01-01',
                        amount: '123.00',
                        notes: 'Stewardship 2022',
                    },
                    2
                )
            ).rejects.toThrowError(NotFoundError);

            expect(mockQuery).toHaveBeenCalledTimes(0);
        });

        it('throws an error if no changes are provided', async () => {
            spyGetDonations.mockImplementationOnce(() => [mockDonation]);

            await expect(
                updateDonation(
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

        it('throws an error if the donation was not updated on the database', async () => {
            spyGetDonations.mockImplementation(() => [mockDonation]);
            mockQuery.mockImplementation(
                (): DBUpdateResponse => ({
                    affectedRows: 0,
                    changedRows: 0,
                })
            );

            await expect(
                updateDonation(
                    mockQuery,
                    mockLogRecordChange,
                    {
                        id: 1,
                        date: '1995-01-01',
                        amount: '123.00',
                        notes: 'Stewardship 2022',
                    },
                    2
                )
            ).rejects.toThrowError(DatabaseError);
        });
    });

    describe('archiveDonation', () => {
        it('archives a donation', async () => {
            mockQuery.mockImplementation(
                (): DBUpdateResponse => ({
                    affectedRows: 1,
                    changedRows: 1,
                })
            );

            await archiveDonation(mockQuery, mockLogRecordChange, 1, 2);

            expect(mockQuery).toHaveBeenNthCalledWith(1, {
                sql: sqlFormat(`
                    UPDATE donation
                    SET
                        archived = 1
                    WHERE ID = ?;
                `),
                values: [1],
            });
            expect(mockLogRecordChange).toHaveBeenCalledWith(
                RecordTable.DONATION,
                1,
                2
            );
        });

        it('throws an error if the donation was not archived on the database', async () => {
            mockQuery.mockImplementation(
                (): DBUpdateResponse => ({
                    affectedRows: 0,
                    changedRows: 0,
                })
            );

            await expect(
                archiveDonation(mockQuery, mockLogRecordChange, 1, 2)
            ).rejects.toThrowError(DatabaseError);
        });
    });

    describe('_validateDonationProperties', () => {
        it('validates all donation properties', () => {
            _validateDonationProperties({
                date: '1995-01-01',
                amount: '123.00',
                notes: 'Stewardship 2022',
            } as DonationAddInput);

            expect(mockValidateCurrency).toHaveBeenCalled();
            expect(mockValidateDate).toHaveBeenCalled();
        });
    });
});
