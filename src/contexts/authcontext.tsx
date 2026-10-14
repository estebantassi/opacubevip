"use client";

import { createContext, Dispatch, SetStateAction, use, useEffect, useState, type ReactNode } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useToast } from "./toastcontext";
import type { ActionResult, User } from "@mytypes/types";
import { logout } from "@server/auth/logout";
import { updateAccess } from "@server/auth/updateaccess";
import z from "zod";
import { validateSchema } from "@lib/tools";

type AuthContextType = {
    user: User | null;
    isUserReady: boolean;
    setUser: Dispatch<SetStateAction<User | null>>;
    Logout: () => Promise<void>;
    APICallAuth: <TInput, TOutput>(fn: (input: TInput) => Promise<ActionResult<TOutput>>, input: TInput | null, schema: z.ZodType<TInput> | null ) => Promise<ActionResult<TOutput>>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);


export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isUserReady, setIsUserReady] = useState(false);

    const router = useRouter();

    const { AddToast } = useToast();

    //Set cookie when user is changed and valid
    useEffect(() => {
        if (user)
        {
            Cookies.set("user", JSON.stringify(user), {
                expires: 7,
                secure: process.env.NEXT_PUBLIC_SECURE === "true",
                sameSite: "Strict",
            });
        }
    }, [user])

    useEffect(() => {
        const cookie = Cookies.get("user");

        if (!cookie) {
            /* eslint-disable-next-line react-hooks/set-state-in-effect */
            setUser(null);
            setIsUserReady(true);
            return;
        }

        try { setUser(JSON.parse(cookie)); } catch { setUser(null); }

        setIsUserReady(true);
    }, []);

    const Logout = async () => {
        await logout();

        setUser(null);
        Cookies.remove("user");
        router.push("/home");

        AddToast("You have been logged out", "info");
    };

    async function APICallAuth<TInput, TOutput>(fn: (input: TInput) => Promise<ActionResult<TOutput>>, input: TInput | null, schema: z.ZodType<TInput> | null ): Promise<ActionResult<TOutput>> {
        try {
            const validatedInput = validateSchema(input, schema);
            if (!validatedInput.success) return validatedInput;

            let result = await fn(validatedInput.data);
            if (!result.success && !result.authorized) {
                const refresh = await updateAccess();
                if (!refresh.success) {
                    Logout();
                    return result;
                }
                result = await fn(validatedInput.data);
            }
            return result;
        } catch (err) {
            console.error(err);
            return { success: false, message: "Internal server error", authorized: true };
        }
    }

    return (
        <AuthContext value={{
            isUserReady,
            user,
            setUser,
            Logout,
            APICallAuth
        }}>
            {children}
        </AuthContext>
    );
};

export function useAuth() {
    const context = use(AuthContext);
    if (!context) { throw new Error("useAuth must be used inside AuthProvider"); }
    return context;
}