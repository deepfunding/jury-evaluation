/**
 * Gets a cryptographically secure random number between 0 and 1
 * @private
 */
function getSecureRandom() {
	const array = new Uint32Array(1);
	crypto.getRandomValues(array);
	return array[0] / (0xffffffff + 1);
}

/**
 * Generates a random pair of different indices
 * @private
 * @param {number} range - The range of valid indices
 * @returns {[number, number]} A pair of different random indices
 */
function generateRandomPair(range) {
	const firstIndex = Math.floor(getSecureRandom() * range);
	let secondIndex;
	do {
		secondIndex = Math.floor(getSecureRandom() * range);
	} while (secondIndex === firstIndex);
	return [firstIndex, secondIndex];
}

/**
 * Generates random pairs from an array of items for pairwise comparison
 * @param {Array} items - Array of items to compare
 * @param {number} numComparisons - Number of comparisons to generate
 * @returns {Array} Array of pairs, each containing [itemA, itemB]
 */
export function generatePairs(items, numComparisons = 3) {
	if (items.length < 2) {
		throw new Error("Need at least 2 items to generate pairs");
	}

	const pairs = [];
	const itemCount = items.length;

	while (pairs.length < numComparisons) {
		// Generate a random pair of indices
		const [indexA, indexB] = generateRandomPair(itemCount);
		
		// Get the actual items
		const itemA = items[indexA];
		const itemB = items[indexB];

		// Check if this pair (in either order) already exists
		const pairExists = pairs.some(
			([a, b]) => (a === itemA && b === itemB) || (a === itemB && b === itemA),
		);

		if (!pairExists) {
			pairs.push([itemA, itemB]);
		}
	}

	return pairs;
}

/**
 * Calculates the log multiplier based on the selected choice and multiplier value
 * @param {number} choice - 1 for first item, 2 for second item
 * @param {number} multiplier - How many times more credit (must be positive)
 * @returns {number} Log multiplier value
 *
 * Note: This function handles all valid floating point numbers.
 * Application-level validation for decimal places should be handled separately.
 *
 * Constraints and Limitations:
 * 1. Choice must be exactly 1 or 2
 * 2. Multiplier must be a positive finite number
 * 3. Due to IEEE 754 double-precision limitations:
 *    - Minimum multiplier: Number.MIN_VALUE
 *    - Maximum multiplier: Number.MAX_VALUE
 *    - Full floating point precision is maintained
 * 4. Returns NaN for invalid inputs
 */
export function calculateLogMultiplier(choice, multiplier) {
	// Validate choice
	if (choice !== 1 && choice !== 2) {
		return NaN;
	}

	// Validate multiplier is a positive finite number
	if (!Number.isFinite(multiplier) || multiplier <= 0) {
		return NaN;
	}

	// Calculate log multiplier
	const logValue = Math.log(multiplier);
	return choice === 2 ? logValue : -logValue;
}

/**
 * Formats a GitHub repository URL to a more readable name
 * @param {string} repoUrl - Full GitHub repository URL
 * @returns {string} Formatted repository name
 */
export function formatRepoName(repoUrl) {
	return repoUrl.replace(/^(https:\/\/)?github\.com\//, "");
}

/**
 * Validates a multiplier value according to application rules
 * @param {string} value - The multiplier value to validate
 * @returns {boolean} Whether the value is valid
 *
 * Application-specific constraints:
 * 1. Must be a positive number between 1 and 999
 * 2. Maximum 2 decimal places allowed
 * 3. Must be a valid number format
 */
export function isValidMultiplier(value) {
	// Check if the value matches the application's required format
	if (!/^\d*\.?\d{0,2}$/.test(value)) {
		return false;
	}

	const num = parseFloat(value);
	return num >= 1 && num <= 999;
}

/**
 * Processes the comparison results into a format suitable for analysis
 * @param {Array} comparisons - Array of comparison results
 * @returns {Array} Processed comparison data
 */
export function processComparisonResults(comparisons) {
	return comparisons.map(({ itemA, itemB, choice, multiplier }) => ({
		itemAIndex: itemA,
		itemBIndex: itemB,
		logMultiplier: calculateLogMultiplier(choice, multiplier),
	}));
}
