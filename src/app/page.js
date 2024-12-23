"use client";

import { useState } from "react";
import { seeds } from "@/data/seed";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

export default function Home() {
	const [inviteCode, setInviteCode] = useState("DEMO2024");
	const [error, setError] = useState("");
	const [isValidated, setIsValidated] = useState(false);
	const [ratings, setRatings] = useState({});
	const [submitStatus, setSubmitStatus] = useState("");
	const [showSuccessDialog, setShowSuccessDialog] = useState(false);
	const [userData, setUserData] = useState({
		name: "John Doe",
		email: "john@example.com",
		inviteCode: "",
	});

	const resetForm = () => {
		setIsValidated(false);
		setInviteCode("");
		setRatings({});
		setUserData({
			name: "",
			email: "",
			inviteCode: "",
		});
		setShowSuccessDialog(false);
	};

	const handleValidate = async (e) => {
		e.preventDefault();
		setError("");
		setSubmitStatus("");

		try {
			const response = await fetch("/api/auth", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					inviteCode,
					name: "Anonymous", // Temporary values for validation
					email: "anonymous@example.com",
				}),
			});

			const data = await response.json();

			if (response.ok) {
				setIsValidated(true);
				setUserData((prev) => ({
					...prev,
					inviteCode,
				}));
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

	const isSubmitEnabled = () => {
		const isAllRated = Object.keys(ratings).length === seeds.length;
		const isUserDataComplete = userData.name.trim() && userData.email.trim();
		return isAllRated && isUserDataComplete;
	};

	const handleRatingClick = (repo, rating) => {
		setRatings((prev) => ({
			...prev,
			[repo]: rating,
		}));
	};

	const handleRandomRatings = () => {
		const newRatings = {};
		seeds.forEach((repo) => {
			newRatings[repo] = Math.floor(Math.random() * 5) + 1;
		});
		setRatings(newRatings);
	};

	const handleSubmit = async () => {
		if (!isSubmitEnabled()) {
			setSubmitStatus(
				"Please complete all ratings and provide your information",
			);
			return;
		}

		try {
			const response = await fetch("/api/submit", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					userData,
					ratings,
				}),
			});

			const data = await response.json();

			if (response.ok) {
				setSubmitStatus("Ratings submitted successfully!");
				setShowSuccessDialog(true);
			} else {
				setSubmitStatus(`Error: ${data.error || "Failed to submit ratings"}`);
			}
		} catch (error) {
			setSubmitStatus("Error: Failed to submit ratings");
			console.error("Submit error:", error);
		}
	};

	return (
		<>
			<div className="container mx-auto p-8">
				<div className="mb-8">
					<h2 className="text-lg font-semibold mb-4 text-muted-foreground">
						Step 1. Enter your invite code
					</h2>
					<div className="max-w-xs">
						<Label htmlFor="inviteCode" className="mb-2 block">
							Invite Code
						</Label>
						<form onSubmit={handleValidate} className="flex gap-4 items-center">
							<div className="flex-1">
								<Input
									id="inviteCode"
									type="text"
									value={inviteCode}
									onChange={(e) => setInviteCode(e.target.value)}
									placeholder="DEMO2024"
									required
								/>
							</div>
							<Button type="submit" disabled={isValidated}>
								Validate
							</Button>
						</form>
					</div>
					{error && (
						<Alert
							variant={
								error.includes("already submitted") ? "default" : "destructive"
							}
							className="mt-4 max-w-xs"
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

				{isValidated && (
					<div>
						<h2 className="text-lg font-semibold mb-4 text-muted-foreground">
							Step 2. Rate repositories and submit your response
						</h2>
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
								<CardTitle>Repository List</CardTitle>
								<Button
									onClick={handleRandomRatings}
									variant="outline"
									className="bg-green-600 text-white hover:bg-green-700"
								>
									Random Ratings
								</Button>
							</CardHeader>
							<CardContent className="space-y-6">
								{seeds.map((repo, index) => (
									<div
										key={index}
										className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
									>
										<a
											href={repo}
											target="_blank"
											rel="noopener noreferrer"
											className="text-primary hover:underline"
										>
											{repo.replace("https://github.com/", "")}
										</a>
										<div className="flex gap-2">
											{[1, 2, 3, 4, 5].map((rating) => (
												<Button
													key={rating}
													onClick={() => handleRatingClick(repo, rating)}
													variant={
														ratings[repo] === rating ? "default" : "outline"
													}
													size="sm"
													className="w-8 h-8 p-0"
												>
													{rating}
												</Button>
											))}
										</div>
									</div>
								))}

								<div className="border-t pt-6">
									<div className="max-w-4xl mx-auto">
										<div className="flex items-end gap-4">
											<div className="flex-1 space-y-2">
												<Label htmlFor="name">Name</Label>
												<Input
													id="name"
													name="name"
													value={userData.name}
													onChange={handleUserDataChange}
													placeholder="Enter your name"
												/>
											</div>
											<div className="flex-1 space-y-2">
												<Label htmlFor="email">Email</Label>
												<Input
													id="email"
													name="email"
													type="email"
													value={userData.email}
													onChange={handleUserDataChange}
													placeholder="Enter your email"
												/>
											</div>
											<Button
												onClick={handleSubmit}
												size="lg"
												className="px-8"
												disabled={!isSubmitEnabled()}
											>
												Submit Ratings
											</Button>
										</div>
										{submitStatus && (
											<Alert
												variant={
													submitStatus.includes("Error")
														? "destructive"
														: "default"
												}
												className="mt-4"
											>
												<AlertDescription>{submitStatus}</AlertDescription>
											</Alert>
										)}
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				)}
			</div>

			<Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Thank You for Your Participation!</DialogTitle>
						<DialogDescription className="pt-3">
							Your ratings have been successfully recorded.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button onClick={resetForm} className="w-full">
							Close
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
