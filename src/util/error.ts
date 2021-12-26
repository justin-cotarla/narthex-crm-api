import { ApolloError } from 'apollo-server-errors';

class NotFoundError extends ApolloError {
    constructor(message: string) {
        super(message, 'RESOURCE_NOT_FOUND');

        Object.defineProperty(this, 'name', { value: 'NotFoundError' });
    }
}

class DatabaseError extends ApolloError {
    constructor(message: string) {
        super(message, 'DATABASE_ERROR');

        Object.defineProperty(this, 'name', { value: 'DatabaseError' });
    }
}

class DuplicateEntryError extends ApolloError {
    constructor() {
        super('Duplicate entry', 'DUPLICATE_ENTRY');

        Object.defineProperty(this, 'name', { value: 'DuplicateEntryError' });
    }
}

export { NotFoundError, DatabaseError, DuplicateEntryError };
