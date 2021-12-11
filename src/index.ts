import { ApolloServer } from 'apollo-server';
import {
    ApolloServerPluginLandingPageGraphQLPlayground,
    ApolloServerPluginLandingPageDisabled,
} from 'apollo-server-core';

import { loadTypeDefs } from './loadTypeDefs';
import { resolvers } from './resolvers';

async function startApolloServer() {
    const typeDefs = await loadTypeDefs();

    const server = new ApolloServer({
        typeDefs,
        resolvers,
        plugins: [
            process.env.NODE_ENV === 'production'
                ? ApolloServerPluginLandingPageDisabled()
                : ApolloServerPluginLandingPageGraphQLPlayground(),
        ],
    });

    const { url } = await server.listen({
        port: process.env.SERVER_PORT,
    });

    console.log(`Server ready at ${url}`);
}

startApolloServer();
