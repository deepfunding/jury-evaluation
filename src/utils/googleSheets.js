const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;

export class GoogleSheetsService {
	async getAccessToken() {
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

		// Convert private key from PEM to binary format
		const pemContents = GOOGLE_PRIVATE_KEY.replace(
			"-----BEGIN PRIVATE KEY-----",
			"",
		)
			.replace("-----END PRIVATE KEY-----", "")
			.replace(/\\n/g, "\n")
			.replace(/\s/g, "");

		// Decode base64 to binary
		const binaryKey = Uint8Array.from(atob(pemContents), (c) =>
			c.charCodeAt(0),
		);

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

		// Sign the input
		const signature = await crypto.subtle.sign(
			"RSASSA-PKCS1-v1_5",
			privateKey,
			new TextEncoder().encode(signatureInput),
		);

		// Create the complete JWT
		const jwt = `${signatureInput}.${btoa(String.fromCharCode(...new Uint8Array(signature)))}`;

		// Exchange JWT for access token
		const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
				assertion: jwt,
			}),
		});

		const { access_token } = await tokenResponse.json();
		return access_token;
	}

	async findInviteCode(inviteCode) {
		try {
			const accessToken = await this.getAccessToken();

			// Get values from the 'juros' sheet, columns D and E
			const response = await fetch(
				`https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/juros!D:E`,
				{
					headers: {
						Authorization: `Bearer ${accessToken}`,
					},
				},
			);

			if (!response.ok) {
				throw new Error(`Failed to fetch sheet data: ${response.statusText}`);
			}

			const { values } = await response.json();

			// Find the row with matching invite code
			const rowIndex = values?.findIndex((row) => row[0] === inviteCode);

			if (rowIndex === -1) {
				return { isValid: false, message: "Invalid invite code" };
			}

			// TODO: Enable submission check in production
			// Check if response is already submitted (column E)
			// if (values[rowIndex][1]?.toLowerCase() === "yes") {
			// 	return { isValid: false, message: "Response already submitted" };
			// }

			return { isValid: true, rowIndex: rowIndex + 1 }; // +1 because Sheets API is 1-indexed
		} catch (error) {
			console.error("Error finding invite code:", error);
			throw error;
		}
	}

	async markAsSubmitted(rowIndex) {
		try {
			const accessToken = await this.getAccessToken();

			// Update the cell in column E to 'yes'
			const response = await fetch(
				`https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/juros!E${rowIndex}?valueInputOption=RAW`,
				{
					method: "PUT",
					headers: {
						Authorization: `Bearer ${accessToken}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						values: [["yes"]],
					}),
				},
			);

			if (!response.ok) {
				throw new Error(
					`Failed to update submission status: ${response.statusText}`,
				);
			}

			return true;
		} catch (error) {
			console.error("Error marking as submitted:", error);
			throw error;
		}
	}

	async submitRatings(data) {
		try {
			const accessToken = await this.getAccessToken();

			// First verify the invite code and get row index
			const codeCheck = await this.findInviteCode(data.userData.inviteCode);
			if (!codeCheck.isValid) {
				throw new Error(codeCheck.message);
			}

			// Prepare row data
			const rowData = {
				timestamp: new Date().toISOString(),
				name: data.userData.name,
				email: data.userData.email,
				inviteCode: data.userData.inviteCode,
				...Object.keys(data.ratings).reduce((acc, repo) => {
					acc[repo.replace("https://github.com/", "")] = data.ratings[repo];
					return acc;
				}, {}),
			};

			// Append row to responses sheet
			const response = await fetch(
				`https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/responses:append?valueInputOption=RAW`,
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

			// Mark as submitted in juros sheet
			await this.markAsSubmitted(codeCheck.rowIndex);

			return true;
		} catch (error) {
			console.error("Error submitting ratings:", error);
			throw error;
		}
	}

	async submitComparison(userData, comparison, existingRowNumber = null) {
		try {
			const accessToken = await this.getAccessToken();

			// First verify the invite code and get row index
			const codeCheck = await this.findInviteCode(userData.inviteCode);
			if (!codeCheck.isValid) {
				throw new Error(codeCheck.message);
			}

			// Prepare row data
			const row = [
				new Date().toISOString(), // timestamp
				userData.name, // name
				userData.email, // email
				userData.inviteCode, // invite code
				comparison.itemAIndex, // itemAIndex
				comparison.itemBIndex, // itemBIndex
				comparison.itemAName, // itemAName
				comparison.itemBName, // itemBName
				comparison.choice, // choice
				comparison.multiplier, // multiplier
				comparison.logMultiplier, // logMultiplier
				comparison.reasoning, // reasoning
			];

			let response;
			if (existingRowNumber) {
				// Update existing row
				response = await fetch(
					`https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/responses!A${existingRowNumber}:L${existingRowNumber}?valueInputOption=RAW`,
					{
						method: "PUT",
						headers: {
							Authorization: `Bearer ${accessToken}`,
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							values: [row],
						}),
					},
				);
			} else {
				// Append new row and get its position
				response = await fetch(
					`https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/responses:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS&includeValuesInResponse=true`,
					{
						method: "POST",
						headers: {
							Authorization: `Bearer ${accessToken}`,
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							values: [row],
						}),
					},
				);
			}

			if (!response.ok) {
				throw new Error(
					`Failed to ${existingRowNumber ? "update" : "append"} row: ${response.statusText}`,
				);
			}

			// If this was a new row, get its position from the response
			if (!existingRowNumber) {
				const data = await response.json();
				const updatedRange = data.updates?.updatedRange;
				if (updatedRange) {
					// Extract row number from range (e.g., "responses!A15:L15" -> 15)
					const match = updatedRange.match(/\d+/);
					if (match) {
						return { success: true, rowNumber: parseInt(match[0]) };
					}
				}
			}

			return { success: true, rowNumber: existingRowNumber };
		} catch (error) {
			console.error("Error submitting comparison:", error);
			throw error;
		}
	}

	async getAllComparisons() {
		try {
			const response = await fetch(
				`https://sheets.googleapis.com/v4/spreadsheets/${process.env.GOOGLE_SHEET_ID}/values/responses!G2:L`,
				{
					headers: {
						Authorization: `Bearer ${await this.getAccessToken()}`,
					},
				},
			);

			if (!response.ok) {
				throw new Error("Failed to fetch responses from Google Sheets");
			}

			const { values } = await response.json();
			if (!values) return [];

			return this._mapResponseToComparisons(values);
		} catch (error) {
			console.error("Error fetching all comparisons:", error);
			throw error;
		}
	}

	async getPreviousComparisons(repoA, repoB) {
		try {
			const allComparisons = await this.getAllComparisons();

			// repoA와 repoB가 모두 있는 경우에만 해당 페어의 비교 결과를 반환
			if (repoA && repoB) {
				return allComparisons.filter(
					(comparison) =>
						(comparison.itemAName === repoA &&
							comparison.itemBName === repoB) ||
						(comparison.itemAName === repoB && comparison.itemBName === repoA),
				);
			}

			// repoA만 있는 경우 해당 프로젝트가 포함된 모든 비교 결과를 반환
			if (repoA) {
				return allComparisons.filter(
					(comparison) =>
						comparison.itemAName === repoA || comparison.itemBName === repoA,
				);
			}

			// 필터가 없는 경우 모든 비교 결과를 반��
			return allComparisons;
		} catch (error) {
			console.error("Error fetching previous comparisons:", error);
			throw error;
		}
	}

	_mapResponseToComparisons(values) {
		return values.map((row) => ({
			itemAName: row[0], // G열 - 프로젝트 A 이름
			itemBName: row[1], // H열 - 프로젝트 B 이름
			choice: row[2], // I열 - 선택 (A or B)
			multiplier: parseFloat(row[3]), // J열 - 배수
			reasoning: row[5], // L열 - 이유
		}));
	}
}
