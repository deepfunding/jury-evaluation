"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Home() {
	const router = useRouter();
	const setUserData = useUserStore((state) => state.setUserData);
	const [formData, setFormData] = useState({
		name: "Test User",
		email: "test@example.com",
		inviteCode: "DEMO2024",
	});
	const [error, setError] = useState("");

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");

		try {
			const response = await fetch("/api/auth", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(formData),
			});

			const data = await response.json();

			if (response.ok) {
				setUserData(formData);
				router.push("/scoring");
			} else {
				setError(data.error || "Invalid input. Please try again.");
			}
		} catch (error) {
			setError("Something went wrong. Please try again.");
		}
	};

	const handleChange = (e) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value,
		});
		setError(""); // Clear error when user starts typing
	};

	return (
		<div className="container mx-auto p-8">
			<div className="max-w-md mx-auto">
				<Card>
					<CardHeader>
						<CardTitle>Enter Your Information</CardTitle>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-6">
							<div className="space-y-2">
								<Label htmlFor="name">Name</Label>
								<Input
									type="text"
									id="name"
									name="name"
									value={formData.name}
									onChange={handleChange}
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="email">Email</Label>
								<Input
									type="email"
									id="email"
									name="email"
									value={formData.email}
									onChange={handleChange}
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="inviteCode">Invite Code</Label>
								<Input
									type="text"
									id="inviteCode"
									name="inviteCode"
									value={formData.inviteCode}
									onChange={handleChange}
									required
								/>
							</div>
							<Button type="submit" className="w-full">
								Submit
							</Button>
							{error && (
								<Alert
									variant={
										error.includes("already submitted")
											? "default"
											: "destructive"
									}
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
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
