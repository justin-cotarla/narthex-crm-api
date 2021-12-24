import DataLoader from 'dataloader';

import { NarthexCrmDbDataSource } from '../datasources/NarthexCrmDbDataSource';
import { Client } from '../types/generated/graphql';

const getClientLoader = (narthexCrmDataSource: NarthexCrmDbDataSource) => {
    const batchClientById = async (
        clientIds: readonly number[]
    ): Promise<Client[]> => {
        const clients = await narthexCrmDataSource.getClients(
            clientIds as number[]
        );

        const clientIndex = clients.map(({ id, ...client }) => ({
            id,
            client: { ...client, id },
        }));
        const clientMap = clientIndex.reduce<{ [id: number]: Client }>(
            (prev, curr) => ({
                ...prev,
                [curr.id]: curr.client,
            }),
            {}
        );

        return clientIds.map((clientId) => clientMap[clientId] ?? undefined);
    };

    return new DataLoader(batchClientById);
};

export { getClientLoader };
