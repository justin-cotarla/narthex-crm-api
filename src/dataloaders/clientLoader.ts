import DataLoader from 'dataloader';
import * as R from 'ramda';

import { NarthexCrmDbDataSource } from '../datasources/NarthexCrmDbDataSource';
import { Client } from '../types/generated/graphql';

const getClientLoader = (narthexCrmDataSource: NarthexCrmDbDataSource) => {
    const batchClientById = async (
        clientIds: readonly number[]
    ): Promise<Client[][]> => {
        const clients = await narthexCrmDataSource.getClients(
            clientIds as number[]
        );

        const clientMap = R.groupBy(({ id }) => id.toString(), clients);

        return clientIds.map((clientId) => clientMap[clientId] ?? undefined);
    };

    return new DataLoader(batchClientById);
};

export { getClientLoader };
