"use client";

import { useAuth } from "../../../contexts/authcontext";
import Image from 'next/image'
import { Button } from "../../../components/inputs";
import { use, useEffect, useState } from 'react'
import { User } from "src/types/types";
import { APICall } from "@lib/api";
import { getUserProfile } from "@server/getuserprofile";
import { UserProfileSchema } from "src/schemas/schemas";
import { useRouter } from "next/navigation";
import { useToast } from "src/contexts/toastcontext";

/* eslint-disable react-hooks/exhaustive-deps */
export default function Profile({
    params,
}: {
    params: Promise<{ uuid: string }>
}) {

    const { uuid } = use(params)

    const { user, Logout } = useAuth();

    const [pageUser, setPageUser] = useState<User | null>(null);

    const { AddToast } = useToast();

    const router = useRouter();

    useEffect(() => {
        const getUser = async () => {
            const request = await APICall(getUserProfile, { uuid }, UserProfileSchema);
            if (!request.success) {
                router.push("/home");
                return AddToast(request.message, "error");
            }
            setPageUser(request.data);
        };

        if (uuid == user?.uuid) setPageUser(user);
        else getUser();
    }, []);

    return (
        <div>
            <h1>Profile {uuid}</h1>
            {pageUser && pageUser.avatar && <Image priority height={300} width={300} src={pageUser.avatar} alt="avatar" />}
            {pageUser && <Button type="button" style="main" onClick={Logout}>Log out</Button>}
        </div>
    );
}
