enum MySqlErrorCode {
    'DUPLICATE_ENTRY' = 1062,
}

const LOG_LEVELS = {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    VERBOSE: 'verbose',
    DEBUG: 'debug',
} as const;

type LogLevel = typeof LOG_LEVELS[keyof typeof LOG_LEVELS];

export { MySqlErrorCode, LogLevel, LOG_LEVELS };
