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

const PERMISSION_SCOPES = {
    ADMIN: 'admin',
} as const;

type PermissionScope = typeof PERMISSION_SCOPES[keyof typeof PERMISSION_SCOPES];

const WHERE_OPERATIONS = {
    AND: ' and ',
    OR: ' or ',
} as const;

type WhereOperation = typeof WHERE_OPERATIONS[keyof typeof WHERE_OPERATIONS];

export {
    MySqlErrorCode,
    LogLevel,
    WhereOperation,
    PermissionScope,
    LOG_LEVELS,
    PERMISSION_SCOPES,
    WHERE_OPERATIONS,
};
