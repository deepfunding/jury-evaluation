export const runtime = "edge";

import { cookies } from "next/headers";
import { GoogleSheetsService } from "@/utils/googleSheets";

export async function POST(request) {
	try {
		const body = await request.json();
		const { name, email, inviteCode } = body;

		// Simple validation
		if (!name || !email || !inviteCode) {
			return new Response(
				JSON.stringify({ error: "All fields are required" }),
				{
					status: 400,
					headers: {
						"Content-Type": "application/json",
					},
				},
			);
		}

		// Email format validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return new Response(JSON.stringify({ error: "Invalid email format" }), {
				status: 400,
				headers: {
					"Content-Type": "application/json",
				},
			});
		}

		// Check invite code in Google Sheets
		const sheetsService = new GoogleSheetsService();
		const codeCheck = await sheetsService.findInviteCode(inviteCode);

		if (!codeCheck.isValid) {
			return new Response(JSON.stringify({ error: codeCheck.message }), {
				status: 401,
				headers: {
					"Content-Type": "application/json",
				},
			});
		}

		// If all validations pass, set the cookie
		const cookieStore = await cookies();
		cookieStore.set("userData", JSON.stringify({ name, email, inviteCode }), {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			path: "/",
			maxAge: 7200, // 2 hours
		});

		return new Response(
			JSON.stringify({
				success: true,
				message: "Authentication successful",
			}),
			{
				status: 200,
				headers: {
					"Content-Type": "application/json",
				},
			},
		);
	} catch (error) {
		console.error("Auth error:", error);
		return new Response(JSON.stringify({ error: "Internal server error" }), {
			status: 500,
			headers: {
				"Content-Type": "application/json",
			},
		});
	}
}
