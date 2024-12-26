"use client";

import { useState, useEffect } from "react";
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
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";

export default function Home() {
	const [inviteCode, setInviteCode] = useState("");
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
		name: "",
		email: "",
		inviteCode: "",
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

		// Store original state
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
	};

	const handleNext = async () => {
		if (!selectedChoice) {
			setError("Please select a repository");
			return;
		}

		if (!isValidMultiplier(multiplier)) {
			setError("Please enter a valid multiplier between 1 and 10");
			return;
		}

		if (!reasoning.trim()) {
			setError("Please provide your reasoning for this comparison");
			return;
		}

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

		try {
			setIsSubmitting(true);

			// Find if there's an existing comparison for this round and index
			const existingIndex = comparisons.findIndex(
				(c) =>
					c.round === round &&
					c.itemAIndex === newComparison.itemAIndex &&
					c.itemBIndex === newComparison.itemBIndex,
			);

			const existingRowNumber =
				existingIndex !== -1 ? comparisonRowNumbers[existingIndex] : undefined;

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

			const newComparisons = [...comparisons];
			const newComparisonRowNumbers = [...comparisonRowNumbers];

			if (existingIndex !== -1) {
				// Update existing comparison
				newComparisons[existingIndex] = newComparison;
				newComparisonRowNumbers[existingIndex] = newRowNumber;
			} else {
				// Add new comparison
				newComparisons.push(newComparison);
				newComparisonRowNumbers.push(newRowNumber);
			}

			setComparisons(newComparisons);
			setComparisonRowNumbers(newComparisonRowNumbers);

			// Show success message temporarily
			setShowSuccessMessage(true);
			setTimeout(() => {
				setShowSuccessMessage(false);
			}, 2000);

			if (isEditMode) {
				// After successful edit, return to original state
				setRound(originalRound);
				setPairs(roundPairs[originalRound]);
				setCurrentPairIndex(originalIndex);
				setIsEditMode(false);
				setOriginalRound(null);
				setOriginalIndex(null);
				setSelectedChoice(null);
				setMultiplier("");
				setReasoning("");
				setShowReviewPanel(true);
				return;
			}

			// If we've completed all comparisons in this round
			if (currentPairIndex === pairs.length - 1) {
				setShowReviewPanel(true);
				setCurrentReviewRound(round);
				return;
			}

			// Move to next comparison
			setCurrentPairIndex(currentPairIndex + 1);
			setSelectedChoice(null);
			setMultiplier("");
			setReasoning("");
			setError("");
		} catch (error) {
			console.error("Submit error:", error);
			setError(error.message || "Failed to submit comparison");
		} finally {
			setIsSubmitting(false);
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
		const isCurrentRoundComplete = roundComparisons.length === 5;

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
			<Card className="max-w-2xl mb-8">
				<CardHeader className="space-y-4">
					<div className="space-y-2">
						<CardTitle>Thank you for your participation!</CardTitle>
						<p className="text-sm text-muted-foreground">
							You can review and edit your previous responses below.
						</p>
					</div>
					<div className="flex justify-between items-center">
						<h3 className="text-lg font-medium">Round {currentReviewRound}</h3>
						{!isAllCompleted && (
							<Button
								variant="outline"
								onClick={() => setShowReviewPanel(false)}
							>
								Close
							</Button>
						)}
					</div>
					{currentReviewRound === round && (
						<p className="text-sm text-muted-foreground">
							{isCurrentRoundComplete
								? "All comparisons for this round are successfully submitted."
								: `${roundComparisons.length} of 5 comparisons completed in this round.`}
						</p>
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
											<p className="text-sm text-muted-foreground">
												{comparison.choice === 1
													? comparison.itemAName
													: comparison.itemBName}{" "}
												is {comparison.multiplier}x more valuable to the success
												of Ethereum than{" "}
												{comparison.choice === 1
													? comparison.itemBName
													: comparison.itemAName}
											</p>
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
						<div className="flex justify-end items-center gap-4">
							{currentReviewRound === round &&
								!isEditMode &&
								isCurrentRoundComplete &&
								!isSaved && (
									<div className="flex items-center gap-4">
										<Button
											variant="outline"
											onClick={handleSaveResult}
											className="px-8"
										>
											Save Responses
										</Button>
										<Button
											onClick={handleContinue}
											className="px-8 bg-green-600 hover:bg-green-700"
										>
											Continue Evaluation
										</Button>
									</div>
								)}
						</div>
					</div>
				</CardContent>
			</Card>
		);
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
				<div>
					<div className="flex flex-col gap-4 mb-4">
						<div className="flex justify-between items-center">
							<h2 className="text-lg font-semibold text-muted-foreground">
								Round {round} - Compare Dependencies
							</h2>
							<Button
								variant="outline"
								onClick={() => {
									setShowReviewPanel(!showReviewPanel);
									setCurrentReviewRound(round);
								}}
							>
								{showReviewPanel ? "Hide Review" : "Show Review"}
							</Button>
						</div>
						<p className="text-sm text-muted-foreground">
							{`You've completed ${comparisons.length} ${
								comparisons.length === 1 ? "comparison" : "comparisons"
							}. All responses are automatically saved.`}
							{round >= 2 && (
								<>
									<br />
									You can finish now or continue with more comparisons. Use the
									review button to check or edit your previous responses.
								</>
							)}
						</p>
					</div>

					{showReviewPanel ? (
						<ComparisonReviewPanel />
					) : (
						<Card className="max-w-2xl">
							<CardHeader>
								<CardTitle className="flex justify-between items-center">
									<span>
										{isEditMode
											? `Editing Round ${round} - Comparison ${
													comparisons.findIndex(
														(c) =>
															c.round === round &&
															c.itemAIndex === seeds.indexOf(pairs[0][0]) &&
															c.itemBIndex === seeds.indexOf(pairs[0][1]),
													) + 1
												} of 5`
											: `Comparison ${(currentPairIndex % 5) + 1} of 5`}
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
										<p className="text-lg text-center">
											Which dependency has been more valuable to the success of
											Ethereum?
										</p>
										<div className="flex justify-center gap-4">
											<Button
												variant={selectedChoice === 1 ? "default" : "outline"}
												onClick={() => handleChoiceSelect(1)}
												className="flex-1 max-w-xs"
												disabled={isSubmitting}
											>
												{formatRepoName(pairs[currentPairIndex][0])}
											</Button>
											<Button
												variant={selectedChoice === 2 ? "default" : "outline"}
												onClick={() => handleChoiceSelect(2)}
												className="flex-1 max-w-xs"
												disabled={isSubmitting}
											>
												{formatRepoName(pairs[currentPairIndex][1])}
											</Button>
										</div>
									</div>

									<div className="space-y-4">
										<div className="space-y-2">
											<Label>Credit Multiplier</Label>
											<p className="text-sm text-muted-foreground">
												Enter how many times more credit the dependency you
												choose deserves (1-999)
											</p>
											<div className="flex gap-4 items-center">
												<Input
													type="number"
													value={multiplier}
													onChange={(e) => setMultiplier(e.target.value)}
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
											<Label htmlFor="reasoning">Reasoning</Label>
											<p className="text-sm text-muted-foreground">
												Please explain your choice and the multiplier value
												(~200 words)
											</p>
											<Textarea
												id="reasoning"
												value={reasoning}
												onChange={(e) => setReasoning(e.target.value)}
												className="h-32"
												disabled={isSubmitting}
											/>
										</div>

										<div className="flex flex-col items-center">
											<Button
												onClick={handleNext}
												disabled={isSubmitting}
												className="mb-2"
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

								{error && (
									<Alert variant="destructive">
										<AlertDescription>{error}</AlertDescription>
									</Alert>
								)}
							</CardContent>
						</Card>
					)}
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
		</div>
	);
}
