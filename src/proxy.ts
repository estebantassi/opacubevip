import { NextRequest, NextResponse } from "next/server";

const PROTECTED = ["/nothinglol"];
const UNPROTECTED = ["/login", "/register"];

export function proxy(req: NextRequest) {
    const user = req.cookies.get("user")?.value;
    const { pathname } = req.nextUrl;

    const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
    const isUnprotected = UNPROTECTED.some((p) => pathname.startsWith(p));

    if (!user && isProtected) {
        return NextResponse.redirect(new URL("/home", req.url));
    }

    if (user && isUnprotected) {
        return NextResponse.redirect(new URL("/home", req.url));
    }

    return NextResponse.next();
}