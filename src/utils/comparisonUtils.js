export function getComparisonResult(comparison) {
	// choice가 "A"/"B" 형식인 경우와 "1"/"2" 형식 모두 처리
	const isABFormat = comparison.choice === "A" || comparison.choice === "B";
	const normalizedChoice = isABFormat
		? comparison.choice === "A"
			? "1"
			: "2"
		: comparison.choice;

	const choice = Number(normalizedChoice);

	return {
		moreValuableProject:
			choice === 1 ? comparison.itemAName : comparison.itemBName,
		lessValuableProject:
			choice === 1 ? comparison.itemBName : comparison.itemAName,
		multiplier: comparison.multiplier,
	};
}
