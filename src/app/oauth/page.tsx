"use client";

import { useAuth } from "@contexts/authcontext";
import { useToast } from "@contexts/toastcontext";
import { APICall } from "@lib/api";
import { oauthlogin } from "@server/auth/login";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function OAuth() {

    const { setUser } = useAuth();
    const { AddToast } = useToast();
    const router = useRouter();

    useEffect(() => {
        const Connect = async () => {
            const params = new URLSearchParams(window.location.search);
            const status = params.get("oauth");
            const error = params.get("error");
        
            if (status == 'success') {
                const oauthloginrequest = await APICall(oauthlogin, null, null);
                if (!oauthloginrequest.success) return AddToast(oauthloginrequest.message, "error");

                router.push(`/profile/${oauthloginrequest.data.handle}`);
                setUser(oauthloginrequest.data);
                AddToast("Successfully logged in", "success");
            } else if (status == 'error') {
                router.push("/login");
                AddToast(error ?? "Unknown error", "error");
            }
        };

        Connect();
    }, []);

    return (<></>);
}