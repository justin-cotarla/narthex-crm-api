import { ApolloError } from 'apollo-server-errors';

class NotFoundError extends ApolloError {
    constructor(message: string) {
        super(message, 'RESOURCE_NOT_FOUND');

        Object.defineProperty(this, 'name', { value: 'NotFoundError' });
    }
}

class QueryError extends ApolloError {
    constructor(message: string) {
        super(message, 'QUERY_ERROR');

        Object.defineProperty(this, 'name', { value: 'QueryError' });
    }
}

export { NotFoundError, QueryError };
