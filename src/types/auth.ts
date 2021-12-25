const PERMISSION_SCOPES = {
    ADMIN: 'admin',
} as const;

type PermissionScope = typeof PERMISSION_SCOPES[keyof typeof PERMISSION_SCOPES];

interface ClientToken {
    id: number;
    emailAddress: string;
    permissionScope: PermissionScope;
}

export type { PERMISSION_SCOPES, PermissionScope, ClientToken };
