"use client";

import { useAuth } from "../../contexts/authcontext";
import Image from 'next/image'
import { test } from "../../server/auth/test";
import { Button } from "../../components/inputs";

export default function Profile() {

    const { user, Logout, APICallAuth } = useAuth();

    const authreq = async () => {
        const req = await APICallAuth(test, null, null);

        console.log(req);
    };

    return (
        <div>
            <h1>Profile</h1>

            {user && user.avatar && <Image priority height={300} width={300} src={user.avatar} alt="avatar" />}
            {user && <Button type="button" style="main" onClick={Logout}>Log out</Button>}
            <Button type="button" style="main" onClick={authreq}>Check access</Button>
        </div>
    );
}
