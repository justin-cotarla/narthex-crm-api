import { Resolvers } from '../types/generated/graphql';

import { Donation } from './Donation';
import { DonationCampaign } from './DonationCampaign';
import { Event } from './Event';
import { EventAttendance } from './EventAttendance';
import { Household } from './Household';
import { Milestone } from './Milestone';
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
    DonationCampaign,
    Milestone,
    Event,
    EventAttendance,
};

export { resolvers };
