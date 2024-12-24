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

	describe("extended range tests", () => {
		test("handles large valid multipliers", () => {
			expect(calculateLogMultiplier(1, 100)).toBeCloseTo(-4.605170185988092);
			expect(calculateLogMultiplier(2, 100)).toBeCloseTo(4.605170185988092);
			expect(calculateLogMultiplier(1, 500)).toBeCloseTo(-6.214608098422191);
			expect(calculateLogMultiplier(2, 500)).toBeCloseTo(6.214608098422191);
			expect(calculateLogMultiplier(1, 999)).toBeCloseTo(-6.906754778648554);
			expect(calculateLogMultiplier(2, 999)).toBeCloseTo(6.906754778648554);
		});

		test("maintains precision with decimal values", () => {
			expect(calculateLogMultiplier(1, 1.5)).toBeCloseTo(-0.4054651081081644);
			expect(calculateLogMultiplier(2, 1.5)).toBeCloseTo(0.4054651081081644);
			expect(calculateLogMultiplier(1, 99.5)).toBeCloseTo(-4.600158825073151);
			expect(calculateLogMultiplier(2, 99.5)).toBeCloseTo(4.600158825073151);
			expect(calculateLogMultiplier(1, 999.99)).toBeCloseTo(-6.907755278982137);
			expect(calculateLogMultiplier(2, 999.99)).toBeCloseTo(6.907755278982137);
		});

		test("handles various decimal places", () => {
			expect(calculateLogMultiplier(1, 1.23)).toBeCloseTo(-0.20701418698771725);
			expect(calculateLogMultiplier(2, 45.67)).toBeCloseTo(3.8215461282619165);
			expect(calculateLogMultiplier(1, 123.45)).toBeCloseTo(-4.815728376275294);
			expect(calculateLogMultiplier(2, 567.89)).toBeCloseTo(6.342132199234153);
		});
	});

	describe("boundary value tests", () => {
		test("handles minimum valid values", () => {
			expect(calculateLogMultiplier(1, 1)).toBeCloseTo(0);
			expect(calculateLogMultiplier(2, 1)).toBeCloseTo(0);
			expect(calculateLogMultiplier(1, 1.01)).toBeCloseTo(-0.00995033085316808);
			expect(calculateLogMultiplier(2, 1.01)).toBeCloseTo(0.00995033085316808);
		});

		test("handles maximum valid values", () => {
			expect(calculateLogMultiplier(1, 998)).toBeCloseTo(-6.905753321150545);
			expect(calculateLogMultiplier(2, 998)).toBeCloseTo(6.905753321150545);
			expect(calculateLogMultiplier(1, 999)).toBeCloseTo(-6.906754778648554);
			expect(calculateLogMultiplier(2, 999)).toBeCloseTo(6.906754778648554);
		});
	});

	describe("error handling", () => {
		test("handles invalid choice values", () => {
			expect(Number.isNaN(calculateLogMultiplier(0, 500))).toBe(true);
			expect(Number.isNaN(calculateLogMultiplier(3, 500))).toBe(true);
			expect(Number.isNaN(calculateLogMultiplier(-1, 500))).toBe(true);
			expect(Number.isNaN(calculateLogMultiplier(1.5, 500))).toBe(true);
		});

		test("handles invalid multiplier values", () => {
			expect(Number.isNaN(calculateLogMultiplier(1, 0))).toBe(true);
			expect(Number.isNaN(calculateLogMultiplier(1, -500))).toBe(true);
			expect(Number.isNaN(calculateLogMultiplier(1, 1000))).toBe(false);
			expect(Number.isNaN(calculateLogMultiplier(2, "abc"))).toBe(true);
		});
	});

	describe("symmetry tests", () => {
		test("maintains symmetry with various values", () => {
			const testValues = [1.5, 10, 50, 100, 500, 999];
			testValues.forEach((value) => {
				const choice1Result = calculateLogMultiplier(1, value);
				const choice2Result = calculateLogMultiplier(2, value);
				expect(choice1Result).toBeCloseTo(-choice2Result);
				expect(Math.abs(choice1Result)).toBeCloseTo(Math.log(value));
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
	test("accepts values between 1 and 999", () => {
		expect(isValidMultiplier("1")).toBe(true);
		expect(isValidMultiplier("1.5")).toBe(true);
		expect(isValidMultiplier("5.5")).toBe(true);
		expect(isValidMultiplier("10")).toBe(true);
		expect(isValidMultiplier("100")).toBe(true);
		expect(isValidMultiplier("500.5")).toBe(true);
		expect(isValidMultiplier("999")).toBe(true);
	});

	test("rejects values outside 1-999 range", () => {
		expect(isValidMultiplier("0")).toBe(false);
		expect(isValidMultiplier("0.5")).toBe(false);
		expect(isValidMultiplier("1000")).toBe(false);
		expect(isValidMultiplier("-1")).toBe(false);
		expect(isValidMultiplier("999.1")).toBe(false);
	});

	test("validates decimal place restrictions", () => {
		expect(isValidMultiplier("1.23")).toBe(true);
		expect(isValidMultiplier("5.234")).toBe(false);
		expect(isValidMultiplier("100.567")).toBe(false);
		expect(isValidMultiplier("1.5")).toBe(true);
		expect(isValidMultiplier("10.05")).toBe(true);
		expect(isValidMultiplier("999.99")).toBe(false);
	});

	test("rejects invalid number formats", () => {
		expect(isValidMultiplier("abc")).toBe(false);
		expect(isValidMultiplier("")).toBe(false);
		expect(isValidMultiplier("1.2.3")).toBe(false);
		expect(isValidMultiplier("5,5")).toBe(false);
		expect(isValidMultiplier("10e2")).toBe(false);
		expect(isValidMultiplier("1/2")).toBe(false);
		expect(isValidMultiplier(" 123 ")).toBe(false);
	});

	test("handles edge cases", () => {
		expect(isValidMultiplier("001")).toBe(true);
		expect(isValidMultiplier("1.")).toBe(true);
		expect(isValidMultiplier(".5")).toBe(false);
		expect(isValidMultiplier("1.0")).toBe(true);
		expect(isValidMultiplier("999.00")).toBe(true);
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
