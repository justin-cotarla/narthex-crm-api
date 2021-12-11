import path from 'path';

import { loadFiles } from '@graphql-tools/load-files';
import { mergeTypeDefs } from '@graphql-tools/merge';

const loadTypeDefs = async () => {
    const types = await loadFiles(path.join(__dirname, '../schema/*.graphql'));
    const typeDefs = mergeTypeDefs(types);

    return typeDefs;
};

export { loadTypeDefs };
