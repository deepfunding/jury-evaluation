import { describe, test, expect } from "vitest";
import {
	generatePairs,
	calculateLogMultiplier,
	formatRepoName,
	isValidMultiplier,
	processComparisonResults,
} from "../pairwise";

describe("generatePairs", () => {
	const items = ["A", "B", "C", "D"];

	test("generates the specified number of pairs", () => {
		const numComparisons = 3;
		const pairs = generatePairs(items, numComparisons);
		expect(pairs).toHaveLength(numComparisons);
	});

	test("generates unique pairs", () => {
		const pairs = generatePairs(items, 3);
		const pairStrings = pairs.map((pair) => pair.sort().join(","));
		const uniquePairs = new Set(pairStrings);
		expect(uniquePairs.size).toBe(pairs.length);
	});

	test("never includes same item twice in a pair", () => {
		const pairs = generatePairs(items, 3);
		pairs.forEach((pair) => {
			expect(pair[0]).not.toBe(pair[1]);
		});
	});

	test("uses valid indices", () => {
		const pairs = generatePairs(items, 3);
		pairs.forEach((pair) => {
			expect(items).toContain(pair[0]);
			expect(items).toContain(pair[1]);
		});
	});
});

describe("calculateLogMultiplier", () => {
	describe("normal cases", () => {
		test("returns negative log for first choice", () => {
			const result = calculateLogMultiplier(1, 2);
			expect(result).toBe(-0.6931471805599453); // -ln(2)
		});

		test("returns positive log for second choice", () => {
			const result = calculateLogMultiplier(2, 2);
			expect(result).toBe(0.6931471805599453); // ln(2)
		});

		test("handles decimal multipliers", () => {
			const result = calculateLogMultiplier(1, 1.5);
			expect(result).toBe(-0.4054651081081644); // -ln(1.5)
		});

		test("handles very small valid multipliers", () => {
			const result = calculateLogMultiplier(1, 1.0000000000001);
			expect(result).toBeCloseTo(-0.0000000000001, 12);
		});

		test("handles very large valid multipliers", () => {
			const result = calculateLogMultiplier(2, 1000000);
			expect(result).toBeCloseTo(13.815510557964274, 12); // ln(1000000)
		});
	});

	describe("boundary cases", () => {
		test("handles minimum valid multiplier", () => {
			const result = calculateLogMultiplier(2, Number.MIN_VALUE);
			expect(Number.isFinite(result)).toBe(true);
			expect(result).toBeCloseTo(-744.4400719213812); // ln(Number.MIN_VALUE)
		});

		test("handles maximum valid multiplier", () => {
			const result = calculateLogMultiplier(2, Number.MAX_VALUE);
			expect(Number.isFinite(result)).toBe(true);
			expect(result).toBeCloseTo(709.782712893384); // ln(Number.MAX_VALUE)
		});

		test("maintains correct sign for extreme values", () => {
			// For minimum value
			expect(calculateLogMultiplier(1, Number.MIN_VALUE)).toBeCloseTo(
				744.4400719213812,
			);
			expect(calculateLogMultiplier(2, Number.MIN_VALUE)).toBeCloseTo(
				-744.4400719213812,
			);

			// For maximum value
			expect(calculateLogMultiplier(1, Number.MAX_VALUE)).toBeCloseTo(
				-709.782712893384,
			);
			expect(calculateLogMultiplier(2, Number.MAX_VALUE)).toBeCloseTo(
				709.782712893384,
			);
		});
	});

	describe("error cases", () => {
		test("returns NaN for invalid choice values", () => {
			expect(Number.isNaN(calculateLogMultiplier(0, 2))).toBe(true);
			expect(Number.isNaN(calculateLogMultiplier(3, 2))).toBe(true);
			expect(Number.isNaN(calculateLogMultiplier(-1, 2))).toBe(true);
			expect(Number.isNaN(calculateLogMultiplier(1.5, 2))).toBe(true);
		});

		test("returns NaN for invalid multiplier values", () => {
			expect(Number.isNaN(calculateLogMultiplier(1, 0))).toBe(true);
			expect(Number.isNaN(calculateLogMultiplier(1, -1))).toBe(true);
			expect(Number.isNaN(calculateLogMultiplier(1, NaN))).toBe(true);
			expect(Number.isNaN(calculateLogMultiplier(1, Infinity))).toBe(true);
			expect(Number.isNaN(calculateLogMultiplier(1, -Infinity))).toBe(true);
		});

		test("handles numeric precision edge cases", () => {
			// Test for potential floating-point precision issues
			const smallDiff =
				calculateLogMultiplier(1, 1 + Number.EPSILON) -
				-Math.log(1 + Number.EPSILON);
			expect(Math.abs(smallDiff)).toBeLessThan(Number.EPSILON);
		});
	});

	describe("symmetry and consistency", () => {
		test("maintains symmetry between choices", () => {
			const multiplier = 3;
			const choice1Result = calculateLogMultiplier(1, multiplier);
			const choice2Result = calculateLogMultiplier(2, multiplier);
			expect(choice1Result).toBe(-choice2Result);
		});

		test("maintains consistency with different multipliers", () => {
			const multipliers = [1.1, 2, 5, 10];
			multipliers.forEach((multiplier) => {
				const choice1Result = calculateLogMultiplier(1, multiplier);
				const choice2Result = calculateLogMultiplier(2, multiplier);
				expect(choice1Result).toBe(-Math.log(multiplier));
				expect(choice2Result).toBe(Math.log(multiplier));
			});
		});
	});
});

describe("formatRepoName", () => {
	test("removes github.com prefix", () => {
		const repoUrl = "https://github.com/user/repo";
		expect(formatRepoName(repoUrl)).toBe("user/repo");
	});

	test("handles urls without https://", () => {
		const repoUrl = "github.com/user/repo";
		expect(formatRepoName(repoUrl)).toBe("user/repo");
	});
});

describe("isValidMultiplier", () => {
	test("accepts values between 1 and 10", () => {
		expect(isValidMultiplier("1")).toBe(true);
		expect(isValidMultiplier("5.5")).toBe(true);
		expect(isValidMultiplier("10")).toBe(true);
	});

	test("rejects values outside 1-10 range", () => {
		expect(isValidMultiplier("0")).toBe(false);
		expect(isValidMultiplier("11")).toBe(false);
		expect(isValidMultiplier("-1")).toBe(false);
	});

	test("rejects non-numeric values", () => {
		expect(isValidMultiplier("abc")).toBe(false);
		expect(isValidMultiplier("")).toBe(false);
		expect(isValidMultiplier("1.2.3")).toBe(false);
	});
});

describe("processComparisonResults", () => {
	test("processes comparison results correctly", () => {
		const comparisons = [
			{
				itemA: "A",
				itemB: "B",
				choice: 1,
				multiplier: 2,
			},
			{
				itemA: "C",
				itemB: "D",
				choice: 2,
				multiplier: 3,
			},
		];

		const results = processComparisonResults(comparisons);
		expect(results).toEqual([
			{
				itemAIndex: "A",
				itemBIndex: "B",
				logMultiplier: -0.6931471805599453,
			},
			{
				itemAIndex: "C",
				itemBIndex: "D",
				logMultiplier: 1.0986122886681096,
			},
		]);
	});

	test("handles empty comparison array", () => {
		const results = processComparisonResults([]);
		expect(results).toEqual([]);
	});
});
