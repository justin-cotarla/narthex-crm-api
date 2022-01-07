import { NarthexCrmDbDataSource } from '../datasources/NarthexCrmDbDataSource';

import { getClientLoader } from './clientLoader';
import { getDonationCampaignLoader } from './donationCampaignLoader';
import {
    getDonationByHouseholdLoader,
    getDonationLoader,
} from './donationLoader';
import { getHouseholdLoader } from './householdLoader';
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
});

export { createDataLoaders };
