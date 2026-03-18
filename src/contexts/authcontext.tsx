"use client";

import { createContext, use, useEffect, useState, type ReactNode } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useToast } from "./toastcontext";
import type { ActionResult, User } from "../types/types";
import { logout } from "../server/auth/refresh/logout";
import { updateAccess } from "../server/auth/refresh/updateaccess";
import z from "zod";
import { validateSchema } from "../lib/tools";

type AuthContextType = {
    user: User | null;
    avatar: string | null;
    setAvatar: React.Dispatch<React.SetStateAction<string | null>>;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
    Logout: () => Promise<void>;
    APICallAuth: <TInput, TOutput>(fn: (input: TInput) => Promise<ActionResult<TOutput>>, input: TInput | null, schema: z.ZodType<TInput> | null ) => Promise<ActionResult<TOutput>>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(() => {
        const cookie = Cookies.get("user");
        if (!cookie) return null;
        try { return JSON.parse(cookie) as User; } catch { return null; }
    });
    const [avatar, setAvatar] = useState<string | null>(null);
    /* eslint-disable react-hooks/set-state-in-effect*/
    useEffect(() => { setAvatar(user ? localStorage.getItem(`avatar-${user.uuid}`) : null); }, [user]);
    /* eslint-enable react-hooks/set-state-in-effect*/

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
        const params = new URLSearchParams(window.location.search);
        const status = params.get("oauth");
        const error = params.get("error");

        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, '', cleanUrl);

        if (status == 'success') {
            const cookie = Cookies.get("user");
            if (!cookie) return AddToast("Error grabbing user cookie", "error");;
            /* eslint-disable react-hooks/set-state-in-effect*/
            setUser(JSON.parse(cookie) as User);
            /* eslint-enable react-hooks/set-state-in-effect*/
            AddToast("Successfully logged in", "success");
        } else if (status == 'error') {
            AddToast(error ?? "Unknown error", "error");
        }
        
    }, []);

    const Logout = async () => {
        await logout();

        Cookies.remove("user");
        router.push("/home");

        setUser(null);

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

    /* eslint-disable react-hooks/set-state-in-effect*/
    const [mounted, setMounted] = useState(false); useEffect(() => { setMounted(true) }, []); if (!mounted) return null;
    /* eslint-enable react-hooks/set-state-in-effect*/

    return (
        <AuthContext value={{
            user,
            avatar,
            setAvatar,
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