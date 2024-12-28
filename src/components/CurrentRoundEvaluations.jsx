import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";

const ITEMS_PER_PAGE = 3;

export function CurrentRoundEvaluations({ repoA, repoB, evaluations }) {
	const [currentPage, setCurrentPage] = useState(1);
	const [expandedReasoning, setExpandedReasoning] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const comparisons = evaluations || [];

	if (loading) {
		return (
			<div className="text-sm text-muted-foreground">
				Loading previous evaluations...
			</div>
		);
	}

	if (error) {
		return <div className="text-sm text-red-500">Error: {error}</div>;
	}

	const totalPages = Math.ceil(comparisons.length / ITEMS_PER_PAGE);
	const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
	const endIndex = startIndex + ITEMS_PER_PAGE;
	const currentComparisons = comparisons.slice(startIndex, endIndex);

	const truncateText = (text, maxLines = 2) => {
		const words = text.split(" ");
		const averageWordsPerLine = 12; // Approximate
		const maxWords = averageWordsPerLine * maxLines;

		if (words.length > maxWords) {
			return words.slice(0, maxWords).join(" ") + "...";
		}
		return text;
	};

	return (
		<div className="space-y-6">
			<CardHeader className="px-0 pt-0">
				<CardTitle className="text-lg font-medium text-muted-foreground">
					Other Evaluators' Insights
				</CardTitle>
				<p className="text-sm text-muted-foreground mt-1">
					{comparisons.length === 0
						? "No previous evaluations for this pair yet"
						: `${comparisons.length} evaluation${comparisons.length === 1 ? "" : "s"} found`}
				</p>
			</CardHeader>

			{comparisons.length > 0 && (
				<div className="space-y-4">
					<div className="flex-1 space-y-4">
						{currentComparisons.map((comparison, index) => {
							const chosenProject =
								comparison.choice === "A"
									? comparison.itemAName
									: comparison.itemBName;
							const multiplier = comparison.multiplier;
							const isExpanded = expandedReasoning === index;
							const truncatedReasoning = truncateText(comparison.reasoning);
							const needsExpansion =
								comparison.reasoning.length > truncatedReasoning.length;

							return (
								<Card key={index} className="bg-muted/50">
									<CardContent className="py-4">
										<div className="space-y-3">
											<div className="text-sm font-medium text-muted-foreground">
												Evaluator {startIndex + index + 1}
											</div>

											<div className="text-sm">
												<span className="text-primary">{chosenProject}</span>
												<span className="text-muted-foreground ml-1">
													rated
												</span>
												<span className="text-primary ml-1">{multiplier}x</span>
												<span className="text-muted-foreground ml-1">
													more valuable than
												</span>
												<span className="text-primary ml-1">
													{comparison.choice === "A"
														? comparison.itemBName
														: comparison.itemAName}
												</span>
											</div>

											<div className="space-y-1">
												<p className="text-sm text-muted-foreground">
													"
													{isExpanded
														? comparison.reasoning
														: truncatedReasoning}
													"
												</p>
												{needsExpansion && (
													<Button
														variant="link"
														className="text-xs p-0 h-auto"
														onClick={() =>
															setExpandedReasoning(isExpanded ? null : index)
														}
													>
														{isExpanded ? "Show less" : "Read more"}
													</Button>
												)}
											</div>
										</div>
									</CardContent>
								</Card>
							);
						})}
					</div>

					{totalPages > 1 && (
						<div className="flex justify-between items-center pt-2 border-t">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
								disabled={currentPage === 1}
							>
								<ChevronLeft className="h-4 w-4" />
							</Button>
							<div className="text-xs text-muted-foreground">
								Page {currentPage} of {totalPages}
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={() =>
									setCurrentPage((prev) => Math.min(totalPages, prev + 1))
								}
								disabled={currentPage === totalPages}
							>
								<ChevronRight className="h-4 w-4" />
							</Button>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
