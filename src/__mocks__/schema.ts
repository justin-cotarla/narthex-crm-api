import {
    Donation,
    Gender,
    Household,
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
    notes: 'Stewardship 2022',
};

export { mockHousehold, mockPerson, mockMinistry, mockDonation };
