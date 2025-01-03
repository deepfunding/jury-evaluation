import { describe, test, expect } from "vitest";
import {
	generatePairs,
	formatRepoName,
} from "../pairwise";
import { seeds } from "../../data/seed";

describe("generatePairs", () => {
	describe("basic requirements", () => {
		test("generates the requested number of pairs", () => {
			const numComparisons = 5;
			const pairs = generatePairs(seeds, numComparisons);
			expect(pairs).toHaveLength(numComparisons);
		});

		test("generates pairs with valid repositories", () => {
			const pairs = generatePairs(seeds, 5);
			pairs.forEach(([repoA, repoB]) => {
				expect(seeds).toContain(repoA);
				expect(seeds).toContain(repoB);
				expect(repoA).not.toBe(repoB);
			});
		});

		test("never generates duplicate pairs", () => {
			const pairs = generatePairs(seeds, 5);
			const pairStrings = pairs.map((pair) => {
				const [a, b] = pair.map(formatRepoName);
				return [a, b].sort().join(",");
			});
			const uniquePairs = new Set(pairStrings);
			expect(uniquePairs.size).toBe(pairs.length);
		});
	});

	describe("fairness requirements", () => {
		test("generates all possible pairs over many iterations", () => {
			// Generate many pairs and track which pairs were generated
			const iterations = 10000;
			const pairCounts = new Map();
			
			for (let i = 0; i < iterations; i++) {
				const pairs = generatePairs(seeds, 1);
				const [a, b] = pairs[0].map(formatRepoName);
				const pairKey = [a, b].sort().join(",");
				pairCounts.set(pairKey, (pairCounts.get(pairKey) || 0) + 1);
			}

			// Verify all possible pairs were generated
			const expectedPairs = new Set();
			for (let i = 0; i < seeds.length; i++) {
				for (let j = i + 1; j < seeds.length; j++) {
					const pairKey = [
						formatRepoName(seeds[i]),
						formatRepoName(seeds[j])
					].sort().join(",");
					expectedPairs.add(pairKey);
				}
			}
			
			const actualPairs = new Set(pairCounts.keys());
			expect(actualPairs).toEqual(expectedPairs);
		});

		test("generates pairs with uniform distribution", () => {
			const iterations = 50000;
			const pairCounts = new Map();
			
			// Generate pairs and count occurrences
			for (let i = 0; i < iterations; i++) {
				const pairs = generatePairs(seeds, 1);
				const [a, b] = pairs[0].map(formatRepoName);
				const pairKey = [a, b].sort().join(",");
				pairCounts.set(pairKey, (pairCounts.get(pairKey) || 0) + 1);
			}

			// Calculate expected count and standard deviation
			const totalPossiblePairs = (seeds.length * (seeds.length - 1)) / 2;
			const expectedCount = iterations / totalPossiblePairs;
			const stdDev = Math.sqrt(iterations * (1/totalPossiblePairs) * (1 - 1/totalPossiblePairs));
			const threeSigma = 3 * stdDev;
			
			// Each pair should appear within 3 standard deviations of the expected count
			for (const count of pairCounts.values()) {
				expect(Math.abs(count - expectedCount)).toBeLessThan(threeSigma);
			}
		});
	});

	describe("error cases", () => {
		test("throws error for insufficient items", () => {
			expect(() => generatePairs([], 5)).toThrow("Need at least 2 items");
			expect(() => generatePairs([seeds[0]], 5)).toThrow("Need at least 2 items");
		});
	});
});
