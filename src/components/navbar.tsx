"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@contexts/authcontext";

export default function Navbar() {
    

    const pathname = usePathname();
    const { user } = useAuth();

    const active = "bg-accent opacity-75";

    return (
        <>
            <nav className={`bg-content flex justify-center [&>*]:font-bold [&>*]:p-4 [&>*:hover]:bg-accent  [&>*]:transition-colors`}>
                {/* Always */}
                <Link className={pathname==="/"?active:''} href="/home">Home</Link>

                {/* Not logged in */}
                {!user && <Link className={pathname==="/login"?active:''} href="/login">Login</Link>}
                {!user && <Link className={pathname==="/register"?active:''} href="/register">Signup</Link>}

                {/* Logged in */}
                {user && <Link className={pathname===`/profile/${user.uuid}`?active:''} href={`/profile/${user.uuid}`}>Profile</Link>}
                {/* {user && <Link className={pathname==="/logout"?active:''} href="/logout">Logout</Link>}
                {user && <Link className={pathname==="/accountsettings"?active:''} href="/accountsettings">Account Settings</Link>} */}

            </nav>
        </>
    );
}