import type { PoolConfig } from 'mysql';

const LOG_LEVELS = {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    VERBOSE: 'verbose',
    DEBUG: 'debug',
} as const;

type LogLevel = typeof LOG_LEVELS[keyof typeof LOG_LEVELS];

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

export { LOG_LEVELS };
export type { LogLevel, ConfigFile, Config };
