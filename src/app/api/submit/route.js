export const runtime = "edge";

import { GoogleSheetsService } from "@/utils/googleSheets";

export async function POST(request) {
	try {
		const body = await request.json();
		const { userData, comparisons } = body;

		const sheetsService = new GoogleSheetsService();
		await sheetsService.submitAllComparisons(userData, comparisons);

		return new Response(
			JSON.stringify({
				success: true,
				message: "Comparisons submitted successfully",
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
				error: "Failed to submit comparisons",
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
