export const runtime = "edge";

import { NextResponse } from "next/server";
import { GoogleSheetsService } from "@/utils/googleSheets";

export async function POST(request) {
	try {
		const { repoA, repoB, includeReverse } = await request.json();

		const sheetsService = new GoogleSheetsService();
		const rows = await sheetsService.getPreviousComparisons(repoA, repoB);

		let comparisons = rows
			.filter((row) => {
				const matchForward = row.itemAName === repoA && row.itemBName === repoB;
				const matchReverse = row.itemAName === repoB && row.itemBName === repoA;

				if (repoA && repoB) {
					// If specific repos are provided, match either forward or reverse pairs
					return matchForward || matchReverse;
				}
				// If no specific repos, return all comparisons
				return true;
			})
			.map((row) => ({
				itemAName: row.itemAName,
				itemBName: row.itemBName,
				choice: row.choice,
				multiplier: parseFloat(row.multiplier),
				reasoning: row.reasoning,
			}));

		return NextResponse.json({ comparisons });
	} catch (error) {
		console.error("Error fetching comparisons:", error);
		return NextResponse.json(
			{ error: "Failed to fetch comparisons" },
			{ status: 500 },
		);
	}
}
