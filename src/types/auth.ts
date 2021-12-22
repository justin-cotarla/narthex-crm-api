import { PermissionScope } from '../util/enums';

interface ClientToken {
    id: number;
    emailAddress: string;
    permissionScope: PermissionScope;
}

export type { ClientToken };
