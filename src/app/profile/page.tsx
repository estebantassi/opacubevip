"use client";

import { useAuth } from "../../contexts/authcontext"
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/* eslint-disable react-hooks/exhaustive-deps */
export default function Profile() {

    const { user } = useAuth();
    const router = useRouter();

    useEffect(()=> {
        if (user) router.push(`/profile/${user.uuid}`);
        else router.push("/home");
    }, []);

    return (<></>);
}
