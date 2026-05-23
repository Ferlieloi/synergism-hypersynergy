import type { HeaterResultArrayKey, HeaterTypeSemanticId, HeaterResultSectionId, RowBasedResultKey } from "../../../types/data-types/hs-heater-types";
export type { HeaterTypeSemanticId, HeaterResultSectionId } from "../../../types/data-types/hs-heater-types";

export type HeaterResultSectionConfig = {
    title: string;
    showP4x4: boolean;
    effectHeader: string;
    order: number;
};

type ResultKey = HeaterResultArrayKey;

type HeaterResultTypeConfig = {
    label: string;
    section: HeaterResultSectionId;
    icon?: string;
    rowLabels?: readonly string[];
    rowIcons?: readonly string[];
};

const HEATER_RESULT_SECTION_CONFIG: Record<HeaterResultSectionId, HeaterResultSectionConfig> = {
    common: {
        title: "Common Loadouts",
        showP4x4: false,
        effectHeader: "Effect",
        order: 0,
    },
    p4x4: {
        title: "p4x4 (pre-AoAG) Loadouts",
        showP4x4: true,
        effectHeader: "Effect",
        order: 1,
    },
    hybrid: {
        title: "Hybrid Loadouts",
        showP4x4: false,
        effectHeader: "Oct Effect",
        order: 2,
    },
};

const HEATER_RESULT_TYPE_CONFIG: Record<ResultKey, HeaterResultTypeConfig> = {
    luck: {
        label: "Luck",
        section: "common",
        icon: "Pictures/Default/BlueberryLuck2.png",
    },
    rLuck: {
        label: "Red Luck",
        section: "common",
        icon: "Pictures/Default/BlueberryFreeRedLuckUpgrades.png",
    },
    allAmb: {
        label: "All Ambrosia",
        section: "common",
        icon: "Pictures/Default/BlueberryFreeGenerationLevels.png",
    },
    quarks: {
        label: "Quarks",
        section: "common",
        icon: "Pictures/Default/BlueberryQuarks2.png",
    },
    cubes: {
        label: "3-7D Cubes",
        section: "common",
        icon: "Pictures/Default/BlueberryCubes.png",
    },
    oct: {
        label: "Octeracts",
        section: "common",
        icon: "Pictures/Default/BlueberryCubes3.png",
    },
    obt: {
        label: "Obtainium",
        section: "common",
        icon: "Pictures/Default/BlueberryObtainium.png",
    },
    off: {
        label: "Offering",
        section: "common",
        icon: "Pictures/Default/BlueberryOffering.png",
    },
    hyperflux: {
        label: "Hyperflux (H0–H7)",
        section: "p4x4",
        rowLabels: ["H0", "H1", "H2", "H3", "H4", "H5", "H6", "H7"],
        rowIcons: Array(8).fill("Pictures/Default/BlueberryHyperflux.png"),
    },
    gen: {
        label: "Amb Gen (Gen1–Gen3)",
        section: "hybrid",
        rowLabels: ["Gen 1 + Oct", "Gen 2 + Oct", "Gen 3 + Oct"],
        rowIcons: Array(3).fill("Pictures/Default/BlueberryBrickOfLead.png"),
    },
    ambOct: {
        label: "Max Amb + Oct",
        section: "hybrid",
        icon: "Pictures/Default/BlueberryLuck4.png",
    },
};

const HEATER_RESULT_SECTION_ORDERED_IDS = Object.entries(HEATER_RESULT_SECTION_CONFIG)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([key]) => key as HeaterResultSectionId);

export type HeaterResultSectionDef = HeaterResultSectionConfig & {
    sectionId: HeaterResultSectionId;
    keys: ResultKey[];
};

export function getHeaterResultSectionDefinitions(): HeaterResultSectionDef[] {
    const keysBySection = new Map<HeaterResultSectionId, ResultKey[]>();
    for (const key of Object.keys(HEATER_RESULT_TYPE_CONFIG) as ResultKey[]) {
        const section = HEATER_RESULT_TYPE_CONFIG[key].section;
        const group = keysBySection.get(section);
        if (group) group.push(key);
        else keysBySection.set(section, [key]);
    }

    return HEATER_RESULT_SECTION_ORDERED_IDS
        .map((sectionId) => ({
            sectionId,
            ...HEATER_RESULT_SECTION_CONFIG[sectionId],
            keys: keysBySection.get(sectionId) ?? [],
        }))
        .filter((section) => section.keys.length > 0);
}

export function getHeaterTypeConfig(key: ResultKey): HeaterResultTypeConfig | null {
    return HEATER_RESULT_TYPE_CONFIG[key] ?? null;
}

export type HeaterBranchIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type HeaterBranchDefinition = {
    label: string;
    resultKeys: ResultKey[];
};

export const HEATER_BRANCH_DEFINITIONS: ReadonlyArray<HeaterBranchDefinition> = [
    { label: "Luck", resultKeys: ["luck", "rLuck", "allAmb"] },
    { label: "Quarks", resultKeys: ["quarks"] },
    { label: "3-7D Cubes", resultKeys: ["cubes"] },
    { label: "Octeracts", resultKeys: ["oct"] },
    { label: "Obtainium + Offering", resultKeys: ["obt", "off"] },
    { label: "Hyperflux (p4x4, pre-AoAG)", resultKeys: ["hyperflux"] },
    { label: "Amb Generation + Oct", resultKeys: ["gen"] },
    { label: "Max Amb + Oct", resultKeys: ["ambOct"] },
];

export function getHeaterTypeBranchIndex(semanticId: string): HeaterBranchIndex | null {
    const parsed = parseHeaterTypeSemanticId(semanticId);
    if (!parsed) return null;

    const branchIndex = HEATER_BRANCH_DEFINITIONS.findIndex((branch) =>
        branch.resultKeys.includes(parsed.baseKey)
    );

    return branchIndex >= 0 ? (branchIndex as HeaterBranchIndex) : null;
}

export function getHeaterTypeRowCount(key: ResultKey): number {
    return HEATER_RESULT_TYPE_CONFIG[key]?.rowLabels?.length ?? 1;
}

export function getHeaterTypeEntries(): Array<[ResultKey, HeaterResultTypeConfig]> {
    return Object.entries(HEATER_RESULT_TYPE_CONFIG) as Array<[ResultKey, HeaterResultTypeConfig]>;
}


// ================================================================
// Semantic ID / Resolver Helpers
// ================================================================

function isResultKey(value: string): value is ResultKey {
    return value in HEATER_RESULT_TYPE_CONFIG;
}

function isRowBasedResultKey(value: string): value is RowBasedResultKey {
    return getHeaterTypeRowCount(value as ResultKey) > 1;
}

export function buildHeaterTypeSemanticId(key: ResultKey, rowIndex?: number): HeaterTypeSemanticId {
    return rowIndex === undefined ? key as HeaterTypeSemanticId : `${key}:${rowIndex}` as HeaterTypeSemanticId;
}

export function isHeaterTypeSemanticId(semanticId: string): semanticId is HeaterTypeSemanticId {
    return parseHeaterTypeSemanticId(semanticId) !== null;
}

type ParsedHeaterTypeSemanticId =
    | { baseKey: RowBasedResultKey; rowIndex: number }
    | { baseKey: Exclude<ResultKey, RowBasedResultKey>; rowIndex: null };

function parseHeaterTypeSemanticId(semanticId: string): ParsedHeaterTypeSemanticId | null {
    const normalized = semanticId.trim();
    if (!normalized || normalized === "none") return null;

    const [baseKeyRaw, rowIndexRaw] = normalized.split(":");
    if (!baseKeyRaw) return null;

    if (rowIndexRaw !== undefined) {
        if (!isRowBasedResultKey(baseKeyRaw) || !/^\d+$/.test(rowIndexRaw)) return null;
        const rowIndex = Number(rowIndexRaw);
        const config = getHeaterTypeConfig(baseKeyRaw as ResultKey);
        if (!config?.rowLabels || rowIndex < 0 || rowIndex >= config.rowLabels.length) return null;
        return { baseKey: baseKeyRaw as RowBasedResultKey, rowIndex };
    }

    if (!isResultKey(baseKeyRaw)) return null;
    return { baseKey: baseKeyRaw as Exclude<ResultKey, RowBasedResultKey>, rowIndex: null };
}

export function resolveHeaterTypeLabel(key: string): string | null {
    if (key === "none") return "None";
    const parsed = parseHeaterTypeSemanticId(key);
    if (!parsed) return null;

    const config = HEATER_RESULT_TYPE_CONFIG[parsed.baseKey];
    if (!config) return null;

    if (parsed.rowIndex !== null) {
        return config.rowLabels?.[parsed.rowIndex] ?? null;
    }

    return config.label;
}

export function resolveHeaterTypeIconSrc(semanticId: string): string | null {
    if (semanticId === "none") { return "Pictures/RedAmbrosia/RedAmbrosiaFreeTutorialLevels.png"; }

    const parsed = parseHeaterTypeSemanticId(semanticId);
    if (!parsed) return null;

    const config = HEATER_RESULT_TYPE_CONFIG[parsed.baseKey];
    if (!config) return null;

    if (parsed.rowIndex !== null) {
        return config.rowIcons?.[parsed.rowIndex] ?? null;
    }

    return config.icon ?? null;
}
