import jwt from "jsonwebtoken";
import { getCachedValue, setCachedValue } from "../lib/redis";
import { cookies } from "next/headers";
import { ActionResult } from "../types/types";
import { DB, prisma } from "@lib/prisma";
import { token_type } from "@prisma/enums";

const TokenStorageType = {
    CACHE: "cache",
    DATABASE: "database",
    BOTH: "both",
} as const;
type TokenStorageType = typeof TokenStorageType[keyof typeof TokenStorageType];

export type TokenContent = {
    useruuid: string,
    jti: string,
    storagetype: TokenStorageType,
    step: number | null,
    accessjti: string | null
}

export class Token {
    static Type = token_type;
    static StorageType = TokenStorageType;

    public type: token_type;
    public content: TokenContent;
    public token: string;
    public exp: Date;
    public duration: number;
    public version: number;

    constructor(useruuid: string, type: token_type, storagetype: TokenStorageType, step: number | null = null, accessjti: string | null = null) {
        const jti = crypto.randomUUID();

        this.version = Number(process.env['TOKEN_SECRET_' + type.toUpperCase() + '_VERSION']);
        this.duration = Number(process.env['TOKEN_EXP_' + type.toUpperCase()]) * 60 * 60 * 1000;
        this.content = {
            useruuid,
            jti,
            storagetype,
            step,
            accessjti
        }

        this.exp = new Date(Date.now() + this.duration);
        this.token = jwt.sign(this.content, String(process.env['TOKEN_SECRET_' + type.toUpperCase() + '_V' + this.version]));
        this.type = type;
    }

    async Save(database: DB = prisma) {
        try {
            if (this.content.storagetype != TokenStorageType.DATABASE)
                await setCachedValue(`${this.content.useruuid}/tokens/${this.type}/${this.content.jti}`, this.duration * 60 * 60 + 10, "1");

            if (this.content.storagetype != TokenStorageType.CACHE)
                await database.tokens.create({
                    data: {
                        useruuid: this.content.useruuid,
                        type: this.type,
                        jti: this.content.jti,
                        expires_at: this.exp,
                    },
                });

            const cookieStore = await cookies();
            cookieStore.set({
                name: "token_" + this.type,
                value: this.version + ":" + this.token,
                httpOnly: true,
                path: "api/auth/" + this.type,
                sameSite: "strict",
                secure: process.env.SECURE === "true",
                maxAge: this.duration / 1000,
            });

            return true;
        } catch (err) {
            if (process.env.LOG_ERRORS === "true") console.log(err);
            return false;
        }
    }

    static async Remove(name: string)
    {
        const cookieStore = await cookies();
        cookieStore.delete(name);
    }

    static async GetData(encryptedToken: string | undefined, type: token_type) : Promise<ActionResult<TokenContent>> {
        if (encryptedToken == undefined) return { success: false, message: "Token not present", authorized: false };

        const tokenSlicer = encryptedToken.indexOf(":");
        if (tokenSlicer === -1) return { success: false, message: "Invalid token format", authorized: false };

        const version = Number(encryptedToken.slice(0, tokenSlicer));
        if (version == null) return { success: false, message: "Invalid token version", authorized: false };

        const secret = process.env['TOKEN_SECRET_' + type.toUpperCase() + '_V' + version];
        if (secret == null) return { success: false, message: "Invalid token version", authorized: false };

        const token = encryptedToken.slice(tokenSlicer + 1);
        const decode = jwt.verify(token, secret) as TokenContent;

        if (decode.storagetype != Token.StorageType.DATABASE) {
            const cache = await getCachedValue(`${decode.useruuid}/tokens/${type}/${decode.jti}`);
            if (cache == null && decode.storagetype == Token.StorageType.CACHE) return { success: false, message: "Token expired, revoked or inexistant", authorized: false };
        }

        if (decode.storagetype != Token.StorageType.CACHE) {
            const response = await prisma.tokens.findUnique({ where: { jti: decode.jti }, select: { expires_at: true }});

            if (!response) return { success: false, message: "Token expired, revoked or inexistant", authorized: false };
            if (new Date(response.expires_at) < new Date()) {
                try {
                    await prisma.tokens.delete({ where: { jti: decode.jti } });
                } catch (err) { if (process.env.LOG_ERRORS === 'true') console.error(err); }

                return { success: false, message: "Token expired", authorized: false };
            }
        }

        return { success: true, message: "Successfully fetched data", data: decode };
    }
}
