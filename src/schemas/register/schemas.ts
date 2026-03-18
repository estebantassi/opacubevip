import { z } from "zod";
import { Code, Email, Password, Username } from "../../types/types";
import { SRPSalt, SRPVerifier } from "../../types/srp/types";

export const RegisterSchema = z
    .object({
        username: Username,
        email: Email,
        emailcheck: Email,
        srpSalt: SRPSalt,
        srpVerifier: SRPVerifier
    })
    .refine((data) => data.email === data.emailcheck, {
        message: "Emails don't match",
        path: ["emailcheck"]
    });

export const RegisterFormSchema = z
    .object({
        username: Username,
        email: Email,
        emailcheck: Email,
        password: Password,
        passwordcheck: Password
    })
    .refine((data) => data.email === data.emailcheck, {
        message: "Emails don't match",
        path: ["emailcheck"]
    })
    .refine((data) => data.password === data.passwordcheck, {
        message: "Passwords don't match",
        path: ["passwordcheck"]
    });

export const VerifySchema = z
    .object({
        code: Code,
    })


export type RegisterInput = z.infer<typeof RegisterSchema>;
export type RegisterFormInput = z.infer<typeof RegisterFormSchema>;
export type VerifyInput = z.infer<typeof VerifySchema>;