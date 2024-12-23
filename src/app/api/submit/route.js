export const runtime = "edge";

import { GoogleSheetsService } from "@/utils/googleSheets";

export async function POST(request) {
	try {
		const body = await request.json();
		const { userData, comparisons } = body;

		// Prepare row data for each comparison
		const sheetsService = new GoogleSheetsService();

		// Submit each comparison as a separate row
		for (const comparison of comparisons) {
			const rowData = {
				timestamp: new Date().toISOString(),
				name: userData.name,
				email: userData.email,
				inviteCode: userData.inviteCode,
				itemAIndex: comparison.itemAIndex,
				itemBIndex: comparison.itemBIndex,
				itemAName: comparison.itemAName,
				itemBName: comparison.itemBName,
				choice: comparison.choice,
				multiplier: comparison.multiplier,
				logMultiplier: comparison.logMultiplier,
				reasoning: comparison.reasoning,
			};

			await sheetsService.submitRatings({
				userData,
				ratings: rowData,
			});
		}

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
