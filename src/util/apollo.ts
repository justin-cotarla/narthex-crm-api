import path from 'path';

import { loadFiles } from '@graphql-tools/load-files';
import { mergeTypeDefs } from '@graphql-tools/merge';
import { ContextFunction } from 'apollo-server-core';
import { ExpressContext } from 'apollo-server-express';
import { ApolloServerPlugin } from 'apollo-server-plugin-base';
import { FieldNode, GraphQLError } from 'graphql';
import { Logger } from 'winston';

import { createDataLoaders } from '../dataloaders';
import { NarthexCrmDbDataSource } from '../datasources/NarthexCrmDbDataSource';
import { Config } from '../types/config';
import { Context } from '../types/context';

import { decodeClientToken } from './crypto';
import { getLogger } from './logger';

const loadTypeDefs = async () => {
    const types = await loadFiles(
        path.join(__dirname, '../../schema/*.graphql')
    );
    const typeDefs = mergeTypeDefs(types);

    return typeDefs;
};

const DO_NOT_LOG = ['getToken', 'addClient', 'updateClient'];

const logError = (error: GraphQLError, logger: Logger) => {
    switch (error.extensions.code) {
        case 'DUPLICATE_ENTRY':
        case 'RESOURCE_NOT_FOUND':
        case 'BAD_USER_INPUT':
        case 'FORBIDDEN':
            logger.warn(`${error.name} - ${error.message}`);
            break;

        case 'DATABASE_ERROR':
            logger.error(`${error.name} - ${error.message}`);
            logger.error(error.stack);
            break;

        default:
            logger.error(`${error.name} - ${error.message}`);
    }
};

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
                errors.forEach((error) => logError(error, logger));
            },
        }),
    });

const getContextFunction =
    (
        config: Config,
        narthexCrmDbDataSource: NarthexCrmDbDataSource
    ): ContextFunction<ExpressContext, Omit<Context, 'dataSources'>> =>
    async ({ req }) => ({
        jwtSecret: config.jwtSecret,
        clientToken: await decodeClientToken(
            req.headers.authorization ?? '',
            config.jwtSecret
        ),
        logger: getLogger(config.log),
        dataLoaders: createDataLoaders(narthexCrmDbDataSource),
    });

export { loadTypeDefs, ApolloLoggingPlugin, getContextFunction };
