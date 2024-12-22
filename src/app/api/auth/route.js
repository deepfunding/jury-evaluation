export const runtime = "edge";

import { cookies } from "next/headers";

export async function POST(request) {
	try {
		const body = await request.json();
		const { name, email, uniqueKey } = body;

		// Simple validation
		if (!name || !email || !uniqueKey) {
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

		// Unique key validation
		const validKey = "DEMO2024";
		if (uniqueKey !== validKey) {
			return new Response(JSON.stringify({ error: "Invalid unique key" }), {
				status: 401,
				headers: {
					"Content-Type": "application/json",
				},
			});
		}

		// If all validations pass, set the cookie
		const cookieStore = cookies();
		cookieStore.set("userData", JSON.stringify({ name, email, uniqueKey }), {
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
