import { Resolvers } from '../types/generated/graphql';

import { Mutation } from './Mutation';
import { Query } from './Query';

const resolvers: Resolvers = {
    Query,
    Mutation,
};

export { resolvers };
