import { seeds } from "./seed";
import { formatRepoName } from "@/utils/pairwise";

// Helper function to generate random multiplier between 1 and 999
const randomMultiplier = () => {
	const base = Math.random() * 998 + 1; // 1 to 999
	return Number(base.toFixed(2)); // Keep 2 decimal places
};

// Helper function to generate mock reasoning
const generateReasoning = (choiceName, otherName, multiplier) => {
	const reasons = [
		`${choiceName} has been more influential because it provides essential functionality that ${otherName} builds upon. The ${multiplier}x multiplier reflects its foundational role in the ecosystem.`,
		`While both are important, ${choiceName} deserves ${multiplier}x more credit due to its broader impact and more frequent usage compared to ${otherName}.`,
		`${choiceName} has demonstrated ${multiplier}x more value through its innovative solutions and robust architecture, making it more valuable than ${otherName}.`,
		`The ${multiplier}x multiplier for ${choiceName} over ${otherName} is justified by its superior documentation, community support, and proven track record.`,
		`Comparing ${choiceName} with ${otherName}, the former deserves ${multiplier}x more credit due to its critical role in security and reliability.`,
	];
	return reasons[Math.floor(Math.random() * reasons.length)];
};

// Generate mock evaluations with varying counts for different projects
const generateMockEvaluations = () => {
	const evaluations = [];
	const formattedSeeds = seeds.map((repo) => formatRepoName(repo));

	// Ensure each project appears in different numbers of evaluations
	formattedSeeds.forEach((repoA, indexA) => {
		// Generate different number of comparisons for each project (3-8 comparisons)
		const comparisonsCount = Math.floor(Math.random() * 6) + 3;

		for (let i = 0; i < comparisonsCount; i++) {
			// Select a random project to compare with
			let indexB;
			do {
				indexB = Math.floor(Math.random() * formattedSeeds.length);
			} while (indexB === indexA);

			const repoB = formattedSeeds[indexB];
			const choice = Math.random() > 0.5 ? "A" : "B";
			const multiplier = randomMultiplier();

			const choiceName = choice === "A" ? repoA : repoB;
			const otherName = choice === "A" ? repoB : repoA;

			evaluations.push({
				itemAIndex: indexA,
				itemBIndex: indexB,
				itemAName: repoA,
				itemBName: repoB,
				choice,
				multiplier,
				reasoning: generateReasoning(choiceName, otherName, multiplier),
			});
		}
	});

	return evaluations;
};

export const mockEvaluations = generateMockEvaluations();
