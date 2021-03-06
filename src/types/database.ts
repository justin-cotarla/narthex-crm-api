import { Gender, MilestoneType } from './generated/graphql';

const WHERE_OPERATIONS = {
    AND: ' and ',
    OR: ' or ',
} as const;

type WhereOperation = typeof WHERE_OPERATIONS[keyof typeof WHERE_OPERATIONS];

enum MySqlErrorCode {
    'DUPLICATE_ENTRY' = 1062,
}

enum RecordTable {
    MINISTRY = 'ministry',
    PERSON = 'person',
    HOUSEHOLD = 'household',
    DONATION = 'donation',
    DONATION_CAMPAIGN = 'donation_campaign',
    MILESTONE = 'milestone',
    EVENT = 'event',
}

interface DBRecord {
    created_by?: number;
    creation_timestamp?: Date;
    modified_by?: number;
    modification_timestamp?: Date;
    archived?: number;
}

interface DBClient {
    id: number;
    email_address?: string;
    creation_timestamp?: Date;
    permission_scope?: 'admin';
    last_login_timestamp?: Date;
    active?: number;
    pass_hash?: string;
}

interface DBMinistry extends DBRecord {
    id: number;
    name?: string;
    color?: number;
}

interface DBHousehold extends DBRecord {
    id: number;
    head_id?: number;
    name: string;
    address_line_1: string;
    address_line_2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
}

interface DBPerson extends DBRecord {
    id: number;
    household_id: number;
    first_name: string;
    last_name: string;
    gender: Gender;
    primary_phone_number?: string;
    email_address?: string;
    birth_date: string;
    title?: string;
}

interface DBMinistryDelegation extends DBRecord {
    ministry_id: number;
    person_id: number;
}

interface DBDonation extends DBRecord {
    id: number;
    household_id: number;
    donation_campaign_id?: number;
    date: string;
    amount: string;
    notes?: string;
}

interface DBDonationCampaign extends DBRecord {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    notes?: string;
}

interface DBMilestone extends DBRecord {
    id: number;
    person_id: number;
    date: string;
    type: MilestoneType;
    notes?: string;
}

interface DBEvent extends DBRecord {
    id: number;
    name: string;
    datetime: string;
    location: string;
}

interface DBEventAttendance extends DBRecord {
    date_registered: string;
    attended: number;
    event_id: number;
    person_id: number;
}

interface DBInsertResponse {
    insertId: number;
}

interface DBUpdateResponse {
    changedRows: number;
    affectedRows: number;
}

export { WHERE_OPERATIONS, MySqlErrorCode, RecordTable };

export type {
    WhereOperation,
    DBUpdateResponse,
    DBInsertResponse,
    DBRecord,
    DBClient,
    DBMinistry,
    DBHousehold,
    DBPerson,
    DBMinistryDelegation,
    DBDonation,
    DBDonationCampaign,
    DBMilestone,
    DBEvent,
    DBEventAttendance,
};
