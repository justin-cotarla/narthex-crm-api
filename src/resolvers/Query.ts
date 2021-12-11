import { Ministry, QueryResolvers } from '../types/generated/graphql';

const ministries: Ministry[] = [
    {
        id: 1,
        color: '#3b82f6',
        name: 'Choir',
        creationTimestamp: 1639246358,
        modificationTimestamp: 1639246358,
        archived: false,
    },
];

const Query: QueryResolvers = {
    ministries: () => ministries,
};

export { Query };
