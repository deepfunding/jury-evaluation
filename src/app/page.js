"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import {
	generatePairs,
	formatRepoName,
	isValidMultiplier,
} from "@/utils/pairwise";
import { seeds } from "@/data/seed";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { ChevronLeft, ChevronRight, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import { MOCK_USER_DATA } from "@/data/mockData";
import { ScrollText, ListChecks, Users } from "lucide-react";
import { CurrentRoundEvaluations } from "@/components/CurrentRoundEvaluations";
import { AllEvaluationsList } from "@/components/AllEvaluationsList";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const isDev = process.env.NODE_ENV === "development";

export default function Home() {
	const [inviteCode, setInviteCode] = useState(
		isDev ? MOCK_USER_DATA.inviteCode : "",
	);
	const [error, setError] = useState("");
	const [isValidated, setIsValidated] = useState(false);
	const [pairs, setPairs] = useState([]);
	const [currentPairIndex, setCurrentPairIndex] = useState(0);
	const [selectedChoice, setSelectedChoice] = useState(null);
	const [multiplier, setMultiplier] = useState("");
	const [comparisons, setComparisons] = useState([]);
	const [comparisonRowNumbers, setComparisonRowNumbers] = useState([]);
	const [showSuccessDialog, setShowSuccessDialog] = useState(false);
	const [showReviewPanel, setShowReviewPanel] = useState(false);
	const [userData, setUserData] = useState({
		name: isDev ? MOCK_USER_DATA.name : "",
		email: isDev ? MOCK_USER_DATA.email : "",
		inviteCode: isDev ? MOCK_USER_DATA.inviteCode : "",
	});
	const [reasoning, setReasoning] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isAllCompleted, setIsAllCompleted] = useState(false);
	const [showSuccessMessage, setShowSuccessMessage] = useState(false);
	const [round, setRound] = useState(1);
	const [showContinueDialog, setShowContinueDialog] = useState(false);
	const [currentReviewRound, setCurrentReviewRound] = useState(1);
	const [isEditMode, setIsEditMode] = useState(false);
	const [originalRound, setOriginalRound] = useState(null);
	const [originalIndex, setOriginalIndex] = useState(null);
	const [roundPairs, setRoundPairs] = useState({});
	const [showSaveDialog, setShowSaveDialog] = useState(false);
	const [isSaved, setIsSaved] = useState(false);
	const [pagination, setPagination] = useState(null);
	const [currentView, setCurrentView] = useState("evaluation");
	const [selectedFilterRepo, setSelectedFilterRepo] = useState(null);

	const [allEvaluations, setAllEvaluations] = useState([]);
	const [currentPairEvaluations, setCurrentPairEvaluations] = useState({});

	const [submissionStatus, setSubmissionStatus] = useState({
		isSubmitting: false,
		message: "",
	});

	const [isTransitioning, setIsTransitioning] = useState(false);

	const [showEvaluations, setShowEvaluations] = useState(false);

	const handleValidate = async (e) => {
		e.preventDefault();
		setError("");

		if (!inviteCode.trim()) {
			setError("Please enter an invite code");
			return;
		}

		if (!userData.name.trim() || !userData.email.trim()) {
			setError("Please enter your name and email");
			return;
		}

		try {
			const response = await fetch("/api/auth", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ inviteCode }),
			});

			const data = await response.json();

			if (!response.ok) {
				setError(data.error || "Invalid input. Please try again.");
				return;
			}

			const updatedUserData = {
				...userData,
				inviteCode,
			};
			setUserData(updatedUserData);
			setIsValidated(true);
			const initialPairs = generatePairs(seeds, 5);
			setPairs(initialPairs);
			setRoundPairs({ 1: initialPairs });
		} catch (error) {
			console.error("Validation error:", error);
			setError("Something went wrong. Please try again.");
		}
	};

	const handleUserDataChange = (e) => {
		const { name, value } = e.target;
		setUserData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleChoiceSelect = (choice) => {
		setSelectedChoice(choice);
		setError("");
	};

	const handleEditComparison = (index) => {
		const comparison = comparisons[index];

		// 해당 라운드의 모든 비교 데이터 가져오기
		const roundComparisons = comparisons.filter(
			(c) => c.round === comparison.round,
		);

		// 현재 편집하려는 비교의 순서 찾기
		const comparisonOrder =
			roundComparisons.findIndex(
				(c) =>
					c.itemAIndex === comparison.itemAIndex &&
					c.itemBIndex === comparison.itemBIndex,
			) + 1;

		// Store original state (한 번만 설정)
		setOriginalRound(round);
		setOriginalIndex(currentPairIndex);

		// Create pairs based on the original comparison
		const editPairs = [
			[seeds[comparison.itemAIndex], seeds[comparison.itemBIndex]],
		];

		// Store current pairs if not already stored
		if (!roundPairs[round]) {
			setRoundPairs((prev) => ({ ...prev, [round]: pairs }));
		}

		// 상태 업데이트를 한 번에 처리
		setRound(comparison.round);
		setPairs(editPairs);
		setCurrentPairIndex(0);
		setSelectedChoice(comparison.choice);
		setMultiplier(comparison.multiplier.toString());
		setReasoning(comparison.reasoning);
		setShowReviewPanel(false);
		setIsAllCompleted(false);
		setIsEditMode(true);
		setError("");
		setCurrentView("evaluation");
	};

	const handleViewChange = (view) => {
		if (view === "evaluation") {
			// 현재 라운드의 완료된 비교 수를 확인
			const currentRoundComparisons = comparisons.filter(
				(c) => c.round === round,
			);

			if (currentRoundComparisons.length === 5) {
				// 현재 라운드가 완료된 상태
				setShowReviewPanel(true);
				setCurrentReviewRound(round);
			} else {
				// 현재 라운드가 진행 중인 상태
				setShowReviewPanel(false);

				// 첫 번째 미완료 항목으로 이동
				const nextIncompleteIndex = pairs.findIndex((pair, index) => {
					return !currentRoundComparisons.some(
						(c) =>
							c.itemAIndex === seeds.indexOf(pair[0]) &&
							c.itemBIndex === seeds.indexOf(pair[1]),
					);
				});

				if (nextIncompleteIndex === -1) {
					// 모든 비교가 완료된 경우 (이론적으로는 여기 올 수 없음)
					setShowReviewPanel(true);
					setCurrentReviewRound(round);
				} else {
					setCurrentPairIndex(nextIncompleteIndex);
				}
			}
		}
		setCurrentView(view);
	};

	const handleNext = async () => {
		if (!selectedChoice) {
			setError("Please select a repository");
			return;
		}

		if (!isValidMultiplier(multiplier)) {
			setError("Please enter a valid multiplier between 1 and 999");
			return;
		}

		if (!reasoning.trim()) {
			setError("Please provide your reasoning for this comparison");
			return;
		}

		// Create comparison data
		const currentPair = pairs[currentPairIndex];
		const choice = selectedChoice;
		const multiplierValue = parseFloat(multiplier);
		const logMultiplierValue =
			choice === 2 ? Math.log(multiplierValue) : -Math.log(multiplierValue);

		const newComparison = {
			itemAIndex: seeds.indexOf(currentPair[0]),
			itemBIndex: seeds.indexOf(currentPair[1]),
			itemAName: formatRepoName(currentPair[0]),
			itemBName: formatRepoName(currentPair[1]),
			choice,
			multiplier: multiplierValue,
			logMultiplier: logMultiplierValue,
			reasoning: reasoning.trim(),
			round: round,
		};

		// Start submission in background
		setSubmissionStatus({
			isSubmitting: true,
			message: "Submitting response...",
		});

		try {
			// Find if there's an existing comparison
			const existingIndex = comparisons.findIndex(
				(c) =>
					c.round === round &&
					c.itemAIndex === newComparison.itemAIndex &&
					c.itemBIndex === newComparison.itemBIndex,
			);

			const existingRowNumber =
				existingIndex !== -1 ? comparisonRowNumbers[existingIndex] : undefined;

			// Update local state immediately
			const newComparisons = [...comparisons];
			const newComparisonRowNumbers = [...comparisonRowNumbers];

			if (existingIndex !== -1) {
				newComparisons[existingIndex] = newComparison;
			} else {
				newComparisons.push(newComparison);
				newComparisonRowNumbers.push(null); // Will be updated after API response
			}

			setComparisons(newComparisons);
			setComparisonRowNumbers(newComparisonRowNumbers);

			// Add transition effect
			setIsTransitioning(true);

			// Update UI state immediately
			const currentRoundComparisons = newComparisons.filter(
				(c) => c.round === round
			);
			
			if (currentRoundComparisons.length === 5) {
        setIsEditMode(false);
				setShowReviewPanel(true);
				setCurrentReviewRound(round);
			} else if (isEditMode) {
				setRound(originalRound);
				setPairs(roundPairs[originalRound]);
				setCurrentPairIndex(originalIndex);
				setIsEditMode(false);
				setOriginalRound(null);
				setOriginalIndex(null);
				setSelectedChoice(null);
				setMultiplier("");
				setReasoning("");
			} else {
				setCurrentPairIndex(currentPairIndex + 1);
				setSelectedChoice(null);
				setMultiplier("");
				setReasoning("");
			}

			// Reset evaluations panel
			setShowEvaluations(false);
			setError("");

			setTimeout(() => {
				setIsTransitioning(false);
			}, 300);

			const response = await fetch("/api/submit-comparison", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					userData,
					comparison: newComparison,
					existingRowNumber,
				}),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || "Failed to submit comparison");
			}

			const responseData = await response.json();
			const newRowNumber = responseData.rowNumber;

			// Update row numbers after successful submission
			const finalComparisonRowNumbers = [...newComparisonRowNumbers];
			if (existingIndex !== -1) {
				finalComparisonRowNumbers[existingIndex] = newRowNumber;
			} else {
				finalComparisonRowNumbers[finalComparisonRowNumbers.length - 1] = newRowNumber;
			}
			setComparisonRowNumbers(finalComparisonRowNumbers);

			setSubmissionStatus({
				isSubmitting: false,
				message: "Response uploaded successfully!",
			});

			setTimeout(() => {
				setSubmissionStatus({ isSubmitting: false, message: "" });
			}, 3000);
		} catch (error) {
			console.error("Submit error:", error);
			setSubmissionStatus({
				isSubmitting: false,
				message: "Failed to submit response. Please try again.",
			});

			setTimeout(() => {
				setSubmissionStatus({ isSubmitting: false, message: "" });
			}, 3000);
		}
	};

	const handleContinue = () => {
		const newRound = round + 1;
		const newPairs = generatePairs(seeds, 5);
		setPairs(newPairs);
		setRoundPairs((prev) => ({ ...prev, [newRound]: newPairs }));
		setRound(newRound);
		setCurrentPairIndex(0);
		setSelectedChoice(null);
		setMultiplier("");
		setReasoning("");
		setIsAllCompleted(false);
		setShowContinueDialog(false);
		setShowReviewPanel(false);
		setError("");
	};

	const handleFinish = () => {
		setShowSuccessDialog(true);
		setShowContinueDialog(false);
	};

	const handleRefreshPairs = () => {
		// Generate new pairs
		const newPairs = generatePairs(seeds, 5);

		// Find existing comparisons for current round
		const currentRoundComparisons = comparisons.filter(
			(c) => c.round === round,
		);

		// Remove existing comparisons for the current pair index if it exists
		const updatedComparisons = comparisons.filter(
			(c) =>
				!(
					c.round === round &&
					c.itemAIndex === seeds.indexOf(pairs[currentPairIndex][0]) &&
					c.itemBIndex === seeds.indexOf(pairs[currentPairIndex][1])
				),
		);

		// Update pairs and state
		setPairs(newPairs);
		setRoundPairs((prev) => ({ ...prev, [round]: newPairs }));
		setComparisons(updatedComparisons);
		setSelectedChoice(null);
		setMultiplier("");
		setReasoning("");
		setError("");
	};

	const handleSaveResult = () => {
		setShowSaveDialog(true);
		setIsSaved(true);
	};

	const ComparisonReviewPanel = () => {
		const roundComparisons = comparisons.filter(
			(comparison) => comparison.round === currentReviewRound,
		);

		const availableRounds = Array.from(
			new Set(comparisons.map((comparison) => comparison.round)),
		).sort((a, b) => a - b);

		const currentRoundPairs = roundPairs[currentReviewRound] || [];
		const isCurrentRoundComplete = useMemo(() => {
			const roundComparisons = comparisons.filter(
				(comparison) => comparison.round === currentReviewRound,
			);
			return roundComparisons.length === 5;
		}, [comparisons, currentReviewRound]);

		// Only show completed comparisons and the current one being worked on
		const displayComparisons = roundComparisons
			.map((comparison) => ({
				...comparison,
				index: currentRoundPairs.findIndex(
					(pair) =>
						seeds.indexOf(pair[0]) === comparison.itemAIndex &&
						seeds.indexOf(pair[1]) === comparison.itemBIndex,
				),
			}))
			.sort((a, b) => a.index - b.index);

		// Add current incomplete comparison if in current round and not all comparisons are complete
		if (
			currentReviewRound === round &&
			currentPairIndex < 5 &&
			!isCurrentRoundComplete
		) {
			const currentPair = currentRoundPairs[currentPairIndex];
			if (currentPair) {
				const existingComparison = roundComparisons.find(
					(c) =>
						c.itemAIndex === seeds.indexOf(currentPair[0]) &&
						c.itemBIndex === seeds.indexOf(currentPair[1]),
				);

				if (!existingComparison) {
					displayComparisons.push({
						index: currentPairIndex,
						itemAName: formatRepoName(currentPair[0]),
						itemBName: formatRepoName(currentPair[1]),
						isIncomplete: true,
						id: `incomplete-${currentPairIndex}`,
					});
				}
			}
		}

		return (
			<div className="space-y-6">
				<Card className="max-w-2xl">
					<CardHeader className="space-y-4">
						<div className="space-y-2">
							<CardTitle>Thank you for your participation!</CardTitle>
							<p className="text-sm text-muted-foreground">
								You can review and edit your previous responses below.
							</p>
						</div>
						<div className="flex justify-between items-center">
							<h3 className="text-lg font-medium">
								Round {currentReviewRound}
							</h3>
						</div>
						{currentReviewRound === round && (
							<p className="text-sm text-muted-foreground">
								{isCurrentRoundComplete
									? "All comparisons for this round are successfully submitted."
									: `${roundComparisons.length} of 5 comparisons completed in this round.`}
							</p>
						)}
						{currentReviewRound === round &&
							!isEditMode &&
							isCurrentRoundComplete && (
								<div className="flex justify-end items-center gap-4 pt-4">
									{!isSaved && (
										<Button
											variant="outline"
											onClick={handleSaveResult}
											className="px-8"
										>
											Save Responses
										</Button>
									)}
									{currentView === "evaluation" && (
										<Button
											onClick={handleContinue}
											className="px-8 bg-green-600 hover:bg-green-700"
										>
											Continue Evaluation
										</Button>
									)}
								</div>
							)}
					</CardHeader>
					<CardContent className="space-y-4">
						{displayComparisons.map((comparison) => (
							<Card
								key={
									comparison.isIncomplete
										? comparison.id
										: `${comparison.round}-${comparison.itemAIndex}-${comparison.itemBIndex}`
								}
								className="p-4"
							>
								<div className="flex justify-between items-start">
									<div className="space-y-2">
										{comparison.isIncomplete ? (
											<p className="text-sm text-muted-foreground">
												Currently comparing {comparison.itemAName} with{" "}
												{comparison.itemBName}
											</p>
										) : (
											<>
												<span className="text-sm text-muted-foreground">
													<span className="text-primary">
														{comparison.choice === 1
															? comparison.itemAName
															: comparison.itemBName}
													</span>{" "}
													is{" "}
													<span className="text-primary">
														{comparison.multiplier}x
													</span>{" "}
													more valuable to the success of Ethereum than{" "}
													<span className="text-primary">
														{comparison.choice === 1
															? comparison.itemBName
															: comparison.itemAName}
													</span>
												</span>
												<p className="text-sm">{comparison.reasoning}</p>
											</>
										)}
									</div>
									{!comparison.isIncomplete && (
										<Button
											variant="outline"
											onClick={() =>
												handleEditComparison(
													comparisons.findIndex(
														(c) =>
															c.round === currentReviewRound &&
															c.itemAIndex === comparison.itemAIndex &&
															c.itemBIndex === comparison.itemBIndex,
													),
												)
											}
										>
											Edit
										</Button>
									)}
									{comparison.isIncomplete && (
										<Button
											onClick={() => {
												setShowReviewPanel(false);
												setCurrentPairIndex(comparison.index);
												setCurrentView("evaluation");
											}}
										>
											Continue
										</Button>
									)}
								</div>
							</Card>
						))}

						<div className="space-y-6 mt-8 pt-4 border-t">
							<div className="flex justify-center gap-2">
								{availableRounds.map((r) => (
									<Button
										key={r}
										variant={currentReviewRound === r ? "default" : "outline"}
										onClick={() => setCurrentReviewRound(r)}
										className="w-10 h-10 p-0"
									>
										{r}
									</Button>
								))}
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	};

	const fetchAllEvaluations = useCallback(async () => {
		try {
			const response = await fetch("/api/get-previous-comparisons", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ repoA: null, repoB: null }),
			});

			if (!response.ok) {
				throw new Error("Failed to fetch evaluations");
			}

			const data = await response.json();
			setAllEvaluations(data.comparisons);
		} catch (error) {
			console.error("Error fetching evaluations:", error);
		}
	}, []);

	useEffect(() => {
		if (currentView === "all-evaluations" && allEvaluations.length === 0) {
			fetchAllEvaluations();
		}
	}, [currentView, allEvaluations.length, fetchAllEvaluations]);

	const filteredEvaluations = useMemo(() => {
		if (!selectedFilterRepo) return allEvaluations;

		return allEvaluations.filter(
			(evaluation) =>
				evaluation.itemAName === selectedFilterRepo ||
				evaluation.itemBName === selectedFilterRepo,
		);
	}, [allEvaluations, selectedFilterRepo]);

	// 현재 페어에 대한 평가 데이터 가져오기
	const fetchPairEvaluations = useCallback(
		async (pairKey) => {
			try {
				const repoA = formatRepoName(pairs[currentPairIndex][0]);
				const repoB = formatRepoName(pairs[currentPairIndex][1]);

				// 이미 캐시된 데이터가 있다면 사용
				if (currentPairEvaluations[pairKey]) {
					return;
				}

				const response = await fetch("/api/get-previous-comparisons", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ repoA, repoB }),
				});

				if (!response.ok) {
					throw new Error("Failed to fetch evaluations");
				}

				const data = await response.json();
				setCurrentPairEvaluations((prev) => ({
					...prev,
					[pairKey]: data.comparisons,
				}));
			} catch (error) {
				console.error("Error fetching pair evaluations:", error);
			}
		},
		[pairs, currentPairIndex, currentPairEvaluations],
	);

	// 현재 페어가 변경될 때마다 데이터 가져오기
	useEffect(() => {
		if (pairs[currentPairIndex]) {
			const repoA = formatRepoName(pairs[currentPairIndex][0]);
			const repoB = formatRepoName(pairs[currentPairIndex][1]);
			const pairKey = `${repoA}-${repoB}`;
			fetchPairEvaluations(pairKey);
		}
	}, [currentPairIndex, pairs, fetchPairEvaluations]);

	const SubmissionStatus = () => {
		if (!submissionStatus.message) return null;

		return (
			<div className="fixed bottom-4 right-4 p-4 rounded-md shadow-lg bg-white border">
				<div className="flex items-center gap-2">
					{submissionStatus.isSubmitting && (
						<Loader2 className="h-4 w-4 animate-spin" />
					)}
					<span
						className={`text-sm ${
							submissionStatus.isSubmitting
								? "text-gray-600"
								: submissionStatus.message.includes("successfully")
									? "text-green-600"
									: "text-red-600"
						}`}
					>
						{submissionStatus.message}
					</span>
				</div>
			</div>
		);
	};

	const getCurrentComparisonNumber = () => {
		const currentRoundComparisons = comparisons.filter(
			(c) => c.round === round
		);
		return currentRoundComparisons.length + 1;
	};

	return (
		<div className="container mx-auto p-8">
			{!isValidated ? (
				<div className="mb-8">
					<h2 className="text-lg font-semibold mb-4 text-muted-foreground">
						Enter your information to start
					</h2>
					<form onSubmit={handleValidate} className="space-y-4 max-w-md">
						<div className="space-y-2">
							<Label htmlFor="name">Name</Label>
							<Input
								id="name"
								name="name"
								value={userData.name}
								onChange={handleUserDataChange}
								placeholder="Enter your name"
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								name="email"
								type="email"
								value={userData.email}
								onChange={handleUserDataChange}
								placeholder="Enter your email"
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="inviteCode">Invite Code</Label>
							<div className="flex gap-4">
								<Input
									id="inviteCode"
									type="text"
									value={inviteCode}
									onChange={(e) => setInviteCode(e.target.value)}
									placeholder="Enter your invite code"
									required
								/>
								<Button type="submit" disabled={isSubmitting}>
									{isSubmitting ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											<span>Validating...</span>
										</>
									) : (
										"Start"
									)}
								</Button>
							</div>
						</div>
					</form>
					{error && (
						<Alert
							variant={
								error.includes("already submitted") ? "default" : "destructive"
							}
							className="mt-4 max-w-md"
						>
							<AlertDescription>
								{error.includes("already submitted") ? (
									<>
										A response has already been submitted using this invite
										code.
										<br />
										Each invite code can only be used once for submission.
									</>
								) : (
									error
								)}
							</AlertDescription>
						</Alert>
					)}
				</div>
			) : showSuccessDialog ? (
				<Card className="max-w-2xl mx-auto">
					<CardHeader>
						<CardTitle>Thank You!</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="text-center">
							<p>You have completed {round} rounds of comparisons.</p>
							<p>Total comparisons made: {comparisons.length}</p>
							<p className="text-sm text-muted-foreground mt-2">
								Thank you for your valuable contribution!
							</p>
						</div>
						<div className="flex justify-center mt-4">
							<Button onClick={() => window.close()}>Close</Button>
						</div>
					</CardContent>
				</Card>
			) : (
				<div className="flex gap-8">
					<div className="flex flex-col gap-6 w-[200px]">
						<div className="space-y-2">
							<h3 className="font-medium text-sm text-muted-foreground px-3">
								My Evaluation
							</h3>
							<div className="space-y-1">
								<Button
									variant={currentView === "evaluation" ? "default" : "outline"}
									className="justify-start w-full"
									onClick={() => handleViewChange("evaluation")}
								>
									<ScrollText className="mr-2 h-4 w-4" />
									Ongoing
								</Button>
								<Button
									variant={currentView === "review" ? "default" : "outline"}
									className="justify-start w-full"
									onClick={() => handleViewChange("review")}
									disabled={comparisons.filter((c) => c.round === round).length === 5}
								>
									<ListChecks className="mr-2 h-4 w-4" />
									Review
								</Button>
							</div>
						</div>

						<div className="space-y-2">
							<h3 className="font-medium text-sm text-muted-foreground px-3">
								Others' Evaluations
							</h3>
							<Button
								variant={
									currentView === "all-evaluations" ? "default" : "outline"
								}
								className="justify-start w-full"
								onClick={() => handleViewChange("all-evaluations")}
							>
								<Users className="mr-2 h-4 w-4" />
								Browse All
							</Button>
						</div>
					</div>

					<div className="flex-1">
						{currentView === "evaluation" && (
							<div>
								<div className="flex flex-col gap-4 mb-4">
									<div className="flex justify-between items-center">
										<h2 className="text-lg font-semibold text-muted-foreground">
											Round {round} - Compare Dependencies
										</h2>
									</div>
									<div className="flex items-baseline">
										<span className="text-sm text-muted-foreground w-[600px]">
											You've completed{" "}
											<span className="text-primary">
												{" "}
												{`${comparisons.length}`}{" "}
											</span>{" "}
											{`${
												comparisons.length === 1 ? "comparison" : "comparisons"
											}`}
											. All responses are automatically saved.
											{round >= 2 && (
												<>
													<br />
													You can finish now or continue with more comparisons.
														Use the review button to check or edit your previous
														responses.
												</>
											)}
										</span>
									</div>
								</div>

								{showReviewPanel ? (
									<ComparisonReviewPanel />
								) : (
									<div className="flex gap-12">
										<Card
											className={`w-[600px] transition-opacity duration-150 ${
												isTransitioning ? "opacity-60" : "opacity-100"
											}`}
										>
											<CardHeader>
												<CardTitle className="flex justify-between items-center">
													<span>
														{isEditMode
															? `Editing Round ${round} - Comparison ${
																	comparisons
																		.filter((c) => c.round === round)
																		.findIndex(
																			(c) =>
																				c.itemAIndex ===
																					seeds.indexOf(pairs[0][0]) &&
																				c.itemBIndex ===
																					seeds.indexOf(pairs[0][1]),
																		) + 1
																} of 5`
															: `Comparison ${getCurrentComparisonNumber()} of 5`}
													</span>
													{!isEditMode && (
														<Button
															variant="secondary"
															size="sm"
															onClick={handleRefreshPairs}
															disabled={isSubmitting}
															className="bg-gray-100 hover:bg-gray-200"
														>
															<RefreshCw className="h-4 w-4 mr-2" />
															Refresh Pairs
														</Button>
													)}
												</CardTitle>
											</CardHeader>
											<CardContent className="space-y-6">
												<div className="space-y-6">
													<div className="space-y-4">
														<p className="text-lg text-center mb-8">
															Which dependency has been more valuable to the
															success of Ethereum?
														</p>
														<div className="grid grid-cols-2 gap-8">
															{[0, 1].map((index) => (
																<div 
																	key={index}
																	className={`relative transition-all duration-200 ${
																		selectedChoice === index + 1 
																			? 'ring-2 ring-primary ring-offset-2' 
																			: 'hover:shadow-md'
																	}`}
																>
																	<div className="p-6 rounded-lg border bg-card">
																		<div className="space-y-4">
																			<div className="flex items-center justify-center">
																				<TooltipProvider>
																					<Tooltip>
																						<TooltipTrigger asChild>
																							<a
																								href={pairs[currentPairIndex][index]}
																								target="_blank"
																								rel="noopener noreferrer"
																								className="text-xl font-medium text-primary hover:underline text-center"
																							>
																								{formatRepoName(pairs[currentPairIndex][index])}
																							</a>
																						</TooltipTrigger>
																						<TooltipContent>
																							<span>Click to open GitHub repository in a new tab</span>
																						</TooltipContent>
																					</Tooltip>
																				</TooltipProvider>
																			</div>
																			<Button
																				variant={selectedChoice === index + 1 ? "default" : "outline"}
																				onClick={() => handleChoiceSelect(index + 1)}
																				className="w-full mt-4"
																				disabled={isSubmitting}
																			>
																				{selectedChoice === index + 1 ? "Selected" : "Select"}
																			</Button>
																		</div>
																	</div>
																</div>
															))}
														</div>
													</div>

													<div className="space-y-6 mt-8 pt-8 border-t">
														<div className="space-y-4">
															<div className="space-y-2">
																<Label className="text-base">Credit Multiplier</Label>
																<p className="text-sm text-muted-foreground">
																	Enter how many times more credit the selected project deserves (1-999)
																</p>
																<div className="flex gap-4 items-center">
																	<Input
																		type="number"
																		value={multiplier}
																		onChange={(e) =>
																			setMultiplier(e.target.value)
																		}
																		placeholder="Enter a number (1-999)"
																		className="max-w-[200px]"
																		min="1"
																		max="999"
																		step="0.01"
																		disabled={isSubmitting}
																	/>
																</div>
															</div>

															<div className="space-y-2">
																<Label htmlFor="reasoning" className="text-base">Reasoning</Label>
																<p className="text-sm text-muted-foreground">
																	Please explain your choice and the multiplier value (~200 words)
																</p>
																<Textarea
																	id="reasoning"
																	value={reasoning}
																	onChange={(e) => setReasoning(e.target.value)}
																	className="h-32"
																	placeholder="Enter your reasoning..."
																	disabled={isSubmitting}
																/>
															</div>

															<div className="flex flex-col items-center">
																<Button
																	onClick={handleNext}
																	disabled={isSubmitting}
																	className="px-6 bg-green-600 hover:bg-green-700"
																>
																	{isSubmitting ? (
																		<>
																			<Loader2 className="mr-2 h-4 w-4 animate-spin" />
																			<span>Submitting...</span>
																		</>
																	) : (
																		"Next"
																	)}
																</Button>
																{showSuccessMessage && (
																	<span className="text-sm text-green-600">
																		Previous response recorded successfully
																	</span>
																)}
															</div>
														</div>
													</div>
												</div>

												{error && (
													<Alert variant="destructive">
														<AlertDescription>{error}</AlertDescription>
													</Alert>
												)}
											</CardContent>
										</Card>

										<div className="w-[400px]">
											<Card>
												<CardHeader className="pb-3">
													<TooltipProvider>
														<Tooltip>
															<TooltipTrigger asChild>
																<div>
																	<Button
																		variant="outline"
																		className={`w-full flex justify-between items-center ${
																			currentPairEvaluations[
																				`${formatRepoName(pairs[currentPairIndex][0])}-${formatRepoName(pairs[currentPairIndex][1])}`
																			]?.length 
																				? "bg-blue-50 hover:bg-blue-100 border-blue-200" 
																				: ""
																		}`}
																		onClick={() => setShowEvaluations(!showEvaluations)}
																		disabled={!currentPairEvaluations[
																			`${formatRepoName(pairs[currentPairIndex][0])}-${formatRepoName(pairs[currentPairIndex][1])}`
																		]?.length}
																	>
																		<div className="flex items-center gap-2">
																			<Users className="h-4 w-4" />
																			<span>View Other Evaluations</span>
																		</div>
																		{showEvaluations ? (
																			<ChevronUp className="h-4 w-4" />
																		) : (
																			<ChevronDown className="h-4 w-4" />
																		)}
																	</Button>
																</div>
															</TooltipTrigger>
															<TooltipContent>
																{!currentPairEvaluations[
																	`${formatRepoName(pairs[currentPairIndex][0])}-${formatRepoName(pairs[currentPairIndex][1])}`
																]?.length 
																	? "No evaluations available for this pair yet"
																	: "Click to view other evaluations"
																}
															</TooltipContent>
														</Tooltip>
													</TooltipProvider>
												</CardHeader>
												{showEvaluations && (
													<CardContent>
														<CurrentRoundEvaluations
															repoA={formatRepoName(pairs[currentPairIndex][0])}
															repoB={formatRepoName(pairs[currentPairIndex][1])}
															evaluations={
																currentPairEvaluations[
																	`${formatRepoName(pairs[currentPairIndex][0])}-${formatRepoName(pairs[currentPairIndex][1])}`
																]
															}
														/>
													</CardContent>
												)}
											</Card>
										</div>
									</div>
								)}
							</div>
						)}

						{currentView === "review" && (
							<div>
								<h2 className="text-lg font-semibold text-muted-foreground mb-4">
									Review Your Evaluations
								</h2>
								<ComparisonReviewPanel />
							</div>
						)}

						{currentView === "all-evaluations" && (
							<div>
								<div className="flex flex-col gap-4">
									<div className="space-y-2">
										<h2 className="text-lg font-semibold text-muted-foreground">
											All Previous Evaluations
										</h2>
										<span className="text-sm text-muted-foreground">
											Showing{" "}
											<span className="text-primary">
												{`${filteredEvaluations.length}`}{" "}
											</span>{" "}
											of{" "}
											<span className="text-primary">
												{`${allEvaluations.length}`}{" "}
											</span>{" "}
											total evaluations
										</span>
									</div>

									<Card>
										<CardContent className="pt-6">
											<div className="space-y-4">
												<div className="space-y-2">
													<Label>Filter by Project</Label>
													<p className="text-sm text-muted-foreground">
														Select a project to see all its comparisons with
														other projects
													</p>
													<select
														className="w-[300px] p-2 border rounded"
														onChange={(e) =>
															setSelectedFilterRepo(e.target.value)
														}
														value={selectedFilterRepo || ""}
													>
														<option value="">All Projects</option>
														{seeds.map((repo, index) => (
															<option key={index} value={formatRepoName(repo)}>
																{formatRepoName(repo)}
															</option>
														))}
													</select>
												</div>

												<AllEvaluationsList
													comparisons={filteredEvaluations}
													onPaginationChange={setPagination}
													selectedFilterRepo={selectedFilterRepo}
												/>
											</div>
										</CardContent>
									</Card>
								</div>
							</div>
						)}
					</div>
				</div>
			)}

			<Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="text-xl">
							Results Saved Successfully
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-3 pt-4">
						<div className="text-sm">
							Your responses have been saved successfully.
						</div>
						<div className="text-sm text-muted-foreground">
							You can continue evaluating more pairs or review and edit your
							previous responses anytime.
						</div>
					</div>
					<div className="flex justify-end pt-4">
						<Button
							variant="outline"
							onClick={() => {
								setShowSaveDialog(false);
								setIsSaved(false);
							}}
							className="px-8"
						>
							Close
						</Button>
					</div>
				</DialogContent>
			</Dialog>
			<SubmissionStatus />
		</div>
	);
}
