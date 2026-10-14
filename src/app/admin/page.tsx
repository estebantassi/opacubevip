"use client";

import UsersTable from "@components/adminpanel/userstable";
import { Button } from "@components/inputs";
import { useAuth } from "@contexts/authcontext";
import { useToast } from "@contexts/toastcontext";
import { A_createUsers } from "@server/admin/createusers";

export default function Admin() {

    const { APICallAuth } = useAuth();
    const { AddToast } = useToast();

    const createUsers = async () => {
        const request = await APICallAuth(A_createUsers, null, null);

        if (!request.success) return AddToast(request.message, "error");

        return AddToast(request.message, "success");
    };

    return (    
        <>
            <div className="bg-gray-500">
                <UsersTable/>
                <Button style="main" type="button" onClick={createUsers}>Create 1000 random users</Button>
            </div>
        </>
    );
}