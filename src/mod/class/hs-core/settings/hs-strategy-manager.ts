import { HSAutosingStrategy, AutosingStrategyPhase, phases, AOAG_PHASE_ID, AOAG_PHASE_NAME, createDefaultAoagPhase, CorruptionLoadoutDefinition } from "../../../types/module-types/hs-autosing-types";
import { HSModuleManager } from "../module/hs-module-manager";
import { HSStorage } from "../hs-storage";
import { HSGlobal } from "../hs-global";
import { HSLogger } from "../hs-logger";
import manifest from '../../../resource/json/strategies/manifest.json';

export class HSStrategyManager {
    static #strategies: HSAutosingStrategy[] = [];

    static getStrategies(): HSAutosingStrategy[] {
        return this.#strategies;
    }

    static setStrategies(strategies: HSAutosingStrategy[]) {
        this.#strategies = strategies;
    }

    static addStrategy(strategy: HSAutosingStrategy) {
        this.#strategies.push(strategy);
    }

    static removeStrategyByName(strategyName: string) {
        this.#strategies = this.#strategies.filter(s => s.strategyName !== strategyName);
    }

    static getDefaultStrategyNames(): string[] {
        const manifestArr: string[] = Array.isArray(manifest) ? manifest : JSON.parse(manifest);
        return manifestArr.map((filename: string) => filename.replace(/\.json$/, ""));
    }

    static ensureAoagPhase(strategy: HSAutosingStrategy): HSAutosingStrategy {
        if (!strategy) return strategy;

        const cloned = JSON.parse(JSON.stringify(strategy)) as HSAutosingStrategy;

        if (!Array.isArray(cloned.strategy)) cloned.strategy = [];

        if (!cloned.aoagPhase) {
            const aoagIndex = cloned.strategy.findIndex(p => p.phaseId === AOAG_PHASE_ID);
            if (aoagIndex !== -1) {
                const [aoagFromList] = cloned.strategy.splice(aoagIndex, 1);
                cloned.aoagPhase = aoagFromList;
            } else {
                cloned.aoagPhase = createDefaultAoagPhase();
            }
        }

        if (cloned.aoagPhase && cloned.aoagPhase.phaseId !== AOAG_PHASE_ID) {
            cloned.aoagPhase.phaseId = AOAG_PHASE_ID;
        }

        return cloned;
    }

    static ensureCorruptionLoadouts(strategy: HSAutosingStrategy): HSAutosingStrategy {
        if (!strategy) return strategy;

        const cloned = JSON.parse(JSON.stringify(strategy)) as HSAutosingStrategy;
        if (!Array.isArray(cloned.corruptionLoadouts)) cloned.corruptionLoadouts = [];

        const loadouts = cloned.corruptionLoadouts as CorruptionLoadoutDefinition[];
        const usedNames = new Set(loadouts.map(l => l.name));

        const makeUniqueName = (baseName: string): string => {
            let name = baseName;
            let counter = 2;
            while (usedNames.has(name)) {
                name = `${baseName} (${counter})`;
                counter++;
            }
            usedNames.add(name);
            return name;
        };

        const ensureLoadoutForPhase = (phase: AutosingStrategyPhase | undefined) => {
            if (!phase) return;
            if (phase.corruptionLoadoutName === undefined) {
                const isAoag = phase.phaseId === AOAG_PHASE_ID;
                const baseName = isAoag ? `Loadout ${AOAG_PHASE_NAME}` : `Loadout ${phase.startPhase}-${phase.endPhase}`;
                const name = makeUniqueName(baseName);
                loadouts.push({ name, loadout: { ...phase.corruptions } });
                phase.corruptionLoadoutName = name;
                return;
            }

            if (phase.corruptionLoadoutName && !usedNames.has(phase.corruptionLoadoutName)) {
                usedNames.add(phase.corruptionLoadoutName);
                loadouts.push({ name: phase.corruptionLoadoutName, loadout: { ...phase.corruptions } });
            }
        };

        cloned.strategy?.forEach(phase => ensureLoadoutForPhase(phase));
        ensureLoadoutForPhase(cloned.aoagPhase);

        return cloned;
    }

    static validateStrategy(strategy: HSAutosingStrategy, context = '') {
        let normalized = HSStrategyManager.ensureAoagPhase(strategy);
        normalized = HSStrategyManager.ensureCorruptionLoadouts(normalized);
        strategy = normalized;

        if (!strategy) throw new Error('Strategy is undefined');
        if (!('strategyName' in strategy)) throw new Error('Strategy is missing strategyName property');
        if (!('strategy' in strategy)) throw new Error('Strategy is missing strategy property');
        if (!Array.isArray(strategy.strategy)) throw new Error('Strategy.strategy must be an array');
        const components = strategy.strategy as AutosingStrategyPhase[];
        if (components.length === 0) {
            throw new Error('Strategy has no components');
        }
        const aoagPhase = strategy.aoagPhase;
        if (!aoagPhase) {
            throw new Error(`Strategy is missing "${AOAG_PHASE_NAME}" phase`);
        }
        if (!aoagPhase.corruptions) {
            throw new Error(`"${AOAG_PHASE_NAME}" phase has no corruptions defined`);
        }
        if (!Array.isArray(aoagPhase.strat) || aoagPhase.strat.length === 0) {
            throw new Error(`"${AOAG_PHASE_NAME}" phase must have at least one action`);
        }

        const loadouts = strategy.corruptionLoadouts ?? [];
        const loadoutNames = loadouts.map(l => l.name);
        const uniqueNames = new Set(loadoutNames);
        if (uniqueNames.size !== loadoutNames.length) {
            throw new Error('Corruption loadout names must be unique.');
        }

        let remainingPhases = [...phases];

        for (let i = 0; i < components.length; i++) {
            const component = components[i];
            const { startPhase, endPhase, corruptions, strat: challenges } = component;

            if (!corruptions) {
                throw new Error(
                    `Component ${i + 1} (${startPhase} → ${endPhase}) has no corruptions defined`,
                );
            }

            if (component.corruptionLoadoutName && !loadoutNames.includes(component.corruptionLoadoutName)) {
                throw new Error(
                    `Component ${i + 1} (${startPhase} → ${endPhase}) references missing corruption loadout "${component.corruptionLoadoutName}"`,
                );
            }

            if (!Array.isArray(challenges) || challenges.length === 0) {
                throw new Error(
                    `Component ${i + 1} (${startPhase} → ${endPhase}) must have at least one challenge`,
                );
            }

            if (remainingPhases[0] !== startPhase) {
                throw new Error(
                    `Component ${i + 1} must start at "${remainingPhases[0]}", got "${startPhase}"`,
                );
            }

            const endIndex = remainingPhases.indexOf(endPhase);
            if (endIndex === -1) {
                throw new Error(
                    `Component ${i + 1} ends at "${endPhase}", which is not valid or already consumed`,
                );
            }

            remainingPhases = remainingPhases.slice(endIndex);
        }

        if (remainingPhases.length > 1) {
            throw new Error(
                `Uncovered phases: ${remainingPhases.join(', ')}`,
            );
        }

        if (aoagPhase?.corruptionLoadoutName && !loadoutNames.includes(aoagPhase.corruptionLoadoutName)) {
            throw new Error(
                `"${AOAG_PHASE_NAME}" phase references missing corruption loadout "${aoagPhase.corruptionLoadoutName}"`,
            );
        }
    }

    static resolveStrategyActionIdState(strategy: HSAutosingStrategy): {
        state: 'old' | 'new' | 'none' | 'invalid';
        reason: 'old-only' | 'new-only' | 'none' | 'mixed' | 'shared-only' | 'unknown-only' | 'shared-and-unknown-only';
        oldOnlyCount: number;
        newOnlyCount: number;
        sharedCount: number;
        unknownCount: number;
    } {
        const oldToNewActionIds: Record<number, number> = {
            101: 101, 102: 102, 103: 103, 104: 104, 105: 301, 106: 302, 107: 303, 108: 152, 109: 402,
            110: 400, 111: 151, 112: 304, 113: 305, 114: 306, 115: 153, 116: 215, 117: 211, 118: 212,
            119: 213, 120: 214, 121: 901, 201: 401, 301: 601, 302: 602, 303: 603, 304: 604, 305: 605,
            306: 606, 307: 607, 308: 608, 309: 609, 310: 610, 999: 902,
            200: 200, 202: 202,
            154: 154, 155: 155,
            701: 701, 702: 702, 703: 703, 704: 704, 705: 705, 706: 706, 707: 707, 708: 708, 709: 709,
            903: 903
        };

        const oldIdSet = new Set<number>(Object.keys(oldToNewActionIds).map(Number));
        const newIdSet = new Set<number>(Object.values(oldToNewActionIds));

        const allIds: number[] = [];
        const collectIds = (challenge: { challengeNumber?: number }) => {
            if (challenge.challengeNumber !== undefined && challenge.challengeNumber >= 100) allIds.push(challenge.challengeNumber);
        };
        strategy.strategy?.forEach(phase => phase.strat?.forEach(collectIds));
        strategy.aoagPhase?.strat?.forEach(collectIds);

        let oldOnlyCount = 0;
        let newOnlyCount = 0;
        let sharedCount = 0;
        let unknownCount = 0;

        for (const id of allIds) {
            const isOld = oldIdSet.has(id);
            const isNew = newIdSet.has(id);

            if (isOld && isNew) {
                sharedCount++;
            } else if (isOld) {
                oldOnlyCount++;
            } else if (isNew) {
                newOnlyCount++;
            } else {
                unknownCount++;
            }
        }

        const hasOldOnly = oldOnlyCount > 0;
        const hasNewOnly = newOnlyCount > 0;

        if (hasOldOnly && !hasNewOnly) {
            return { state: 'old', reason: 'old-only', oldOnlyCount, newOnlyCount, sharedCount, unknownCount };
        }

        if (hasNewOnly && !hasOldOnly) {
            return { state: 'new', reason: 'new-only', oldOnlyCount, newOnlyCount, sharedCount, unknownCount };
        }

        if (allIds.length === 0) {
            return { state: 'none', reason: 'none', oldOnlyCount, newOnlyCount, sharedCount, unknownCount };
        }

        if (hasOldOnly && hasNewOnly) {
            return { state: 'invalid', reason: 'mixed', oldOnlyCount, newOnlyCount, sharedCount, unknownCount };
        }

        if (sharedCount > 0 && unknownCount === 0) {
            return { state: 'invalid', reason: 'shared-only', oldOnlyCount, newOnlyCount, sharedCount, unknownCount };
        }

        if (sharedCount === 0 && unknownCount > 0) {
            return { state: 'invalid', reason: 'unknown-only', oldOnlyCount, newOnlyCount, sharedCount, unknownCount };
        }

        return { state: 'invalid', reason: 'shared-and-unknown-only', oldOnlyCount, newOnlyCount, sharedCount, unknownCount };
    }

    static getMergedStrategyOptions() {
        const defaultNames = HSStrategyManager.getDefaultStrategyNames();
        const manifestSet = new Set(defaultNames);
        const defaultStrategiesOptions = defaultNames.map(name => ({ text: name, value: name, isDefault: true }));
        const userStrategies = HSStrategyManager.getStrategies().filter(s => !manifestSet.has(s.strategyName));
        const userStrategiesOptions = userStrategies.map(s => ({ text: s.strategyName, value: s.strategyName, isDefault: false }));
        return { defaultStrategiesOptions, userStrategiesOptions };
    }

    static saveStrategyToStorage(
        strategy: HSAutosingStrategy,
        strategyName?: string,
        context = ''
    ): { strategy: HSAutosingStrategy; isUpdate: boolean; saved: boolean } {
        const storageMod = HSModuleManager.getModule<HSStorage>('HSStorage');
        if (!storageMod) {
            throw new Error("Could not find Storage Module");
        }

        let strategies: HSAutosingStrategy[] | null = storageMod.getData<HSAutosingStrategy[]>(HSGlobal.HSSettings.strategiesKey);
        if (!Array.isArray(strategies)) {
            strategies = [];
        }

        let normalizedStrategy = HSStrategyManager.ensureAoagPhase(strategy);
        normalizedStrategy = HSStrategyManager.ensureCorruptionLoadouts(normalizedStrategy);

        const beforeNormalize = JSON.stringify(normalizedStrategy);
        HSStrategyManager.migrateStrategyActionIdsAuto(normalizedStrategy, 'toNew', context);
        if (beforeNormalize !== JSON.stringify(normalizedStrategy)) {
            HSLogger.log(`saveStrategyToStorage: normalized strategy "${normalizedStrategy.strategyName}" to new special action IDs`, context);
        } else {
            HSLogger.log(`saveStrategyToStorage: strategy "${normalizedStrategy.strategyName}" already uses new special action IDs — no change needed`, context);
        }

        HSStrategyManager.validateStrategy(normalizedStrategy, context);
        const isUpdate = !!strategyName;
        const nameExists = strategies.some(s => {
            if (s.strategyName !== normalizedStrategy.strategyName) return false;
            if (!isUpdate) return true;
            return s.strategyName !== strategyName;
        });

        if (nameExists) {
            throw new Error(`Strategy with name "${normalizedStrategy.strategyName}" already exists.`);
        }

        let updatedStrategies = strategies;

        if (isUpdate) {
            updatedStrategies = strategies.filter(
                s => s.strategyName !== strategyName
            );

            HSStrategyManager.removeStrategyByName(strategyName!);
        }

        updatedStrategies = updatedStrategies.concat(normalizedStrategy);
        HSStrategyManager.addStrategy(normalizedStrategy);

        const defaultNames = HSStrategyManager.getDefaultStrategyNames();
        const saved = storageMod.setData(
            HSGlobal.HSSettings.strategiesKey,
            updatedStrategies.filter(s => !defaultNames.includes(s.strategyName))
        );
        if (!saved) {
            HSLogger.warn(`Could not save Strategy to localStorage`, context);
        } else {
            HSLogger.debug(() => `<green>Strategy ${isUpdate ? "updated" : "saved"} to localStorage</green>`, context);
        }

        return { strategy: normalizedStrategy, isUpdate, saved };
    }

    static deleteStrategyFromStorage(strategyName: string, context = ''): boolean {
        const storageMod = HSModuleManager.getModule<HSStorage>('HSStorage');
        if (!storageMod) {
            throw new Error("Could not find Storage Module");
        }

        let strategies: HSAutosingStrategy[] | null = storageMod.getData<HSAutosingStrategy[]>(HSGlobal.HSSettings.strategiesKey);
        if (!Array.isArray(strategies)) {
            strategies = [];
        }

        const updatedStrategies = strategies.filter(s => s.strategyName !== strategyName);
        HSStrategyManager.removeStrategyByName(strategyName);
        const saved = storageMod.setData(HSGlobal.HSSettings.strategiesKey, updatedStrategies);
        if (!saved) {
            HSLogger.warn(`Could not delete Strategy from localStorage`, context);
        }
        HSLogger.log(`Strategy "${strategyName}" deleted.`, context);
        return saved;
    }

    static migrateAndSaveAllUserStrategies(context = ''): {
        success: boolean;
        saved: boolean;
        migratedStrategies: number;
        droppedDefaults: number;
        totalStrategies: number;
        userStrategies: HSAutosingStrategy[];
        invalidStrategies: string[];
    } {
        const storageMod = HSModuleManager.getModule<HSStorage>('HSStorage');
        if (!storageMod) {
            throw new Error("Could not find Storage Module");
        }

        const loaded = storageMod.getData<HSAutosingStrategy[]>(HSGlobal.HSSettings.strategiesKey);
        const list = loaded ? (Array.isArray(loaded) ? loaded : [loaded]) : [];

        const defaultNames = new Set(HSStrategyManager.getDefaultStrategyNames());
        const userStrategies = list.filter(strategy => !defaultNames.has(strategy.strategyName));
        const droppedDefaults = list.length - userStrategies.length;

        const invalidStrategies: string[] = [];
        for (const strategy of userStrategies) {
            const state = HSStrategyManager.resolveStrategyActionIdState(strategy);
            if (state.state === 'invalid') {
                invalidStrategies.push(`${strategy.strategyName} (${state.reason})`);
            }
        }

        if (invalidStrategies.length > 0) {
            return {
                success: false,
                saved: false,
                migratedStrategies: 0,
                droppedDefaults,
                totalStrategies: list.length,
                userStrategies,
                invalidStrategies
            };
        }

        let migratedStrategies = 0;
        for (const strategy of userStrategies) {
            const before = JSON.stringify(strategy);
            HSStrategyManager.migrateStrategyActionIdsAuto(strategy, 'toOld', context);
            if (before !== JSON.stringify(strategy)) {
                migratedStrategies++;
            }
        }

        const saved = storageMod.setData(HSGlobal.HSSettings.strategiesKey, userStrategies);
        if (saved) {
            HSStrategyManager.setStrategies(userStrategies.map(s => HSStrategyManager.ensureCorruptionLoadouts(HSStrategyManager.ensureAoagPhase(s))));
        }

        return {
            success: saved,
            saved,
            migratedStrategies,
            droppedDefaults,
            totalStrategies: list.length,
            userStrategies,
            invalidStrategies
        };
    }

    static parseStoredStrategies(context = ''): HSAutosingStrategy[] | null {
        const storageMod = HSModuleManager.getModule<HSStorage>('HSStorage');
        if (!storageMod) {
            HSLogger.warn(`Could not find HSStorage module`, context);
            return null;
        }

        const loaded = storageMod.getData<HSAutosingStrategy[]>(HSGlobal.HSSettings.strategiesKey);
        if (!loaded) {
            return null;
        }

        const list = Array.isArray(loaded) ? loaded : [loaded];
        const defaultStrategyNames = new Set(HSStrategyManager.getDefaultStrategyNames());
        const userStrategies = list.filter(strategy => !defaultStrategyNames.has(strategy.strategyName));
        const didDropDefaults = userStrategies.length !== list.length;

        let didNormalize = false;
        for (const strategy of userStrategies) {
            const before = JSON.stringify(strategy);
            HSStrategyManager.migrateStrategyActionIdsAuto(strategy, 'toNew', context);
            if (before !== JSON.stringify(strategy)) {
                HSLogger.log(`Normalized strategy "${strategy.strategyName}" to new special action IDs during load`, context);
                didNormalize = true;
            } else {
                HSLogger.log(`Strategy "${strategy.strategyName}" did not require normalization`, context);
            }
        }

        if (didDropDefaults || didNormalize) {
            storageMod.setData(HSGlobal.HSSettings.strategiesKey, userStrategies);
        }

        return userStrategies.map(s => HSStrategyManager.ensureCorruptionLoadouts(HSStrategyManager.ensureAoagPhase(s)));
    }

    static migrateStrategyActionIdsAuto(strategy: HSAutosingStrategy, target: 'toNew' | 'toOld', context = ''): HSAutosingStrategy {
        const oldToNewActionIds: Record<number, number> = {
            101: 101, 102: 102, 103: 103, 104: 104, 105: 301, 106: 302, 107: 303, 108: 152, 109: 402,
            110: 400, 111: 151, 112: 304, 113: 305, 114: 306, 115: 153, 116: 215, 117: 211, 118: 212,
            119: 213, 120: 214, 121: 901, 201: 401, 301: 601, 302: 602, 303: 603, 304: 604, 305: 605,
            306: 606, 307: 607, 308: 608, 309: 609, 310: 610, 999: 902,
            200: 200, 202: 202,
            154: 154, 155: 155,
            701: 701, 702: 702, 703: 703, 704: 704, 705: 705, 706: 706, 707: 707, 708: 708, 709: 709,
            903: 903
        };
        const newToOldActionIds = Object.fromEntries(
            Object.entries(oldToNewActionIds).map(([oldId, newId]) => [newId, Number(oldId)])
        );
        const oldIdSet = new Set<number>(Object.keys(oldToNewActionIds).map(Number));
        const newIdSet = new Set<number>(Object.values(oldToNewActionIds));
        const oldOnlyIdSet = new Set<number>([...oldIdSet].filter(id => !newIdSet.has(id)));
        const newOnlyIdSet = new Set<number>([...newIdSet].filter(id => !oldIdSet.has(id)));

        const allIds: number[] = [];
        const collectIds = (challenge: { challengeNumber?: number }) => {
            if (challenge.challengeNumber !== undefined && challenge.challengeNumber >= 100) allIds.push(challenge.challengeNumber);
        };
        strategy.strategy?.forEach(phase => phase.strat?.forEach(collectIds));
        strategy.aoagPhase?.strat?.forEach(collectIds);

        let oldCount = 0, newCount = 0;
        for (const id of allIds) {
            if (oldToNewActionIds[id]) oldCount++;
            if (newToOldActionIds[id]) newCount++;
        }

        let oldOnlyCount = 0, newOnlyCount = 0, sharedCount = 0, unknownCount = 0;
        const unknownIds: number[] = [];

        for (const id of allIds) {
            const isOld = oldIdSet.has(id);
            const isNew = newIdSet.has(id);

            if (isOld && isNew) {
                sharedCount++;
            } else if (isOld) {
                oldOnlyCount++;
            } else if (isNew) {
                newOnlyCount++;
            } else {
                unknownCount++;
                unknownIds.push(id);
            }
        }

        const allMatchOldState = oldOnlyCount > 0 && newOnlyCount === 0;
        const allMatchNewState = newOnlyCount > 0 && oldOnlyCount === 0;
        const allShared = !allMatchOldState && !allMatchNewState && sharedCount > 0;
        const unknownSuffix = unknownIds.length > 0 ? ` [${unknownIds.join(', ')}]` : '';

        if (allMatchOldState) {
            HSLogger.debug(() => `Strategy "${strategy.strategyName}": all special action IDs match OLD state (oldOnly=${oldOnlyCount}, newOnly=${newOnlyCount}, shared=${sharedCount}, unknown=${unknownCount}${unknownSuffix})`, context);
        } else if (allMatchNewState) {
            HSLogger.debug(() => `Strategy "${strategy.strategyName}": all special action IDs match NEW state (oldOnly=${oldOnlyCount}, newOnly=${newOnlyCount}, shared=${sharedCount}, unknown=${unknownCount}${unknownSuffix})`, context);
        } else if (allShared) {
            HSLogger.debug(() => `Strategy "${strategy.strategyName}": all detected special action IDs are shared between OLD and NEW mappings (shared=${sharedCount}, unknown=${unknownCount}${unknownSuffix})`, context);
        } else {
            HSLogger.warn(`Strategy "${strategy.strategyName}": mixed special action ID states detected (oldOnly=${oldOnlyCount}, newOnly=${newOnlyCount}, shared=${sharedCount}, unknown=${unknownCount}${unknownSuffix})`, context);
        }

        HSLogger.debug(() => `Strategy "${strategy.strategyName}": migrateStrategyActionIdsAuto stats totalIds=${allIds.length}, oldCount=${oldCount}, newCount=${newCount}, target=${target}`, context);

        let map: Record<number, number> | null = null;
        let direction: 'old->new' | 'new->old' | 'none' = 'none';

        if (target === 'toNew') {
            if (newOnlyCount > 0 && oldOnlyCount === 0) {
                HSLogger.debug(() => `Strategy "${strategy.strategyName}": already uses new SA IDs, skipping.`, context);
                return strategy;
            }
            if (oldOnlyCount > 0 && newOnlyCount === 0) {
                map = oldToNewActionIds;
                direction = 'old->new';
            }
        } else {
            if (oldOnlyCount > 0 && newOnlyCount === 0) {
                HSLogger.debug(() => `Strategy "${strategy.strategyName}": already uses old SA IDs, skipping.`, context);
                return strategy;
            }
            if (newOnlyCount > 0 && oldOnlyCount === 0) {
                map = newToOldActionIds;
                direction = 'new->old';
            }
        }

        if (!map) {
            if (oldOnlyCount > 0 && newOnlyCount > 0) {
                HSLogger.warn(`Strategy "${strategy.strategyName}": skipping migration (reason=mixed) because IDs are mixed between OLD and NEW states.`, context);
            } else {
                let reason = 'no-exclusive-ids';
                if (sharedCount > 0 && unknownCount === 0) {
                    reason = 'shared-only';
                } else if (sharedCount === 0 && unknownCount > 0) {
                    reason = 'unknown-only';
                } else if (sharedCount > 0 && unknownCount > 0) {
                    reason = 'shared-and-unknown-only';
                }
                HSLogger.debug(() => `Strategy "${strategy.strategyName}": no exclusive old/new IDs detected, skipping migration (reason=${reason}).`, context);
            }
            return strategy;
        }

        let migratedCount = 0;
        const migrateChallenge = (challenge: { challengeNumber?: number }) => {
            const challengeId = challenge.challengeNumber;
            if (!challengeId) return;
            const isMigrateCandidate =
                (direction === 'old->new' && oldOnlyIdSet.has(challengeId)) ||
                (direction === 'new->old' && newOnlyIdSet.has(challengeId));
            if (isMigrateCandidate && map![challengeId]) {
                challenge.challengeNumber = map![challengeId];
                migratedCount++;
            }
        };

        strategy.strategy?.forEach(phase => phase.strat?.forEach(migrateChallenge));
        strategy.aoagPhase?.strat?.forEach(migrateChallenge);

        HSLogger.debug(() => `Strategy "${strategy.strategyName}": migrated ${migratedCount} unambiguous special action IDs (${direction})`, context);
        return strategy;
    }
}
