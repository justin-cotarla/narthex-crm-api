import { Resolvers } from '../types/generated/graphql';

import { Ministry } from './Ministry';
import { Mutation } from './Mutation';
import { Query } from './Query';

const resolvers: Resolvers = {
    Query,
    Mutation,
    Ministry,
};

export { resolvers };
