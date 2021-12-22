import type { PoolConfig } from 'mysql';

import { LogLevel } from '../util/enums';

interface ConfigFile {
    SERVER_PORT: string;
    MYSQL_PASSWORD: string;
    MYSQL_USER: string;
    DB_CONNECTION_LIMIT: string;
    DB_HOST: string;
    DB_NAME: string;
    JWT_SECRET: string;
    LOG_LEVEL: LogLevel;
    LOG_FILE_NAME: string;
}

interface Config {
    server: {
        port: number;
    };
    database: PoolConfig;
    jwtSecret: string;
    log: {
        level: LogLevel;
        file: string;
    };
}

export type { ConfigFile, Config };
