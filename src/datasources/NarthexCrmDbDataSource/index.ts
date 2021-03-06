import { PoolConfig } from 'mysql';
import { format as sqlFormat } from 'sql-formatter';

import { DBUpdateResponse, RecordTable } from '../../types/database';
import { MySqlDataSource } from '../MySqlDataSource';

import { addClient, getClients, getToken, updateClient } from './client';
import {
    getDonations,
    addDonation,
    updateDonation,
    archiveDonation,
} from './donation';
import {
    getDonationCampaigns,
    addDonationCampaign,
    updateDonationCampaign,
    archiveDonationCampaign,
} from './donationCampaign';
import { getEvents, addEvent, updateEvent, archiveEvent } from './event';
import {
    deleteEventAttendance,
    getEventAttendance,
    setEventAttendance,
} from './eventAttendance';
import {
    getHouseholds,
    addHousehold,
    updateHousehold,
    archiveHousehold,
} from './household';
import {
    getMilestones,
    addMilestone,
    updateMilestone,
    archiveMilestone,
} from './milestone';
import {
    addMinistry,
    archiveMinistry,
    getMinistries,
    updateMinistry,
} from './ministry';
import {
    setMinistryDelegation,
    getMinistryDelegations,
    deleteMinistryDelegation,
} from './ministryDelegation';
import { addPerson, archivePerson, getPeople, updatePerson } from './person';

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
        getClients(this.cacheQuery.bind(this), ...args);

    getToken = (...args: Tail<Tail<Parameters<typeof getToken>>>) =>
        getToken(
            this.query.bind(this),
            this.logClientConnection.bind(this),
            ...args
        );

    getMinistries = (...args: Tail<Parameters<typeof getMinistries>>) =>
        getMinistries(this.cacheQuery.bind(this), ...args);

    updateClient = (...args: Tail<Parameters<typeof updateClient>>) =>
        updateClient(this.query.bind(this), ...args);

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

    setMinistryDelegation = (
        ...args: Tail<Parameters<typeof setMinistryDelegation>>
    ) => setMinistryDelegation(this.query.bind(this), ...args);

    getMinistryDelegations = (
        ...args: Tail<Parameters<typeof getMinistryDelegations>>
    ) => getMinistryDelegations(this.query.bind(this), ...args);

    deleteMinistryDelegation = (
        ...args: Tail<Parameters<typeof deleteMinistryDelegation>>
    ) => deleteMinistryDelegation(this.query.bind(this), ...args);

    getPeople = (...args: Tail<Parameters<typeof getPeople>>) =>
        getPeople(this.cacheQuery.bind(this), ...args);

    addPerson = (...args: Tail<Parameters<typeof addPerson>>) =>
        addPerson(this.query.bind(this), ...args);

    updatePerson = (...args: Tail<Tail<Parameters<typeof updatePerson>>>) =>
        updatePerson(
            this.query.bind(this),
            this.logRecordChange.bind(this),
            ...args
        );

    archivePerson = (...args: Tail<Tail<Parameters<typeof archivePerson>>>) =>
        archivePerson(
            this.query.bind(this),
            this.logRecordChange.bind(this),
            ...args
        );

    getHouseholds = (...args: Tail<Parameters<typeof getHouseholds>>) =>
        getHouseholds(this.cacheQuery.bind(this), ...args);

    addHousehold = (...args: Tail<Parameters<typeof addHousehold>>) =>
        addHousehold(this.query.bind(this), ...args);

    updateHousehold = (
        ...args: Tail<Tail<Parameters<typeof updateHousehold>>>
    ) =>
        updateHousehold(
            this.query.bind(this),
            this.logRecordChange.bind(this),
            ...args
        );

    archiveHousehold = (
        ...args: Tail<Tail<Parameters<typeof archiveHousehold>>>
    ) =>
        archiveHousehold(
            this.query.bind(this),
            this.logRecordChange.bind(this),
            ...args
        );

    getDonations = (...args: Tail<Parameters<typeof getDonations>>) =>
        getDonations(this.cacheQuery.bind(this), ...args);

    addDonation = (...args: Tail<Parameters<typeof addDonation>>) =>
        addDonation(this.query.bind(this), ...args);

    updateDonation = (...args: Tail<Tail<Parameters<typeof updateDonation>>>) =>
        updateDonation(
            this.query.bind(this),
            this.logRecordChange.bind(this),
            ...args
        );

    archiveDonation = (
        ...args: Tail<Tail<Parameters<typeof archiveDonation>>>
    ) =>
        archiveDonation(
            this.query.bind(this),
            this.logRecordChange.bind(this),
            ...args
        );

    getDonationCampaigns = (
        ...args: Tail<Parameters<typeof getDonationCampaigns>>
    ) => getDonationCampaigns(this.cacheQuery.bind(this), ...args);

    addDonationCampaign = (
        ...args: Tail<Parameters<typeof addDonationCampaign>>
    ) => addDonationCampaign(this.query.bind(this), ...args);

    updateDonationCampaign = (
        ...args: Tail<Tail<Parameters<typeof updateDonationCampaign>>>
    ) =>
        updateDonationCampaign(
            this.query.bind(this),
            this.logRecordChange.bind(this),
            ...args
        );

    archiveDonationCampaign = (
        ...args: Tail<Tail<Parameters<typeof archiveDonationCampaign>>>
    ) =>
        archiveDonationCampaign(
            this.query.bind(this),
            this.logRecordChange.bind(this),
            ...args
        );

    getMilestones = (...args: Tail<Parameters<typeof getMilestones>>) =>
        getMilestones(this.cacheQuery.bind(this), ...args);

    addMilestone = (...args: Tail<Parameters<typeof addMilestone>>) =>
        addMilestone(this.query.bind(this), ...args);

    updateMilestone = (
        ...args: Tail<Tail<Parameters<typeof updateMilestone>>>
    ) =>
        updateMilestone(
            this.query.bind(this),
            this.logRecordChange.bind(this),
            ...args
        );

    archiveMilestone = (
        ...args: Tail<Tail<Parameters<typeof archiveMilestone>>>
    ) =>
        archiveMilestone(
            this.query.bind(this),
            this.logRecordChange.bind(this),
            ...args
        );

    getEvents = (...args: Tail<Parameters<typeof getEvents>>) =>
        getEvents(this.cacheQuery.bind(this), ...args);

    addEvent = (...args: Tail<Parameters<typeof addEvent>>) =>
        addEvent(this.query.bind(this), ...args);

    updateEvent = (...args: Tail<Tail<Parameters<typeof updateEvent>>>) =>
        updateEvent(
            this.query.bind(this),
            this.logRecordChange.bind(this),
            ...args
        );

    archiveEvent = (...args: Tail<Tail<Parameters<typeof archiveEvent>>>) =>
        archiveEvent(
            this.query.bind(this),
            this.logRecordChange.bind(this),
            ...args
        );

    getEventAttendance = (
        ...args: Tail<Parameters<typeof getEventAttendance>>
    ) => getEventAttendance(this.cacheQuery.bind(this), ...args);

    setEventAttendance = (
        ...args: Tail<Parameters<typeof setEventAttendance>>
    ) => setEventAttendance(this.query.bind(this), ...args);

    deleteEventAttendance = (
        ...args: Tail<Parameters<typeof deleteEventAttendance>>
    ) => deleteEventAttendance(this.query.bind(this), ...args);
}

export { NarthexCrmDbDataSource };
