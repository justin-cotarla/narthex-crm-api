import {
    Donation,
    DonationCampaign,
    Gender,
    Household,
    Milestone,
    MilestoneType,
    Ministry,
    Person,
} from '../types/generated/graphql';

const mockHousehold: Household = {
    id: 1,
    address: {
        line1: '123 rue Guy',
        line2: 'Apt 123',
        city: 'Anjou',
        state: 'Quebec',
        postalCode: 'H0H 0H0',
        country: 'CA',
    },
    name: 'Smith Family',
    head: { id: 1 },
    members: [
        {
            id: 1,
        },
    ],
    archived: false,
    createdBy: {
        id: 1,
    },
    creationTimestamp: 1639872000,
    modificationTimestamp: 1639872000,
    modifiedBy: {
        id: 1,
    },
};

const mockPerson: Person = {
    age: 25,
    archived: false,
    birthDate: '1995-01-01',
    createdBy: {
        id: 1,
    },
    creationTimestamp: 1639872000,
    emailAddress: 'email@test.com',
    firstName: 'John',
    gender: Gender.Male,
    household: {
        id: 1,
    },
    id: 1,
    lastName: 'Doe',
    modificationTimestamp: 1639872000,
    modifiedBy: {
        id: 1,
    },
    phoneNumber: '(514) 123-4567',
    title: 'Mr',
};

const mockMinistry: Ministry = {
    archived: false,
    color: '#F15025',
    createdBy: {
        id: 1,
    },
    creationTimestamp: 1639872000,
    id: 1,
    modificationTimestamp: 1639872000,
    modifiedBy: {
        id: 1,
    },
    name: 'Choir',
};

const mockDonation: Donation = {
    archived: false,
    createdBy: {
        id: 1,
    },
    creationTimestamp: 1639872000,
    id: 1,
    modificationTimestamp: 1639872000,
    modifiedBy: {
        id: 1,
    },
    amount: '123.00',
    date: '2022-01-07',
    household: {
        id: 1,
    },
    notes: 'For new icons',
    donationCampaign: {
        id: 1,
    },
};

const mockDonationCampaign: DonationCampaign = {
    startDate: '2021-01-01',
    endDate: '2021-12-31',
    name: 'Stewardship 2021',
    notes: 'Tough year',
    createdBy: {
        id: 1,
    },
    creationTimestamp: 1639872000,
    id: 1,
    modificationTimestamp: 1639872000,
    modifiedBy: {
        id: 1,
    },
    archived: false,
};

const mockMilestone: Milestone = {
    type: MilestoneType.Baptism,
    date: '2020-05-22',
    subject: {
        id: 1,
    },
    notes: 'Pandemic baptism',
    createdBy: {
        id: 1,
    },
    creationTimestamp: 1639872000,
    id: 1,
    modificationTimestamp: 1639872000,
    modifiedBy: {
        id: 1,
    },
    archived: false,
};

export {
    mockHousehold,
    mockPerson,
    mockMinistry,
    mockDonation,
    mockDonationCampaign,
    mockMilestone,
};
