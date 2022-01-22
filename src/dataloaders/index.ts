import { NarthexCrmDbDataSource } from '../datasources/NarthexCrmDbDataSource';

import { getClientLoader } from './clientLoader';
import { getDonationCampaignLoader } from './donationCampaignLoader';
import {
    getDonationByHouseholdLoader,
    getDonationLoader,
} from './donationLoader';
import {
    getEventAttendanceByPersonLoader,
    getEventAttendanceByEventLoader,
} from './eventAttendanceLoader';
import { getEventLoader } from './eventLoader';
import { getHouseholdLoader } from './householdLoader';
import { getMilestoneByPersonLoader } from './milestoneLoader';
import {
    getMinistryDelegationsByMinistryLoader,
    getMinistryDelegationsByPersonLoader,
} from './ministryDelegationLoader';
import { getMinistryLoader } from './ministryLoader';
import { getPeopleByHouseholdLoader, getPersonLoader } from './personLoader';

const createDataLoaders = (narthexCrmDataSource: NarthexCrmDbDataSource) => ({
    clients: getClientLoader(narthexCrmDataSource),
    people: getPersonLoader(narthexCrmDataSource),
    ministries: getMinistryLoader(narthexCrmDataSource),
    ministryDelegationsByPerson:
        getMinistryDelegationsByPersonLoader(narthexCrmDataSource),
    ministryDelegationsByMinistry:
        getMinistryDelegationsByMinistryLoader(narthexCrmDataSource),
    households: getHouseholdLoader(narthexCrmDataSource),
    peopleByHousehold: getPeopleByHouseholdLoader(narthexCrmDataSource),
    donations: getDonationLoader(narthexCrmDataSource),
    donationsByHousehold: getDonationByHouseholdLoader(narthexCrmDataSource),
    donationCampaigns: getDonationCampaignLoader(narthexCrmDataSource),
    milestonesByPerson: getMilestoneByPersonLoader(narthexCrmDataSource),
    events: getEventLoader(narthexCrmDataSource),
    eventAttendanceByPerson:
        getEventAttendanceByPersonLoader(narthexCrmDataSource),
    eventAttendanceByEvent:
        getEventAttendanceByEventLoader(narthexCrmDataSource),
});

export { createDataLoaders };
