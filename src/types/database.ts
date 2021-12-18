interface DBClient {
    id: number;
    email_address: string;
    creation_timestamp: Date;
    permission_scope: 'admin';
    last_login_timestamp?: Date;
    active: number;
    pass_hash: string;
}

export type { DBClient };
