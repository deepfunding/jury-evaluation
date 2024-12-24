export const runtime = "edge";

import { GoogleSheetsService } from "@/utils/googleSheets";

export async function POST(request) {
	try {
		const body = await request.json();
		const { userData, comparison, existingRowNumber } = body;

		const sheetsService = new GoogleSheetsService();
		const result = await sheetsService.submitComparison(
			userData,
			comparison,
			existingRowNumber,
		);

		return new Response(
			JSON.stringify({
				success: true,
				message: "Comparison submitted successfully",
				rowNumber: result.rowNumber,
			}),
			{
				status: 200,
				headers: {
					"Content-Type": "application/json",
				},
			},
		);
	} catch (error) {
		console.error("Submit comparison error:", error);
		return new Response(
			JSON.stringify({
				success: false,
				error: "Failed to submit comparison",
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
