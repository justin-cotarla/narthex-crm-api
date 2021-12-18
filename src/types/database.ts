interface DBClient {
    id: number;
    email_address: string;
    creation_timestamp: Date;
    permission_scope: string;
    last_login_timestamp?: Date;
    active: number;
}

export type { DBClient };
