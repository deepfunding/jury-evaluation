import { NextResponse } from "next/server";
import { GoogleSheetsService } from "@/utils/googleSheets";
import { MOCK_PREVIOUS_EVALUATIONS } from "@/data/mockData";

export async function POST(req) {
  try {
    const { repoA, repoB } = await req.json();
    
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({ comparisons: MOCK_PREVIOUS_EVALUATIONS });
    }
    
    const googleSheets = new GoogleSheetsService();
    const comparisons = await googleSheets.getPreviousComparisons(repoA, repoB);
    
    return NextResponse.json({ comparisons });
  } catch (error) {
    console.error("Error fetching previous comparisons:", error);
    return NextResponse.json(
      { error: "Failed to fetch previous comparisons" },
      { status: 500 }
    );
  }
} 
