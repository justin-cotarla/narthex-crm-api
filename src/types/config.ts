import { PoolConfig } from 'mysql';

interface ConfigFile {
    SERVER_PORT: string;
    MYSQL_PASSWORD: string;
    MYSQL_USER: string;
    DB_CONNECTION_LIMIT: string;
    DB_HOST: string;
    DB_NAME: string;
}

interface Config {
    server: {
        port: number;
    };
    database: PoolConfig;
}

export { ConfigFile, Config };
