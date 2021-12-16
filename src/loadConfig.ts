import { Config, ConfigFile } from './types/config';

const loadConfig = (): Config => {
    const {
        SERVER_PORT,
        MYSQL_PASSWORD,
        MYSQL_USER,
        DB_CONNECTION_LIMIT,
        DB_HOST,
        DB_NAME,
        JWT_SECRET,
    } = process.env as NodeJS.ProcessEnv | ConfigFile;

    if (
        !SERVER_PORT ||
        !MYSQL_PASSWORD ||
        !MYSQL_USER ||
        !DB_HOST ||
        !DB_NAME ||
        !JWT_SECRET
    ) {
        throw new Error('Incomplete configuration');
    }

    return {
        server: {
            port: parseInt(SERVER_PORT, 10),
        },
        database: {
            user: MYSQL_USER,
            password: MYSQL_PASSWORD,
            host: DB_HOST,
            database: DB_NAME,
            connectionLimit: DB_CONNECTION_LIMIT
                ? parseInt(DB_CONNECTION_LIMIT, 10)
                : 10,
        },
        jwtSecret: JWT_SECRET,
    };
};

export { loadConfig };
