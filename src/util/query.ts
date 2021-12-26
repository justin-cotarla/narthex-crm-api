import { WhereOperation, WHERE_OPERATIONS } from '../types/database';

const buildSetClause = (
    conditions: { key: string; condition: boolean }[]
): string => {
    const setClauses = conditions
        .filter(({ condition }) => condition)
        .map(({ key }) => `${key} = ?`);

    return setClauses.join(',\n');
};

const buildInsertClause = (
    conditions: { key: string; condition: boolean }[]
): {
    insert: string;
    values: string;
} => {
    const setClauses = conditions
        .filter(({ condition }) => condition)
        .map(({ key }) => key);

    return {
        insert: `(${setClauses.join(',\n')})`,
        values: `(${setClauses.map(() => '?')})`,
    };
};

const buildWhereClause = (
    conditions: { clause: string; condition: boolean }[],
    options: {
        operation?: WhereOperation;
        includeWhere?: boolean;
    } = {}
): string => {
    const whereClauses = conditions
        .filter(({ condition }) => condition)
        .map(({ clause }) => clause);

    if (whereClauses.length === 0) {
        return '';
    }

    const { operation = WHERE_OPERATIONS.AND, includeWhere = true } = options;

    return `${includeWhere ? 'WHERE ' : ''}${whereClauses.join(operation)}`;
};

export { buildSetClause, buildWhereClause, buildInsertClause };
