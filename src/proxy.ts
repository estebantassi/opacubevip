import { NextRequest, NextResponse } from "next/server";
import { User } from "@mytypes/types";

const PROTECTED = ["/nothing"];
const UNPROTECTED = ["/login", "/register"];
const ADMIN = ["/admin"];

export function proxy(req: NextRequest) {
    const userUnparsed = req.cookies.get("user")?.value;
    let user: User | undefined;
    if (userUnparsed) { try { user = JSON.parse(userUnparsed); } catch { } }
    const { pathname } = req.nextUrl;

    const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
    const isUnprotected = UNPROTECTED.some((p) => pathname.startsWith(p));
    const isAdmin = ADMIN.some((p) => pathname.startsWith(p));

    if (!user && isProtected) {
        return NextResponse.redirect(new URL("/home", req.url));
    }

    if (user && isUnprotected) {
        return NextResponse.redirect(new URL("/home", req.url));
    }

    if (isAdmin && (!user || !user.admin)) {
        return NextResponse.redirect(new URL("/home", req.url));
    }

    return NextResponse.next();
}