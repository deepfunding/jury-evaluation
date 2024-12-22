export const runtime = "edge";

const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;

async function getAccessToken() {
	const jwtHeader = {
		alg: "RS256",
		typ: "JWT",
	};

	const now = Math.floor(Date.now() / 1000);
	const jwtClaimSet = {
		iss: GOOGLE_SERVICE_ACCOUNT_EMAIL,
		scope: "https://www.googleapis.com/auth/spreadsheets",
		aud: "https://oauth2.googleapis.com/token",
		exp: now + 3600,
		iat: now,
	};

	// Create JWT
	const encodedHeader = btoa(JSON.stringify(jwtHeader));
	const encodedClaimSet = btoa(JSON.stringify(jwtClaimSet));
	const signatureInput = `${encodedHeader}.${encodedClaimSet}`;

	// Add TextEncoder
	const encoder = new TextEncoder();

	// Convert private key from PEM to binary format
	const pemContents = GOOGLE_PRIVATE_KEY.replace(
		"-----BEGIN PRIVATE KEY-----",
		"",
	)
		.replace("-----END PRIVATE KEY-----", "")
		.replace(/\s/g, "")
		.replace(/\\n/g, "\n")
		.replace(/\\u003d/g, "=");

	// Decode base64 to binary
	const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

	// Import the key
	const privateKey = await crypto.subtle.importKey(
		"pkcs8",
		binaryKey,
		{
			name: "RSASSA-PKCS1-v1_5",
			hash: "SHA-256",
		},
		false,
		["sign"],
	);

	const signature = await crypto.subtle.sign(
		"RSASSA-PKCS1-v1_5",
		privateKey,
		encoder.encode(signatureInput),
	);

	const jwt = `${signatureInput}.${btoa(String.fromCharCode(...new Uint8Array(signature)))}`;

	// Exchange JWT for access token
	const response = await fetch("https://oauth2.googleapis.com/token", {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: new URLSearchParams({
			grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
			assertion: jwt,
		}),
	});

	const { access_token } = await response.json();
	return access_token;
}

export async function POST(request) {
	try {
		// Check required environment variables
		const requiredEnvVars = [
			"GOOGLE_SERVICE_ACCOUNT_EMAIL",
			"GOOGLE_SHEET_ID",
			"GOOGLE_PRIVATE_KEY",
		];

		for (const envVar of requiredEnvVars) {
			if (!process.env[envVar]) {
				throw new Error(`Missing required environment variable: ${envVar}`);
			}
		}
		const body = await request.json();
		const { userData, ratings } = body;

		// Prepare row data
		const rowData = {
			timestamp: new Date().toISOString(),
			name: userData.name,
			email: userData.email,
			uniqueKey: userData.uniqueKey,
			...Object.keys(ratings).reduce((acc, repo) => {
				acc[repo.replace("https://github.com/", "")] = ratings[repo];
				return acc;
			}, {}),
		};

		// Get access token
		const accessToken = await getAccessToken();

		// Append row to sheet
		const response = await fetch(
			`https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/Sheet1:append?valueInputOption=RAW`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${accessToken}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					values: [Object.values(rowData)],
				}),
			},
		);

		if (!response.ok) {
			throw new Error(`Failed to append row: ${response.statusText}`);
		}

		return new Response(
			JSON.stringify({
				success: true,
				message: "Ratings submitted successfully",
			}),
			{
				status: 200,
				headers: {
					"Content-Type": "application/json",
				},
			},
		);
	} catch (error) {
		console.error("Error submitting ratings:", error);
		return new Response(
			JSON.stringify({
				success: false,
				error: "Failed to submit ratings",
			}),
			{
				status: 500,
				headers: {
					"Content-Type": "application/json",
				},
			},
		);
	}
}
