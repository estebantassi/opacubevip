"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@contexts/authcontext";
import Image from "next/image";
import { ClipboardPen, House, LogIn, LogOut, Terminal } from "lucide-react";

type NavbarContent = {
    type: "top" | "bottom"
}

export default function Navbar({type = "top"} : NavbarContent) {
    const pathname = usePathname();
    const { user, isUserReady, Logout } = useAuth();

    const active = "bg-accent opacity-75";

    const visibility = type === "bottom" ? "lg:hidden" : "hidden lg:flex";
    const border = type === "bottom" ? "border-t-1 border-borderprimary" : "border-b-1 border-borderprimary"

    return (
        <>
        {/* NOT MOBILE READY */}
        {isUserReady ? 
            <nav className={`${visibility} ${type}-0 ${border} sticky w-full z-6 shadow-[0_-10px_20px_rgba(0,0,0,0.1)] lg:shadow-xl/20 bg-content flex justify-center [&>*:hover]:bg-accent [&>*]:transition-colors`}>
                {/* Always */}  
                <Link className={`font-bold py-4 px-5 lg:px-10 flex justify-center items-center ${pathname==="/home"?active:''}`} href="/home"><span className="hidden lg:inline lg:mr-2">Home</span><House/></Link>

                {/* Not logged in */}
                {!user && <Link className={`font-bold py-4 px-5 lg:px-10 flex justify-center items-center ${pathname==="/login"?active:''}`} href="/login"><span className="hidden lg:inline lg:mr-2">Login</span><LogIn/></Link>}
                {!user && <Link className={`font-bold py-4 px-5 lg:px-10 flex justify-center items-center ${pathname==="/register"?active:''}`} href="/register"><span className="hidden lg:inline lg:mr-2">Register</span><ClipboardPen/></Link>}

                {/* Logged in */}
                {user && <Link className={`font-bold flex justify-center items-center px-5 lg:px-10 ${pathname===`/profile/${user.handle}`?active:''}`} href={`/profile/${user.handle}`}><span className="hidden lg:inline lg:mr-2">Profile</span><Image className="rounded-full h-10 w-10" src={user.avatar} width={1} height={1} alt="avatar"/></Link>}
                {user && <Link onClick={Logout} className={`hover:text-red-500 font-bold py-4 px-5 lg:px-10 flex justify-center items-center ${pathname==="/logout"?active:''}`} href="/home"><span className="hidden lg:inline lg:mr-2">Logout</span><LogOut/></Link>}
                {/* {user && <Link className={pathname==="/accountsettings"?active:''} href="/accountsettings">Account Settings</Link>} */}

                {/* Admin */}
                {user && user.admin && <Link className={`font-bold py-4 px-5 lg:px-10 flex justify-center items-center ${pathname==="/admin"?active:''}`} href="/admin"><span className="hidden lg:inline lg:mr-2">Admin</span><Terminal className="rgb-text"/></Link>}
            </nav>
        :
        // Skeleton
        <nav className={`${type}-0 sticky w-full z-6 shadow-[0_-10px_20px_rgba(0,0,0,0.1)] lg:shadow-xl/20 bg-content flex justify-center gap-4 p-4`}>
            {[...Array(3)].map((_, i) => (
                <div key={i} className="h-6 w-20 bg-accent animate-pulse rounded" />
            ))}
        </nav>
        }
        </>
    );
}