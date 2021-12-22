import { ApolloServer } from 'apollo-server';
import {
    ApolloServerPluginLandingPageGraphQLPlayground,
    ApolloServerPluginLandingPageDisabled,
} from 'apollo-server-core';

import { NarthexCrmDbDataSource } from './datasources/NarthexCrmDbDataSource';
import { resolvers } from './resolvers';
import { loadTypeDefs } from './util/apollo';
import { loadConfig } from './util/config';
import { decodeClientToken } from './util/crypto';
import { getLogger } from './util/logger';

async function startApolloServer() {
    const config = loadConfig();
    const logger = getLogger(config.log);

    const narthexCrmDbDataSource = new NarthexCrmDbDataSource(config.database);

    const typeDefs = await loadTypeDefs();

    const server = new ApolloServer({
        typeDefs,
        resolvers,
        plugins: [
            process.env.NODE_ENV === 'production'
                ? ApolloServerPluginLandingPageDisabled()
                : ApolloServerPluginLandingPageGraphQLPlayground(),
        ],
        context: async ({ req }) => ({
            jwtSecret: config.jwtSecret,
            clientToken: await decodeClientToken(
                req.headers.authorization ?? '',
                config.jwtSecret
            ),
            logger,
        }),
        dataSources: () => ({
            narthexCrmDbDataSource,
        }),
    });

    const { url } = await server.listen({
        port: config.server.port,
    });

    logger.info(`Server ready at ${url}`);
}

startApolloServer();
