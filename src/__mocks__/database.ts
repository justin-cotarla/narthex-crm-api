import { DBHousehold, DBPerson } from '../types/database';
import { Gender } from '../types/generated/graphql';

const mockDBHousehold: DBHousehold = {
    id: 1,
    address_line_1: '123 rue Guy',
    address_line_2: 'Apt 123',
    city: 'Anjou',
    name: 'Smith Family',
    state: 'Quebec',
    postal_code: 'H0H 0H0',
    country: 'CA',
    created_by: 1,
    creation_timestamp: new Date('2021/12/19'),
    modified_by: 1,
    modification_timestamp: new Date('2021/12/19'),
    archived: 0,
};

const mockDBPerson: DBPerson = {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    gender: Gender.Male,
    household_id: 1,
    primary_phone_number: '(514) 123-4567',
    title: 'Mr',
    birth_date: '1995-01-01',
    email_address: 'email@test.com',
    created_by: 1,
    creation_timestamp: new Date('2021/12/19'),
    modified_by: 1,
    modification_timestamp: new Date('2021/12/19'),
    archived: 0,
};

export { mockDBHousehold, mockDBPerson };
