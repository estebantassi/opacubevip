"use client";

import { Button, Input } from "@components/inputs";
import Spinner from "@components/spinner";
import { useAuth } from "@contexts/authcontext";
import { useModal } from "@contexts/modalcontext";
import { useToast } from "@contexts/toastcontext";
import { A_TableUser } from "@mytypes/admin/types";
import { A_ChangeUserSchema, A_DeleteUserSchema, A_GetUsersSchema } from "@schemas/admin/schemas";
import { A_changeUser } from "@server/admin/changeuser";
import { A_deleteUser } from "@server/admin/deleteuser";
import { A_getUsers } from "@server/admin/getusers";
import { withLoading } from "@tools/loading";
import { CircleCheck, Trash } from "lucide-react";
import { memo, useCallback, useEffect, useRef, useState } from "react";

//Order of this is order of display when mapping
const fields: (keyof A_TableUser)[] = ["username", "handle", "uuid", "created_at", "admin"];
type FieldState = {
    field: (typeof fields)[number];
    toggled: boolean;
};

type UserRowContent = {
    userdata: A_TableUser,
    fields: FieldState[],
    index: number,
    ChangeUser: (uuid: string, username?: string, handle?: string) => void,
    DeleteUser: (uuid: string) => void,
};

const UserRow = memo(function UserRow({ userdata, fields, index, ChangeUser, DeleteUser }: UserRowContent) {
    const created_at = userdata ? new Date(userdata.created_at).toLocaleString() : undefined;
    const isPair = index % 2 === 0;

    const bgPair = "bg-gray-700";
    const bgNPair = "bg-gray-800";
    const bg = isPair ? bgPair : bgNPair;

    const { ShowModal } = useModal();

    const [username, setUsername] = useState(userdata?.username);
    const [handle, setHandle] = useState(userdata?.handle);

    useEffect(() => {
        setUsername(userdata?.username);
        setHandle(userdata?.handle);
    }, [userdata])

    const el = `min-w-80 w-80 px-2 flex justify-between items-center`;

    return (
        <>
            <div className="flex gap-4 whitespace-nowrap flex-nowrap items-center">
                {/* Make sure order of this fits order of fieldstate */}
                {fields.find(t => t.field === "username")?.toggled && <div className={`relative ${bg} ${el} p-2`}>
                    {username != undefined && <Input style="none" className="!w-[90%] [&>input]:bg-subtle [&>input]:p-2" type="username" value={username} onChange={(e) => setUsername(e.target.value)}/>}
                    {username != undefined && username != userdata?.username && <CircleCheck onClick={() => { ChangeUser(userdata?.uuid, username) }} className="hover:cursor-pointer hover:opacity-75 transition-opacity"/>}
                    {username == undefined && <p className="p-2"></p> }
                </div>}

                {fields.find(t => t.field === "handle")?.toggled && <div className={`relative ${bg} ${el} p-2`}>
                    {handle != undefined && <Input style="none" className="!w-[90%] [&>input]:bg-subtle [&>input]:p-2" type="handle" value={handle} onChange={(e) => setHandle(e.target.value)}/>}
                    {handle != undefined && handle != userdata?.handle && <CircleCheck onClick={() => { ChangeUser(userdata?.uuid, undefined, handle) }} className="hover:cursor-pointer hover:opacity-75 transition-opacity"/>}
                    {username == undefined && <p className="p-2"></p> }
                </div>}

                {fields.find(t => t.field === "uuid")?.toggled && <div className={`${bg} ${el} p-4`}> <p className="w-[90%]">{userdata?.uuid}</p> </div>}
                {fields.find(t => t.field === "created_at")?.toggled && <div className={`${bg} ${el} p-4`}> <p className="w-[90%]">{created_at}</p> </div>}
                {fields.find(t => t.field === "admin")?.toggled && <div className={`${bg} ${el} p-4`}> <p className="w-[90%]">{userdata?.admin !== undefined ? (userdata.admin ? "yes" : "no") : ""}</p> </div>}
                {userdata && <div className="flex items-center">
                    <Trash onClick={() => ShowModal("Are you sure you want to delete this user ?", () => DeleteUser(userdata.uuid)) }/>
                </div>}

            </div>
        </>
    )
})

export default function UsersTable() {

    const { APICallAuth } = useAuth();
    const { AddToast } = useToast();
    
    const [batchNumber, setBatchNumber] = useState(10);
    const [firstUserUUID, setFirstUserUUID] = useState<undefined | string>();
    const [lastUserUUID, setLastUserUUID] = useState<undefined | string>();

    const date = new Date();

    const [users, setUsers] = useState<A_TableUser[]>([]);
    const [total, setTotal] = useState<undefined | number>();
    const [page, setPage] = useState(0);

    const [totalPages, setTotalPages] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const hasFetched = useRef(false);

    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;

        GetUsers();
    }, []);

    const GetUsers = async (reverse?: boolean, skip?: number) => {
        await withLoading(async () => {
            const request = await APICallAuth(A_getUsers, {
                fetchdate: date,
                lastuuid: lastUserUUID,
                firstuuid: firstUserUUID,
                batch: batchNumber,
                skip,
                reverse
            }, A_GetUsersSchema);

            if (!request.success)  {
                AddToast(request.message, "error");
                return;
            }

            if (request.data.count) {
                setTotal(request.data.count);
                setTotalPages(Math.ceil(request.data.count / batchNumber));
            }

            if (reverse) setPage(prev => prev - (skip ? skip : 1))
            else setPage(prev => prev + (skip ? skip : 1));

            setLastUserUUID(request.data.users[request.data.users.length - 1].uuid);
            setFirstUserUUID(request.data.users[0].uuid);
            setUsers(request.data.users);

        }, isLoading, setIsLoading);
    };

    const DeleteUser = useCallback(async (uuid: string) => {
        await withLoading(async () => {
            const request = await APICallAuth(A_deleteUser, { uuid }, A_DeleteUserSchema);

            if (!request.success)  {
                AddToast(request.message, "error");
                return;
            }

            setUsers(prev => prev.filter(user => user.uuid !== uuid));

            AddToast(request.message, "success");
        }, isLoading, setIsLoading);
    }, [isLoading, APICallAuth, AddToast]);

    const ChangeUser = useCallback(async (uuid: string, username?: string, handle?: string) => {
        await withLoading(async () => {
            const request = await APICallAuth(A_changeUser, { uuid, username, handle }, A_ChangeUserSchema);
            if (!request.success) {
                return AddToast(request.message, "error");
            }

            AddToast(request.message, "success");

            setUsers(prev =>prev.map(user => user.uuid === uuid ? {
                ...user,
                ...(handle && { handle }),
                ...(username && { username })
            } : user));

        }, isLoading, setIsLoading);
    }, [APICallAuth, AddToast, isLoading]);

    const [useFields, setUseFields] = useState<FieldState[]>(fields.map((field) => ({
        field,
        toggled: true,
    })));

    return (
        <>
            <input onChange={(e) => setBatchNumber(Number(e.target.value))} type="number" min="1" max="50" value={batchNumber} />
            <button type="button" onClick={() => { GetUsers(); }}>Getem</button>

            <div className="flex gap-4">
                {useFields.map((item) => (
                    <div key={item.field}>
                        {item.field}
                        <input type="checkbox" onChange={(e) => { setUseFields(prev => prev.map(f => f.field === item.field ? { ...f, toggled: e.target.checked } : f)); }} checked={item.toggled} />
                    </div>
                ))}
            </div>

            <div className="overflow-x-auto">
                <div className="flex gap-4">
                    {useFields.map((item) => (
                        item.toggled && <div key={item.field} className="flex min-w-80">
                            {item.field}
                        </div>
                    ))}
                </div>

                <div className="relative inline-block">
                    {isLoading && <Spinner/>}
                    {[...Array(batchNumber)].map((_, i) => (
                        <UserRow key={users[i]?.uuid ?? i} userdata={users[i]} fields={useFields} index={i} ChangeUser={ChangeUser} DeleteUser={DeleteUser} />
                    ))}
                </div>

                <div>
                    <p>Page : {page}/{totalPages} Total users : <span className="font-bold">{total}</span></p>
                    <Button disabled={page <= 1} style="main" type="button" onClick={() => GetUsers(true, Math.min(page - 1, 100))}>{`<<`}</Button>

                    <Button disabled={page < 16} style="main" type="button" onClick={() => GetUsers(true, 15)}>-15</Button>

                    <Button disabled={page < 6 } style="main" type="button" onClick={() => GetUsers(true, 5)}>-5</Button>

                    <Button disabled={page <= 1} style="main" type="button" onClick={() => GetUsers(true)}>Previous</Button>
                    <Button disabled={page == totalPages} style="main" type="button" onClick={() => GetUsers()}>Next</Button>

                    <Button disabled={totalPages - page < 5} style="main" type="button" onClick={() => GetUsers(false, 5)}>5</Button>

                    <Button disabled={totalPages - page < 15} style="main" type="button" onClick={() => GetUsers(false, 15)}>15</Button>

                    <Button disabled={page === totalPages} style="main" type="button" onClick={() => GetUsers(false, Math.min(totalPages - page, 100))}>{`>>`}</Button>
                </div>
                
            </div>
        </>
    );
}