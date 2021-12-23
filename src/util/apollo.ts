import path from 'path';

import { loadFiles } from '@graphql-tools/load-files';
import { mergeTypeDefs } from '@graphql-tools/merge';
import { ApolloServerPlugin } from 'apollo-server-plugin-base';
import { FieldNode } from 'graphql';

import { Context } from '../types/context';

const loadTypeDefs = async () => {
    const types = await loadFiles(
        path.join(__dirname, '../../schema/*.graphql')
    );
    const typeDefs = mergeTypeDefs(types);

    return typeDefs;
};

const DO_NOT_LOG = ['getToken', 'addClient', 'updateClient'];

const ApolloLoggingPlugin: () => ApolloServerPlugin =
    (): ApolloServerPlugin<Context> => ({
        requestDidStart: async () => ({
            didResolveOperation: async ({
                context: { logger, clientToken },
                operation,
                request: { query, variables },
            }) => {
                const operationName = (
                    operation.selectionSet.selections[0] as FieldNode
                ).name.value;

                if (operationName === '__schema') {
                    return;
                }

                const client = clientToken
                    ? `Client [${clientToken.id}]`
                    : 'Unauthenticated client';

                logger.info(
                    `${client} requested ${operation.operation} "${operationName}"`
                );

                if (operationName.match(DO_NOT_LOG.join('|'))) {
                    return;
                }

                logger.debug(`Query\n${query?.trim()}`);

                if (Object.keys(variables ?? {}).length > 0) {
                    logger.debug(
                        `Variables\n${JSON.stringify(variables, null, 2)}`
                    );
                }
            },
            didEncounterErrors: async ({ context: { logger }, errors }) => {
                errors.forEach((error) =>
                    logger.warn(`${error.name} - ${error.message}`)
                );
            },
        }),
    });

export { loadTypeDefs, ApolloLoggingPlugin };
