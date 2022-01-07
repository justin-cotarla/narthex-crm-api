import { Resolvers } from '../types/generated/graphql';

import { Donation } from './Donation';
import { Household } from './Household';
import { Ministry } from './Ministry';
import { MinistryDelegation } from './MinistryDelegation';
import { Mutation } from './Mutation';
import { Person } from './Person';
import { Query } from './Query';

const resolvers: Resolvers = {
    Query,
    Mutation,
    Ministry,
    Household,
    Person,
    MinistryDelegation,
    Donation,
};

export { resolvers };
