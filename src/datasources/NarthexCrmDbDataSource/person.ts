import { UserInputError } from 'apollo-server';
import { format as sqlFormat } from 'sql-formatter';

import {
    DBPerson,
    DBInsertResponse,
    DBUpdateResponse,
    RecordTable,
} from '../../types/database';
import {
    PaginationOptions,
    Person,
    PersonAddInput,
    PersonSortKey,
    PersonUpdateInput,
} from '../../types/generated/graphql';
import { DatabaseError, NotFoundError } from '../../util/error';
import { mapPerson } from '../../util/mappers';
import {
    buildWhereClause,
    buildSetClause,
    buildInsertClause,
    buildPaginationClause,
} from '../../util/query';
import {
    validateBirthDate,
    validateEmail,
    validateRecordName,
} from '../../util/validation';
import { MySqlDataSource } from '../MySqlDataSource';

import { NarthexCrmDbDataSource } from './';

const validatePersonProperties = (
    personInput: PersonAddInput | PersonUpdateInput
) => {
    const { firstName, lastName, birthDate, emailAddress } = personInput;

    if (firstName && !validateRecordName(firstName)) {
        throw new UserInputError('Invalid first name');
    }
    if (lastName && !validateRecordName(lastName)) {
        throw new UserInputError('Invalid last name');
    }
    if (birthDate && !validateBirthDate(birthDate)) {
        throw new UserInputError(
            "Invalid birthdate, expected format: 'YYYY-MM-DD'"
        );
    }
    if (emailAddress && !validateEmail(emailAddress)) {
        throw new UserInputError('Invalid email address');
    }
};

const getPeople = async (
    query: MySqlDataSource['query'],
    personIds: number[],
    options?: {
        sortKey: PersonSortKey;
        paginationOptions: PaginationOptions;
        archived?: boolean | null;
    }
): Promise<Person[]> => {
    const { paginationOptions, sortKey, archived } = options ?? {};

    const whereClause = buildWhereClause([
        { clause: 'id in (?)', condition: personIds?.length !== 0 },
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
            first_name,
            last_name,
            gender,
            primary_phone_number,
            email_address,
            birth_date,
            title,
            created_by,
            creation_timestamp,
            modified_by,
            modification_timestamp,
            archived
        FROM
        person
        ${whereClause}
        ${paginationClause}
    `);

    const values = [...(personIds.length !== 0 ? [personIds] : [])];

    const rows = await query<DBPerson[]>({
        sql,
        values,
    });

    return rows?.map(mapPerson) ?? [];
};

const addPerson = async (
    query: MySqlDataSource['query'],
    personAddInput: PersonAddInput,
    clientId: number
): Promise<number> => {
    const {
        firstName,
        lastName,
        birthDate,
        gender,
        emailAddress,
        phoneNumber,
        title,
    } = personAddInput;

    validatePersonProperties(personAddInput);

    const insertClause = buildInsertClause([
        { key: 'first_name', condition: true },
        { key: 'last_name', condition: true },
        { key: 'gender', condition: true },
        { key: 'birth_date', condition: true },
        { key: 'created_by', condition: true },
        { key: 'modified_by', condition: true },
        { key: 'primary_phone_number', condition: phoneNumber !== undefined },
        { key: 'email_address', condition: emailAddress !== undefined },
        { key: 'title', condition: title !== undefined },
    ]);

    const sql = sqlFormat(`
        INSERT INTO person
            ${insertClause.insert}
        VALUES
            ${insertClause.values}
    `);

    const rows = await query<DBInsertResponse>({
        sql,
        values: [
            firstName,
            lastName,
            gender.toString(),
            birthDate,
            clientId,
            clientId,
            ...(phoneNumber !== undefined ? [phoneNumber] : []),
            ...(emailAddress !== undefined ? [emailAddress] : []),
            ...(title !== undefined ? [title] : []),
        ],
    });

    if (!rows) {
        throw new Error('Could not add person');
    }

    return rows.insertId;
};

const updatePerson = async (
    query: MySqlDataSource['query'],
    logRecordChange: NarthexCrmDbDataSource['logRecordChange'],
    personUpdateInput: PersonUpdateInput,
    clientId: number
): Promise<void> => {
    const {
        id,
        firstName,
        lastName,
        birthDate,
        gender,
        emailAddress,
        phoneNumber,
        title,
    } = personUpdateInput;

    const [person] = await getPeople(query, [id]);

    if (!person) {
        throw new NotFoundError('Person does not exist');
    }

    if (Object.keys(personUpdateInput).length <= 1) {
        throw new UserInputError('Nothing to update');
    }

    validatePersonProperties(personUpdateInput);

    const setClause = buildSetClause([
        { key: 'modified_by', condition: true },
        { key: 'first_name', condition: firstName !== undefined },
        { key: 'last_name', condition: lastName !== undefined },
        { key: 'gender', condition: gender !== undefined },
        { key: 'birth_date', condition: birthDate !== undefined },
        { key: 'primary_phone_number', condition: phoneNumber !== undefined },
        { key: 'email_address', condition: emailAddress !== undefined },
        { key: 'title', condition: title !== undefined },
    ]);

    const sql = sqlFormat(`
        UPDATE person
        SET
        ${setClause}
        WHERE ID = ?;
    `);

    const values = [
        clientId,
        ...(firstName !== undefined ? [firstName] : []),
        ...(lastName !== undefined ? [lastName] : []),
        ...(gender !== undefined ? [gender] : []),
        ...(birthDate !== undefined ? [birthDate] : []),
        ...(phoneNumber !== undefined ? [phoneNumber] : []),
        ...(emailAddress !== undefined ? [emailAddress] : []),
        ...(title !== undefined ? [title] : []),
        id,
    ];

    const rows = await query<DBUpdateResponse>({
        sql,
        values,
    });

    if (!rows || rows.affectedRows === 0) {
        throw new DatabaseError('Could not update person');
    }

    await logRecordChange(RecordTable.PERSON, id, clientId);
};

const archivePerson = async (
    query: MySqlDataSource['query'],
    logRecordChange: NarthexCrmDbDataSource['logRecordChange'],
    personId: number,
    clientId: number
): Promise<void> => {
    const sql = sqlFormat(`
        UPDATE person
        SET
            archived = 1
        WHERE ID = ?;
    `);

    const rows = await query<DBUpdateResponse>({
        sql,
        values: [personId],
    });

    if (!rows || rows.affectedRows === 0) {
        throw new DatabaseError('Could not archive person');
    }

    await logRecordChange(RecordTable.PERSON, personId, clientId);
};

export { getPeople, addPerson, updatePerson, archivePerson };
