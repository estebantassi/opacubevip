import { z } from "zod";
import { Code, Email, Password, TurnstileToken, Username } from "@mytypes/types";
import { SRPSalt, SRPVerifier } from "@mytypes/srp/types";

export const RegisterSchema = z
    .object({
        username: Username,
        email: Email,
        emailcheck: Email,
        srpSalt: SRPSalt,
        srpVerifier: SRPVerifier,
        turnstileToken: TurnstileToken
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
        passwordcheck: Password,
        turnstileToken: TurnstileToken
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