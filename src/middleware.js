import { NextResponse } from "next/server";

export function middleware(request) {
	if (request.nextUrl.pathname === "/scoring") {
		const userData = request.cookies.get("userData");
		if (!userData) {
			return NextResponse.redirect(new URL("/", request.url));
		}
	}
	return NextResponse.next();
}

export const config = {
	matcher: "/scoring",
};
