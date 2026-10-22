import { HSElementHooker } from "../../hs-core/hs-elementhooker";
import { HSLogger } from "../../hs-core/hs-logger";
import { HSModuleManager } from "../../hs-core/module/hs-module-manager";
import { HSUtils } from "../../hs-utils/hs-utils";
import { HSNumberParser } from "../../hs-utils/hs-number-parser";
import type { HSGameDataAPI } from "../../hs-core/gds/hs-gamedata-api";
import { parseGameDataNumber } from "../../hs-core/gds/hs-gamedata-utils";
import { HEPTERACT_DATA, hepteractCapacities, hepteractUnitsToReach } from "./hs-hepteract-state";
import { AscensionIncomeSnapshot, formatDuration, HSAscensionIncome } from "./hs-ascension-income";

type PlatonicResourceEstimate = {
    resource: string;
    seconds: number;
    // Not owned yet: the next ascension's gain is needed
    needsAscension: boolean;
};

/**
 * Class: HSPlatonicUpgradeTime
 * IsExplicitHSModule: No
 * Description:
 *     Created by HSHepteracts. Adds "[HS] Time until next level" and the longest requirement to the hovered
 *     Platonic upgrade's description: the cube costs (with the Wow! Cubes and Hepteracts the Abyss hepteracts
 *     still to craft cost) against the owned amounts and the ascension income. Offerings and Obtainium are only
 *     reported as short. Warns when Exalt 7 is past its time limit.
 * Author: maenhiir
 */
export class HSPlatonicUpgradeTime {
    #context: string;
    #income: HSAscensionIncome;

    #platonicUpgradeDescriptions?: HTMLElement;
    #hoveredPlatonicUpgradeId: number | null = null;

    constructor(context: string, income: HSAscensionIncome) {
        this.#context = context;
        this.#income = income;
    }

    async init(): Promise<void> {
        this.#platonicUpgradeDescriptions = await HSElementHooker.HookElement('#platonicUpgradeDescriptions') as HTMLElement;
        document.querySelectorAll<HTMLImageElement>('.platonicUpgradeImage').forEach((upgradeImage, index) => {
            const upgradeId = index + 1;

            upgradeImage.addEventListener('mouseover', () => {
                this.#hoveredPlatonicUpgradeId = upgradeId;
                this.#showPlatonicUpgradeEstimate('Calculating upgrade time...');
                void HSUtils.yield().then(() => this.#updatePlatonicUpgradeEstimate(upgradeId));
            });

            upgradeImage.addEventListener('mouseleave', () => {
                if (this.#hoveredPlatonicUpgradeId === upgradeId) {
                    this.#hoveredPlatonicUpgradeId = null;
                    this.#removePlatonicUpgradeEstimate();
                }
            });
        });
    }

    #showPlatonicUpgradeEstimate(text: string) {
        if (!this.#platonicUpgradeDescriptions) return;

        let estimateElement = this.#platonicUpgradeDescriptions.querySelector('#hs-platonic-upgrade-estimate') as HTMLParagraphElement | null;
        if (!estimateElement) {
            estimateElement = document.createElement('p');
            estimateElement.id = 'hs-platonic-upgrade-estimate';
            estimateElement.className = 'platonicPortion';
            estimateElement.style.color = 'cyan';
            this.#platonicUpgradeDescriptions.appendChild(estimateElement);
        }
        estimateElement.innerText = `[HS] ${text}`;
    }

    #removePlatonicUpgradeEstimate() {
        this.#platonicUpgradeDescriptions?.querySelector('#hs-platonic-upgrade-estimate')?.remove();
    }

    #readPlatonicRequirement(elementId: string): number | null {
        const text = document.querySelector(`#${elementId}`)?.textContent ?? '';
        const parsed = HSNumberParser.parse(text.slice(text.lastIndexOf('/') + 1));
        return Number.isNaN(parsed) ? null : parsed;
    }

    #timeUntilResource(
        resource: string,
        required: number,
        owned: number,
        income: AscensionIncomeSnapshot | null
    ): PlatonicResourceEstimate {
        const estimate = this.#estimateResourceSeconds(required, owned, income);
        HSLogger.debug(() => `${resource}: need ${required}, own ${owned}, `
            + (income ? `+${income.onAscension} on ascension, ${income.perSecond}/s real time` : 'no income read')
            + ` -> ${formatDuration(estimate)}`, this.#context);
        return { resource, seconds: estimate, needsAscension: required > owned };
    }

    #estimateResourceSeconds(required: number, owned: number, income: AscensionIncomeSnapshot | null): number {
        if (required <= owned) return 0;
        if (!income) return Number.POSITIVE_INFINITY;

        const remainingAfterAscension = Math.max(0, required - owned - income.onAscension);
        return remainingAfterAscension === 0
            ? 0
            : income.perSecond > 0
                ? remainingAfterAscension / income.perSecond
                : Number.POSITIVE_INFINITY;
    }

    async #updatePlatonicUpgradeEstimate(upgradeId: number) {
        if (this.#hoveredPlatonicUpgradeId !== upgradeId) return;

        const gameDataAPI = HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI');
        if (!gameDataAPI || !gameDataAPI.getGameData()) {
            this.#showPlatonicUpgradeEstimate('Upgrade time unavailable: game data has not loaded yet.');
            return;
        }

        const levelText = document.querySelector('#platonicUpgradeLevel')?.textContent ?? '';
        const levelValues = HSNumberParser.parseAll(levelText);
        if (levelValues.length >= 2 && levelValues[0] >= levelValues[1]) {
            this.#showPlatonicUpgradeEstimate('Time until next level: maxed\nLongest requirement: none');
            return;
        }

        const requirements = {
            cubes: this.#readPlatonicRequirement('platonicCubeCost'),
            tesseracts: this.#readPlatonicRequirement('platonicTesseractCost'),
            hypercubes: this.#readPlatonicRequirement('platonicHypercubeCost'),
            platonics: this.#readPlatonicRequirement('platonicPlatonicCost'),
            abyssals: this.#readPlatonicRequirement('platonicHepteractCost')
        };

        if (Object.values(requirements).some(value => value === null)) {
            this.#showPlatonicUpgradeEstimate('Upgrade time unavailable: could not read every requirement.');
            return;
        }

        const startTime = performance.now();
        const income = await this.#income.readAllAscensionIncome();
        const incomeTime = performance.now();
        if (this.#hoveredPlatonicUpgradeId !== upgradeId) {
            HSLogger.debug(() => `Platonic upgrade ${upgradeId}: no longer hovered after the income read (${Math.round(incomeTime - startTime)} ms)`, this.#context);
            return;
        }

        // Read owned resources after sampling the header modes so the ETA does
        // not use the older periodic GDS snapshot. This forces one save-derived
        // refresh without enabling GDS turbo mode.
        const gameData = await gameDataAPI.getForcedGameData();
        HSLogger.debug(() => `Platonic upgrade ${upgradeId}: income read in ${Math.round(incomeTime - startTime)} ms,`
            + ` save forced in ${Math.round(performance.now() - incomeTime)} ms`, this.#context);
        if (this.#hoveredPlatonicUpgradeId !== upgradeId) return;
        if (!gameData) {
            this.#showPlatonicUpgradeEstimate('Upgrade time unavailable: could not refresh current resources.');
            return;
        }

        const requiredAbyssals = requirements.abyssals ?? 0;
        const abyssHepteract = gameData.hepteracts?.abyss;
        const ownedAbyssals = parseGameDataNumber(abyssHepteract?.BAL ?? 0);
        const hasDoubleCapacity = Boolean(
            gameDataAPI.getSingularityChallengeEffect('limitedAscensions', 'hepteractCap')
        );
        const abyssalsToCraft = hepteractUnitsToReach(
            { balance: ownedAbyssals, ...hepteractCapacities('abyss', abyssHepteract?.TIMES_CAP_EXTENDED ?? 0, hasDoubleCapacity) },
            requiredAbyssals
        );
        const hepteractCostMultiplier = gameDataAPI.calculateSingularityDebuff('Hepteract Costs');
        const rawHepteractsNeeded = abyssalsToCraft * HEPTERACT_DATA.abyss.conversion * hepteractCostMultiplier;
        const abyssCraftCubeCost = abyssalsToCraft * 69 * hepteractCostMultiplier;

        const estimates: PlatonicResourceEstimate[] = [
            this.#timeUntilResource(
                'Wow! Cubes',
                (requirements.cubes ?? 0) + abyssCraftCubeCost,
                parseGameDataNumber(gameData.wowCubes),
                income[0]
            ),
            this.#timeUntilResource('Wow! Tesseracts', requirements.tesseracts ?? 0, parseGameDataNumber(gameData.wowTesseracts), income[1]),
            this.#timeUntilResource('Wow! Hypercubes', requirements.hypercubes ?? 0, parseGameDataNumber(gameData.wowHypercubes), income[2]),
            this.#timeUntilResource('Platonic Cubes', requirements.platonics ?? 0, parseGameDataNumber(gameData.wowPlatonicCubes), income[3]),
            this.#timeUntilResource(
                'Hepteracts for Abyss Hepteracts',
                rawHepteractsNeeded,
                parseGameDataNumber(gameData.wowAbyssals),
                income[4]
            )
        ];

        const bottleneck = estimates.reduce((longest, current) => current.seconds > longest.seconds ? current : longest);
        // Offerings and Obtainium have no rate to estimate from: the game's own
        // check (its red/lime cost colour, set on hover) only tells whether they are short.
        const notEstimated = [
            { resource: 'Offerings', elementId: 'platonicOfferingCost' },
            { resource: 'Obtainium', elementId: 'platonicObtainiumCost' }
        ].filter(({ elementId }) => document.querySelector<HTMLElement>(`#${elementId}`)?.style.color !== 'lime')
            .map(({ resource }) => resource);
        HSLogger.debug(() => `Platonic upgrade ${upgradeId}: short and not estimated: ${notEstimated.join(', ') || 'none'}`, this.#context);

        // The time follows the cubes; Offerings / Obtainium only matter once the
        // cubes are already owned (nothing left to wait for but them).
        let time: string;
        let longestRequirement = 'none';
        if (bottleneck.seconds > 0) {
            time = formatDuration(bottleneck.seconds);
            longestRequirement = bottleneck.resource;
        } else if (estimates.some(estimate => estimate.needsAscension)) {
            time = 'ready after ascending';
        } else if (notEstimated.length > 0) {
            time = 'unknown';
            longestRequirement = `${notEstimated.join(' and ')} (not estimated)`;
        } else {
            time = 'ready now';
        }
        // Past Exalt 7's time limit, cube gains shrink every second, so the
        // estimate (current rates kept) is too short.
        const limitedTime = gameData.singularityChallenges?.limitedTime;
        const exalt7Overtime = limitedTime?.enabled === true
            && gameData.singChallengeTimer > this.#exalt7TimeLimit(limitedTime.completions);

        this.#showPlatonicUpgradeEstimate(
            `Time until next level: ${time}${exalt7Overtime ? ' (Exalt 7 overtime: will take longer)' : ''}`
            + `\nLongest requirement: ${longestRequirement}`
        );
    }

    // The game's calculateExalt6TimeLimit (the game's code numbers Exalt 7 as 6).
    #exalt7TimeLimit(completions: number): number {
        return completions >= 10
            ? 114 - 6 * (completions - 10)
            : 660 - 60 * completions;
    }
}
