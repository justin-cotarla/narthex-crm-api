import { Resolvers } from '../types/generated/graphql';

import { Ministry } from './Ministry';
import { Mutation } from './Mutation';
import { Person } from './Person';
import { Query } from './Query';

const resolvers: Resolvers = {
    Query,
    Mutation,
    Ministry,
    Person,
};

export { resolvers };
