import * as argon2 from 'argon2';
import jwt, { SignOptions } from 'jsonwebtoken';

import { ClientToken } from '../types/auth';

const ARGON2_PARAMS: argon2.Options & { raw?: false } = {
    timeCost: 800,
    memoryCost: 4096,
    saltLength: 128,
    hashLength: 32,
    parallelism: 2,
};

const JWT_PARAMS: SignOptions = {
    expiresIn: '1h',
};

const hashPassword = async (password: string): Promise<string> => {
    let hrTime = process.hrtime();
    const startTime = hrTime[0] * 1000000 + hrTime[1] / 1000;

    const hash = await argon2.hash(password, ARGON2_PARAMS);

    hrTime = process.hrtime();
    const endTime = hrTime[0] * 1000000 + hrTime[1] / 1000;

    console.log(`Hash generated in ${(endTime - startTime) / 1000000}s`);

    return hash;
};

const verifyHash = async (password: string, hash: string): Promise<boolean> => {
    return argon2.verify(hash, password);
};

const generateClientToken = async (
    payload: ClientToken,
    jwtSecret: string
): Promise<string> => {
    const token = await jwt.sign(payload, jwtSecret, JWT_PARAMS);
    return token;
};

const decodeClientToken = async (
    token: string,
    jwtSecret: string
): Promise<ClientToken | null> => {
    try {
        const decoded = await jwt.verify(token, jwtSecret);
        return decoded as ClientToken;
    } catch {
        return null;
    }
};

export { hashPassword, verifyHash, generateClientToken, decodeClientToken };
