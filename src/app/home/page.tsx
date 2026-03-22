"use client";

import { APICall } from "@lib/api";
import { test } from "@server/auth/test";

export default function Home() {

    const GetUsers = async () => {
        const result = await APICall(test, null, null);
        console.log(result);
    };

    return (
        <div>
            <h1>Home</h1>
            <button onClick={GetUsers}>Get users</button>
            
        </div>
    );
}
