"use client";

import { useState } from "react";
import { seeds } from "@/data/seed";
import { useUserStore } from "@/store/userStore";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ScoringPage() {
	const userData = useUserStore((state) => state.userData);
	const [ratings, setRatings] = useState({});
	const [submitStatus, setSubmitStatus] = useState("");

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
		if (Object.keys(ratings).length !== seeds.length) {
			setSubmitStatus("Please rate all repositories before submitting");
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
				console.log({
					userData,
					ratings,
				});
			} else {
				setSubmitStatus(`Error: ${data.error || "Failed to submit ratings"}`);
			}
		} catch (error) {
			setSubmitStatus("Error: Failed to submit ratings");
			console.error("Submit error:", error);
		}
	};

	return (
		<div className="container mx-auto p-8">
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
										variant={ratings[repo] === rating ? "default" : "outline"}
										size="sm"
										className="w-8 h-8 p-0"
									>
										{rating}
									</Button>
								))}
							</div>
						</div>
					))}

					<div className="flex flex-col items-center gap-4 pt-6">
						<Button onClick={handleSubmit} size="lg" className="px-8">
							Submit Ratings
						</Button>
						{submitStatus && (
							<Alert
								variant={
									submitStatus.includes("Error") ? "destructive" : "default"
								}
							>
								<AlertDescription>{submitStatus}</AlertDescription>
							</Alert>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
