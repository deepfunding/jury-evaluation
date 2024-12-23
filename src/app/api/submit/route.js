export const runtime = "edge";

import { GoogleSheetsService } from "@/utils/googleSheets";

export async function POST(request) {
	try {
		const body = await request.json();
		const sheetsService = new GoogleSheetsService();

		await sheetsService.submitRatings(body);

		return new Response(
			JSON.stringify({
				success: true,
				message: "Ratings submitted successfully",
			}),
			{
				status: 200,
				headers: {
					"Content-Type": "application/json",
				},
			},
		);
	} catch (error) {
		console.error("Submit error:", error);
		return new Response(
			JSON.stringify({
				success: false,
				error: "Failed to submit ratings",
			}),
			{
				status: 500,
				headers: {
					"Content-Type": "application/json",
				},
			},
		);
	}
}
