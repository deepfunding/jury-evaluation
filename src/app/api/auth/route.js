export const runtime = "edge";

import { cookies } from "next/headers";
import { GoogleSheetsService } from "@/utils/googleSheets";

export async function POST(request) {
	try {
		const body = await request.json();
		const { inviteCode } = body;

		// Simple validation
		if (!inviteCode) {
			return new Response(
				JSON.stringify({ error: "Invite code is required" }),
				{
					status: 400,
					headers: {
						"Content-Type": "application/json",
					},
				},
			);
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

		return new Response(
			JSON.stringify({
				success: true,
				message: "Invite code is valid",
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
