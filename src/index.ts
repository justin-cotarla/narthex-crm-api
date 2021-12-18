import { ApolloServer } from 'apollo-server';
import {
    ApolloServerPluginLandingPageGraphQLPlayground,
    ApolloServerPluginLandingPageDisabled,
} from 'apollo-server-core';

import { NarthexCrmDbDataSource } from './datasources/NarthexCrmDbDataSource';
import { loadConfig } from './loadConfig';
import { loadTypeDefs } from './loadTypeDefs';
import { resolvers } from './resolvers';
import { decodeClientToken } from './util/crypto';

async function startApolloServer() {
    const config = loadConfig();

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
        }),
        dataSources: () => ({
            narthexCrmDbDataSource,
        }),
    });

    const { url } = await server.listen({
        port: config.server.port,
    });

    console.log(`Server ready at ${url}`);
}

startApolloServer();
