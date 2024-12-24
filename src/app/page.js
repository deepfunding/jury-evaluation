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

export default function Home() {
	const [inviteCode, setInviteCode] = useState("DEMO2024");
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
				body: JSON.stringify({
					inviteCode,
				}),
			});

			const data = await response.json();

			if (response.ok) {
				setIsValidated(true);
				setUserData((prev) => ({
					...prev,
					inviteCode,
				}));
				setPairs(generatePairs(seeds, 5));
			} else {
				setError(data.error || "Invalid input. Please try again.");
			}
		} catch (error) {
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
		setCurrentPairIndex(index);
		const comparison = comparisons[index];
		setSelectedChoice(comparison.choice);
		setMultiplier(comparison.multiplier.toString());
		setReasoning(comparison.reasoning);
		setShowReviewPanel(false);
		setIsAllCompleted(false);
		setError("");
	};

	const handleNext = async () => {
		if (showSuccessDialog) return;

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
		};

		try {
			setIsSubmitting(true);
			const existingRowNumber = comparisonRowNumbers[currentPairIndex];

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

			if (currentPairIndex < newComparisons.length) {
				newComparisons[currentPairIndex] = newComparison;
				newComparisonRowNumbers[currentPairIndex] = newRowNumber;
			} else {
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

			// If we've completed all comparisons
			if (newComparisons.length === pairs.length) {
				setIsAllCompleted(true);
				setShowReviewPanel(true);
				return;
			}

			// Find the next unentered pair index
			let nextIndex = currentPairIndex;
			if (currentPairIndex < pairs.length - 1) {
				// If we were editing a previous entry, find the next unentered pair
				if (currentPairIndex < newComparisons.length - 1) {
					nextIndex = newComparisons.length;
				} else {
					// If we were entering a new pair, just go to the next one
					nextIndex = currentPairIndex + 1;
				}

				setCurrentPairIndex(nextIndex);
				const nextComparison = newComparisons[nextIndex];
				if (nextComparison) {
					setSelectedChoice(nextComparison.choice);
					setMultiplier(nextComparison.multiplier.toString());
					setReasoning(nextComparison.reasoning);
				} else {
					setSelectedChoice(null);
					setMultiplier("");
					setReasoning("");
				}
				setError("");
			} else {
				setIsAllCompleted(true);
				setShowSuccessDialog(true);
			}
		} catch (error) {
			console.error("Submit error:", error);
			setError(error.message || "Failed to submit comparison");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleFillRandom = () => {
		const newComparisons = [];
		for (let i = 0; i < pairs.length; i++) {
			const pair = pairs[i];
			const choice = Math.random() < 0.5 ? 1 : 2;
			const multiplierValue = (Math.random() * 9 + 1).toFixed(2); // Random number between 1 and 10
			const logMultiplierValue =
				choice === 2 ? Math.log(multiplierValue) : -Math.log(multiplierValue);

			newComparisons.push({
				itemAIndex: seeds.indexOf(pair[0]),
				itemBIndex: seeds.indexOf(pair[1]),
				itemAName: formatRepoName(pair[0]),
				itemBName: formatRepoName(pair[1]),
				choice,
				multiplier: parseFloat(multiplierValue),
				logMultiplier: logMultiplierValue,
				reasoning: `Random test comparison ${i + 1}`,
			});
		}
		setComparisons(newComparisons);
		setIsAllCompleted(true);
		setShowReviewPanel(false);
	};

	const handleSubmit = async () => {
		if (!userData.name.trim() || !userData.email.trim()) {
			setError("Please enter your name and email");
			return;
		}

		try {
			setIsSubmitting(true);
			const response = await fetch("/api/submit", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					userData,
					comparisons,
				}),
			});

			const data = await response.json();

			if (response.ok) {
				setShowSuccessDialog(true);
			} else {
				setError(data.error || "Failed to submit comparisons");
			}
		} catch (error) {
			console.error("Submit error:", error);
			setError("An error occurred while submitting your comparisons");
		} finally {
			setIsSubmitting(false);
		}
	};

	const ComparisonReviewPanel = () => (
		<Card className="max-w-2xl mb-8">
			<CardHeader>
				<CardTitle className="flex justify-between items-center">
					Review Your Comparisons
					{!isAllCompleted && (
						<Button variant="outline" onClick={() => setShowReviewPanel(false)}>
							Close
						</Button>
					)}
				</CardTitle>
				{isAllCompleted && (
					<p className="text-sm text-muted-foreground mt-2">
						Please review your responses. Click 'Edit' on any comparison if you
						want to make changes.
					</p>
				)}
			</CardHeader>
			<CardContent className="space-y-4">
				{comparisons.map((comparison, index) => (
					<Card key={index} className="p-4">
						<div className="flex justify-between items-start">
							<div>
								<p className="font-medium">Comparison {index + 1}</p>
								<p className="text-sm text-muted-foreground mt-1">
									{comparison.choice === 1
										? comparison.itemAName
										: comparison.itemBName}{" "}
									is deserve {comparison.multiplier}x more credit than{" "}
									{comparison.choice === 1
										? comparison.itemBName
										: comparison.itemAName}
								</p>
								<p className="text-sm mt-2">{comparison.reasoning}</p>
							</div>
							<Button
								variant="outline"
								onClick={() => handleEditComparison(index)}
							>
								Edit
							</Button>
						</div>
					</Card>
				))}
			</CardContent>
		</Card>
	);

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
									placeholder="DEMO2024"
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
			) : isAllCompleted ? (
				<div className="space-y-8">
					<Card className="max-w-2xl mx-auto">
						<CardHeader>
							<CardTitle className="text-center text-2xl">
								Thank You for Your Response!
							</CardTitle>
							<p className="text-center text-muted-foreground mt-4">
								Your comparisons have been saved successfully. You can review
								and modify your responses below if needed.
							</p>
						</CardHeader>
					</Card>
					<ComparisonReviewPanel />
				</div>
			) : (
				<div>
					<div className="flex justify-between items-center mb-4">
						<h2 className="text-lg font-semibold text-muted-foreground">
							Compare Repositories
						</h2>
						<Button
							variant="outline"
							onClick={() => setShowReviewPanel(!showReviewPanel)}
						>
							{showReviewPanel ? "Hide Review" : "Show Review"}
						</Button>
					</div>

					{showReviewPanel && <ComparisonReviewPanel />}

					<Card className="max-w-2xl">
						<CardHeader>
							<CardTitle className="flex justify-between items-center">
								Comparison {currentPairIndex + 1} of {pairs.length}
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="space-y-6">
								<div className="space-y-4">
									<p className="text-lg text-center">
										Which repository deserves more credit for Ethereum?
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
											Enter how many times more credit the repository you choose
											deserves (1-10)
										</p>
										<div className="flex gap-4 items-center">
											<Input
												type="number"
												value={multiplier}
												onChange={(e) => setMultiplier(e.target.value)}
												placeholder="Enter a number (1-10)"
												className="max-w-[200px]"
												min="1"
												max="10"
												step="0.01"
												disabled={isSubmitting}
											/>
										</div>
									</div>

									<div className="space-y-2">
										<Label htmlFor="reasoning">Reasoning</Label>
										<p className="text-sm text-muted-foreground">
											Please explain your choice and the multiplier value (~200
											words)
										</p>
										<Textarea
											id="reasoning"
											value={reasoning}
											onChange={(e) => setReasoning(e.target.value)}
											placeholder="Explain why you chose this repository and the multiplier value..."
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
											) : currentPairIndex < pairs.length - 1 ? (
												"Next"
											) : (
												"Complete"
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
				</div>
			)}

			{showSuccessDialog && (
				<Card className="max-w-2xl mx-auto mt-8">
					<CardHeader>
						<CardTitle>Thank You!</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="text-center">
							<p>Your comparisons have been submitted successfully.</p>
							<p className="text-sm text-muted-foreground mt-2">
								This invite code has been marked as used and cannot be used
								again.
							</p>
						</div>
						<div className="flex justify-center mt-4">
							<Button onClick={() => window.close()}>Close</Button>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
