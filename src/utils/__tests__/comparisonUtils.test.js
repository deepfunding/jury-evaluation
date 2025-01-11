import { getComparisonResult } from "../comparisonUtils";

describe("getComparisonResult", () => {
	it("correctly identifies more valuable project when choice is 1", () => {
		const comparison = {
			itemAName: "ethereum/go-ethereum",
			itemBName: "grandinetech/grandine",
			choice: "1",
			multiplier: 140,
		};

		const result = getComparisonResult(comparison);

		expect(result).toEqual({
			moreValuableProject: "ethereum/go-ethereum",
			lessValuableProject: "grandinetech/grandine",
			multiplier: 140,
		});
	});

	it("correctly identifies more valuable project when choice is A", () => {
		const comparison = {
			itemAName: "ethereum/go-ethereum",
			itemBName: "grandinetech/grandine",
			choice: "A",
			multiplier: 140,
		};

		const result = getComparisonResult(comparison);

		expect(result).toEqual({
			moreValuableProject: "ethereum/go-ethereum",
			lessValuableProject: "grandinetech/grandine",
			multiplier: 140,
		});
	});

	it("correctly identifies more valuable project when choice is B", () => {
		const comparison = {
			itemAName: "ethereum/go-ethereum",
			itemBName: "grandinetech/grandine",
			choice: "B",
			multiplier: 140,
		};

		const result = getComparisonResult(comparison);

		expect(result).toEqual({
			moreValuableProject: "grandinetech/grandine",
			lessValuableProject: "ethereum/go-ethereum",
			multiplier: 140,
		});
	});

	it("handles numeric choice values", () => {
		const comparison = {
			itemAName: "ProjectA",
			itemBName: "ProjectB",
			choice: 1,
			multiplier: 2,
		};

		const result = getComparisonResult(comparison);

		expect(result).toEqual({
			moreValuableProject: "ProjectA",
			lessValuableProject: "ProjectB",
			multiplier: 2,
		});
	});
});
