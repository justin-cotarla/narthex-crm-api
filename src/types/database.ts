interface DBClient {
    id: number;
    email_address?: string;
    creation_timestamp?: Date;
    permission_scope?: 'admin';
    last_login_timestamp?: Date;
    active?: number;
    pass_hash?: string;
}

interface DBMinistry {
    id: number;
    name?: string;
    color?: number;
    created_by?: number;
    creation_timestamp?: Date;
    modified_by?: number;
    modification_timestamp?: Date;
    archived?: number;
}

interface DBInsertResponse {
    insertId: number;
}

interface DBUpdateResponse {
    changedRows: number;
    affectedRows: number;
}

export type { DBClient, DBUpdateResponse, DBInsertResponse, DBMinistry };
