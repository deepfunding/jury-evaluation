import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { getComparisonResult } from "@/utils/comparisonUtils";

const ITEMS_PER_PAGE = 5;

export function AllEvaluationsList({
	comparisons,
	onPaginationChange,
	selectedFilterRepo,
}) {
	const [currentPage, setCurrentPage] = useState(1);

	useEffect(() => {
		setCurrentPage(1);
	}, [selectedFilterRepo]);

	const totalPages = Math.ceil(comparisons.length / ITEMS_PER_PAGE);

	useEffect(() => {
		const totalPages = Math.ceil(comparisons.length / ITEMS_PER_PAGE);
		const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
		const endIndex = startIndex + ITEMS_PER_PAGE;

		onPaginationChange?.({
			startIndex: startIndex + 1,
			endIndex: Math.min(endIndex, comparisons.length),
			total: comparisons.length,
		});
	}, [currentPage, comparisons.length, onPaginationChange]);

	if (comparisons.length === 0) {
		return (
			<div className="text-sm text-muted-foreground">No evaluations found.</div>
		);
	}

	const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
	const endIndex = startIndex + ITEMS_PER_PAGE;
	const currentComparisons = comparisons.slice(startIndex, endIndex);

	const getComparisonHeader = (comparison) => {
		if (selectedFilterRepo) {
			const otherProject =
				comparison.itemAName === selectedFilterRepo
					? comparison.itemBName
					: comparison.itemAName;

			return (
				<>
					<Badge
						variant="secondary"
						className="text-base normal-case font-normal bg-background"
					>
						{selectedFilterRepo}
					</Badge>
					<span className="mx-2 text-muted-foreground">vs</span>
					<Badge
						variant="secondary"
						className="text-base normal-case font-normal bg-background"
					>
						{otherProject}
					</Badge>
				</>
			);
		}

		return (
			<>
				<Badge
					variant="secondary"
					className="text-base normal-case font-normal bg-background"
				>
					{comparison.itemAName}
				</Badge>
				<span className="mx-2 text-muted-foreground">vs</span>
				<Badge
					variant="secondary"
					className="text-base normal-case font-normal bg-background"
				>
					{comparison.itemBName}
				</Badge>
			</>
		);
	};

	const getPageNumbers = () => {
		const pages = [];
		const maxVisiblePages = 5;
		let startPage = Math.max(1, currentPage - 2);
		let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

		if (endPage - startPage + 1 < maxVisiblePages) {
			startPage = Math.max(1, endPage - maxVisiblePages + 1);
		}

		for (let i = startPage; i <= endPage; i++) {
			pages.push(i);
		}

		return pages;
	};

	return (
		<div className="space-y-4">
			<div className="flex-1 space-y-3">
				{currentComparisons.map((comparison, index) => {
					const { moreValuableProject, lessValuableProject, multiplier } =
						getComparisonResult(comparison);

					return (
						<Card key={index} className="bg-muted/50">
							<CardContent className="pt-6 pb-4">
								<div className="border-b pb-3 mb-4">
									<h3 className="text-lg flex items-center">
										{getComparisonHeader(comparison)}
									</h3>
								</div>

								<div className="space-y-3">
									<div className="text-sm font-medium text-muted-foreground">
										Evaluator {startIndex + index + 1}
									</div>

									<div className="text-sm flex items-center gap-1">
										<span className="text-primary">{moreValuableProject}</span>
										<span className="text-muted-foreground">rated</span>
										<span className="text-primary">{multiplier}x</span>
										<span className="text-muted-foreground ml-1">
											more valuable than
										</span>
										<span className="text-primary ml-1">
											{lessValuableProject}
										</span>
									</div>

									<div className="space-y-1.5">
										<ScrollArea className="h-[80px] rounded-md border bg-background">
											<div className="p-3">
												<p className="text-sm text-muted-foreground">
													"{comparison.reasoning}"
												</p>
											</div>
										</ScrollArea>
									</div>
								</div>
							</CardContent>
						</Card>
					);
				})}
			</div>

			{totalPages > 1 && (
				<div className="flex justify-center items-center gap-2 pt-4 border-t">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
						disabled={currentPage === 1}
					>
						<ChevronLeft className="h-4 w-4" />
					</Button>

					{getPageNumbers().map((pageNum) => (
						<Button
							key={pageNum}
							variant={currentPage === pageNum ? "default" : "outline"}
							size="sm"
							className="w-8 h-8 p-0"
							onClick={() => setCurrentPage(pageNum)}
						>
							{pageNum}
						</Button>
					))}

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
	);
}
