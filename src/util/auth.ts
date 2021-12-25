import { ForbiddenError } from 'apollo-server';

import { ClientToken, PermissionScope } from '../types/auth';

const authorize = (
    clientToken: ClientToken | null,
    options: {
        isPublic?: boolean;
        scopes?: PermissionScope[];
        ownId?: number;
    }
): void => {
    const { isPublic = false, scopes = ['admin'], ownId } = options;

    if (isPublic) {
        return;
    }

    if (!clientToken) {
        throw new ForbiddenError('Not authorized');
    }

    if (ownId && clientToken.id === ownId) {
        return;
    }

    if (!scopes.includes(clientToken.permissionScope)) {
        throw new ForbiddenError('Not authorized');
    }
};

export { authorize };
