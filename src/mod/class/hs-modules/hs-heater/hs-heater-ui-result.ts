import { HSUI } from "../../hs-core/hs-ui";
import { HSLogger } from "../../hs-core/hs-logger";
import { HSQuickbarIconPickerController } from "../hs-qolQuickbarIconPicker";
import { escapeHtml } from "./hs-heater-utils";
import { buildResultTableHtmlFromNormalized } from "./hs-heater-ui-result-renderer";
import { clearHeaterIconOverride, getEffectiveHeaterIconSrc, getOverrideHeaterIconSrc, setHeaterIconOverride, } from "./hs-heater-icon-store";
import type { NormalizedHeaterResultEntry } from "./hs-heater-result-store";

// === Loadout Preview Metadata Type and Map ===
type LoadoutPreviewMeta = { iconFile: string };

const LOADOUT_UPGRADE_META_MAP = {
    ambrosiaTutorial:              { iconFile: 'BlueberryTutorial.png' },
    ambrosiaPatreon:               { iconFile: 'BlueberryPatreon.png' },
    ambrosiaObtainium1:            { iconFile: 'BlueberryObtainium.png' },
    ambrosiaOffering1:             { iconFile: 'BlueberryOffering.png' },
    ambrosiaHyperflux:             { iconFile: 'BlueberryHyperflux.png' },
    ambrosiaBrickOfLead:           { iconFile: 'BlueberryBrickOfLead.png' },
    ambrosiaFreeLuckUpgrades:      { iconFile: 'BlueberryFreeLuckUpgrades.png' },
    ambrosiaQuarks1:               { iconFile: 'BlueberryQuarks.png' },
    ambrosiaCubes1:                { iconFile: 'BlueberryCubes.png' },
    ambrosiaLuck1:                 { iconFile: 'BlueberryLuck.png' },
    ambrosiaBaseObtainium1:        { iconFile: 'BlueberryBaseObtainium1.png' },
    ambrosiaBaseOffering1:         { iconFile: 'BlueberryBaseOffering1.png' },
    ambrosiaSingReduction1:        { iconFile: 'BlueberrySingReduction.png' },
    ambrosiaTalismanBonusRuneLevel:{ iconFile: 'BlueberryTalismanBonusRuneLevel.png' },
    ambrosiaFreeGenerationUpgrades:{ iconFile: 'BlueberryFreeGenerationLevels.png' },
    ambrosiaCubeQuark1:            { iconFile: 'BlueberryCubeQuark.png' },
    ambrosiaLuckQuark1:            { iconFile: 'BlueberryLuckQuark.png' },
    ambrosiaLuckCube1:             { iconFile: 'BlueberryLuckCube.png' },
    ambrosiaQuarkCube1:            { iconFile: 'BlueberryQuarkCube.png' },
    ambrosiaCubeLuck1:             { iconFile: 'BlueberryCubeLuck.png' },
    ambrosiaQuarkLuck1:            { iconFile: 'BlueberryQuarkLuck.png' },
    ambrosiaFreeRedLuckUpgrades:   { iconFile: 'BlueberryFreeRedLuckUpgrades.png' },
    ambrosiaQuarks2:               { iconFile: 'BlueberryQuarks2.png' },
    ambrosiaCubes2:                { iconFile: 'BlueberryCubes2.png' },
    ambrosiaLuck2:                 { iconFile: 'BlueberryLuck2.png' },
    ambrosiaBaseObtainium2:        { iconFile: 'BlueberryBaseObtainium2.png' },
    ambrosiaBaseOffering2:         { iconFile: 'BlueberryBaseOffering2.png' },
    ambrosiaInfiniteShopUpgrades1: { iconFile: 'BlueberryInfiniteShopUpgrades.png' },
    ambrosiaRuneOOMBonus:          { iconFile: 'BlueberryRuneOOMBonus.png' },
    ambrosiaFreeQuarkUpgrades:     { iconFile: 'BlueberryFreeQuarkUpgrades.png' },
    ambrosiaQuarks3:               { iconFile: 'BlueberryQuarks3.png' },
    ambrosiaCubes3:                { iconFile: 'BlueberryCubes3.png' },
    ambrosiaLuck3:                 { iconFile: 'BlueberryLuck3.png' },
    ambrosiaSingReduction2:        { iconFile: 'BlueberrySingReduction2.png' },
    ambrosiaInfiniteShopUpgrades2: { iconFile: 'BlueberryInfiniteShopUpgrades2.png' },
    ambrosiaLuck4:                 { iconFile: 'BlueberryLuck4.png' },
} as const satisfies Record<string, LoadoutPreviewMeta>;

// === Loadout Preview Upgrade Key Type ===
type LoadoutPreviewUpgradeKey = keyof typeof LOADOUT_UPGRADE_META_MAP;
type LoadoutPreviewItem = { key: LoadoutPreviewUpgradeKey; maxLevel: number };

// === Selector and ID Constants ===
const HEATER_RESULT_UI_SELECTORS = {
    modalBody:          '.hs-modal-body',
    resultsHeader:      '.hs-heater-results-topbar',
    previewId:          'hs-heater-loadout-preview',
    previewRow:         'hs-heater-loadout-preview-row',
    previewButton:      'hs-heater-preview-button',
    previewEmptyCell:   'hs-heater-preview-empty-cell',
    tooltipId:          'hs-heater-loadout-json-tooltip',
    copyLoadoutBtn:     'hs-heater-copy-loadout-btn',
    importLoadoutBtn:   'hs-heater-import-loadout-btn',
    jsonTooltipTrigger: 'hs-heater-json-tooltip-trigger',
    dataLoadout:        'data-loadout',
    importFileInputId:  'importBlueberries',
} as const;

// === Main UI Class ===
export class HSHeaterUIResult {

    // === State ===
    static #activeResultModal: HTMLElement | null = null;
    static #context = 'HSHeaterUIResult';

    static setActiveResultModal(modal: HTMLElement | null): void {
        this.#activeResultModal = modal;
    }

    static clearActiveResultModal(): void {
        this.#activeResultModal = null;
    }

    static #quickbarCloneCleanup: (() => void) | null = null;
    static #iconPicker = new HSQuickbarIconPickerController<string>({
        shouldIgnoreClickTarget: (target: Element) => {
            const modal = this.#activeResultModal;
            return !!(modal && modal.contains(target));
        },
        setSlotPickModeVisual: (semanticId: string, active: boolean) => {
            const modal = this.#activeResultModal;
            if (!modal) return;
            modal.querySelectorAll<HTMLButtonElement>('.hs-heater-type-icon-button').forEach((button) => {
                const matchId = button.dataset.heaterIconId;
                button.classList.toggle('hs-quickbar-slot-pickmode', !!active && matchId === semanticId);
            });
        },
        clearAllSlotPickModeVisuals: () => {
            const modal = this.#activeResultModal;
            if (!modal) return;
            modal.querySelectorAll<HTMLButtonElement>('.hs-heater-type-icon-button').forEach((button) => {
                button.classList.remove('hs-quickbar-slot-pickmode');
            });
        },
        assignIconToSlot: (semanticId: string, iconUrl: string) => {
            setHeaterIconOverride(semanticId, iconUrl);
            const modal = this.#activeResultModal;
            if (modal) {
                this.#refreshHeaterResultIconButtons(modal);
            }
        },
    });

    static #attachedModalHandlers = new WeakMap<HTMLElement, {
        onClick: (event: Event) => void;
        onShowOverlay: (event: Event) => void;
        onHideOverlay: (event: Event) => void;
        detach: () => void;
    }>();

    static #overlayState: {
        kind: 'preview' | 'json' | null;
        target: HTMLElement | null;
    } = {
        kind: null,
        target: null,
    };

    // === Metadata Maps ===
    static #loadoutUpgradeMetaMap = LOADOUT_UPGRADE_META_MAP;

    static #ambrosiaLoadoutPreviewRows: Array<Array<LoadoutPreviewItem | null>> = [
        [ 
            { key: 'ambrosiaTutorial',    maxLevel: 10 }, 
            { key: 'ambrosiaPatreon',     maxLevel: 1 }, 
            { key: 'ambrosiaObtainium1',  maxLevel: 2 }, 
            { key: 'ambrosiaOffering1',   maxLevel: 2 }, 
            { key: 'ambrosiaHyperflux',   maxLevel: 7 }, 
            { key: 'ambrosiaBrickOfLead', maxLevel: 25 }, 
            null 
        ],
        [ 
            { key: 'ambrosiaFreeLuckUpgrades',       maxLevel: 25 }, 
            { key: 'ambrosiaQuarks1',                maxLevel: 100 }, 
            { key: 'ambrosiaCubes1',                 maxLevel: 100 }, 
            { key: 'ambrosiaLuck1',                  maxLevel: 100 }, 
            { key: 'ambrosiaBaseObtainium1',         maxLevel: 20 }, 
            { key: 'ambrosiaBaseOffering1',          maxLevel: 40 }, 
            { key: 'ambrosiaSingReduction1',         maxLevel: 2 }, 
            { key: 'ambrosiaTalismanBonusRuneLevel', maxLevel: 100 }, 
            null 
        ],
        [ 
            { key: 'ambrosiaFreeGenerationUpgrades', maxLevel: 3 }, 
            { key: 'ambrosiaCubeQuark1',             maxLevel: 25 }, 
            { key: 'ambrosiaLuckQuark1',             maxLevel: 25 }, 
            { key: 'ambrosiaLuckCube1',              maxLevel: 25 }, 
            { key: 'ambrosiaQuarkCube1',             maxLevel: 25 }, 
            { key: 'ambrosiaCubeLuck1',              maxLevel: 25 }, 
            { key: 'ambrosiaQuarkLuck1',             maxLevel: 25 }, 
            null 
        ],
        [ 
            { key: 'ambrosiaFreeRedLuckUpgrades',   maxLevel: 40 }, 
            { key: 'ambrosiaQuarks2',               maxLevel: 100 }, 
            { key: 'ambrosiaCubes2',                maxLevel: 100 }, 
            { key: 'ambrosiaLuck2',                 maxLevel: 100 }, 
            { key: 'ambrosiaBaseObtainium2',        maxLevel: 30 }, 
            { key: 'ambrosiaBaseOffering2',         maxLevel: 60 }, 
            { key: 'ambrosiaInfiniteShopUpgrades1', maxLevel: 20 }, 
            { key: 'ambrosiaRuneOOMBonus',          maxLevel: 100 }, 
            null 
        ],
        [ 
            { key: 'ambrosiaFreeQuarkUpgrades',     maxLevel: 10 }, 
            { key: 'ambrosiaQuarks3',               maxLevel: 10 }, 
            { key: 'ambrosiaCubes3',                maxLevel: 100 }, 
            { key: 'ambrosiaLuck3',                 maxLevel: 100 }, 
            { key: 'ambrosiaSingReduction2',        maxLevel: 2 }, 
            { key: 'ambrosiaInfiniteShopUpgrades2', maxLevel: 20 }, 
            { key: 'ambrosiaLuck4',                 maxLevel: 50 }, 
            null 
        ],
    ];

    // === UI/DOM Update Methods ===
    static updateResultModalContent(modal: HTMLElement, normalizedEntries: NormalizedHeaterResultEntry[], selectedSemanticIds: Set<string> = new Set()): boolean {
        const body = modal.querySelector(HEATER_RESULT_UI_SELECTORS.modalBody);
        if (!body) return false;

        body.innerHTML = buildResultTableHtmlFromNormalized(normalizedEntries, selectedSemanticIds);
        modal.style.width = 'auto';
        modal.style.minWidth = '0';
        modal.style.maxWidth = 'none';
        this.populateResultsHeader(modal);
        this.#refreshHeaterResultIconButtons(modal);
        return true;
    }

    static populateResultsHeader(modal: HTMLElement): void {
        const header = modal.querySelector(HEATER_RESULT_UI_SELECTORS.resultsHeader) as HTMLElement | null;
        if (!header) return;

        // Disconnect previous observer and remove previous click listener before reinitializing
        this.#quickbarCloneCleanup?.();
        this.#quickbarCloneCleanup = null;

        header.innerHTML = '';

        const slotsSource = document.getElementById('hs-ambrosia-slots-wrapper');
        if (slotsSource) {
            const clone = slotsSource.cloneNode(true) as HTMLElement;
            clone.removeAttribute('id');
            // Strip child IDs to avoid duplicate DOM IDs
            clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
            header.appendChild(clone);
            this.#quickbarCloneCleanup = this.#setupQuickbarCloneLink(clone, slotsSource);
        }
    }

    // === Icon refresh / quickbar clone helpers ===

    static #refreshHeaterResultIconButtons(modal: HTMLElement): void {
        modal.querySelectorAll<HTMLButtonElement>('.hs-heater-type-icon-button[data-heater-icon-id]').forEach((button) => {
            const semanticId = button.dataset.heaterIconId;
            if (!semanticId) return;

            const img = button.querySelector<HTMLImageElement>('img.hs-heater-type-icon');
            if (img) {
                const effectiveIcon = getEffectiveHeaterIconSrc(semanticId);
                if (effectiveIcon) {
                    img.src = effectiveIcon;
                }
            }
            button.classList.toggle('hs-heater-type-icon-override', !!getOverrideHeaterIconSrc(semanticId));
        });
    }

    static #setupQuickbarCloneLink(clone: HTMLElement, slotsSource: HTMLElement): () => void {
        const originalSlots = Array.from(slotsSource.querySelectorAll<HTMLElement>('.blueberryLoadoutSlot'));
        const cloneSlots = Array.from(clone.querySelectorAll<HTMLElement>('.blueberryLoadoutSlot'));

        // Initial sync of hs-rainbow-border state from original to clone
        originalSlots.forEach((orig, i) => {
            cloneSlots[i]?.classList.toggle('hs-rainbow-border', orig.classList.contains('hs-rainbow-border'));
        });

        // Click delegation: clone slot click → original slot click
        const onCloneClick = (event: Event) => {
            const target = (event.target as HTMLElement | null)?.closest('.blueberryLoadoutSlot') as HTMLElement | null;
            if (!target) return;
            const idx = cloneSlots.indexOf(target);
            if (idx === -1) return;
            originalSlots[idx]?.click();
        };
        clone.addEventListener('click', onCloneClick);

        // MutationObserver: sync hs-rainbow-border from original slots to clone slots
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.attributeName !== 'class') continue;
                const originalEl = mutation.target as HTMLElement;
                const idx = originalSlots.indexOf(originalEl);
                if (idx === -1) continue;
                cloneSlots[idx]?.classList.toggle('hs-rainbow-border', originalEl.classList.contains('hs-rainbow-border'));
            }
        });
        originalSlots.forEach(slot => {
            observer.observe(slot, { attributes: true, attributeFilter: ['class'] });
        });

        return () => {
            clone.removeEventListener('click', onCloneClick);
            observer.disconnect();
        };
    }

    // === Loadout Preview/Tooltip Methods ===
    static showLoadoutPreview(button: HTMLElement): void {
        this.removeLoadoutPreview();

        const loadout = this.getLoadoutFromButton(button);
        if (!loadout) return;

        const preview = document.createElement('div');
        preview.id = HEATER_RESULT_UI_SELECTORS.previewId;
        preview.innerHTML = this.buildLoadoutPreviewHtml(loadout);
        preview.style.zIndex = String(HSUI.getHighestActiveModalZIndex() + 1);

        document.body.appendChild(preview);
        this.positionOverlayNearTarget(preview, button);
    }

    static removeLoadoutPreview(): void {
        const existing = document.getElementById(HEATER_RESULT_UI_SELECTORS.previewId);
        if (existing && existing.parentElement) {
            existing.parentElement.removeChild(existing);
        }
    }

    static showLoadoutJsonTooltip(trigger: HTMLElement): void {
        this.removeLoadoutJsonTooltip();
        const loadout = trigger.getAttribute(HEATER_RESULT_UI_SELECTORS.dataLoadout);
        if (!loadout) return;

        const tooltip = document.createElement('div');
        tooltip.id = HEATER_RESULT_UI_SELECTORS.tooltipId;
        tooltip.textContent = this.formatLoadoutJsonForTooltip(loadout);
        tooltip.style.zIndex = String(HSUI.getHighestActiveModalZIndex() + 1);

        document.body.appendChild(tooltip);
        this.positionOverlayNearTarget(tooltip, trigger);
    }

    static removeLoadoutJsonTooltip(): void {
        const existing = document.getElementById(HEATER_RESULT_UI_SELECTORS.tooltipId);
        if (existing && existing.parentElement) {
            existing.parentElement.removeChild(existing);
        }
    }

    static formatLoadoutJsonForTooltip(loadout: string): string {
        return loadout.replace(/,/g, ',\n');
    }

    static buildLoadoutPreviewHtml(loadout: Record<string, number>): string {
        return this.#ambrosiaLoadoutPreviewRows
            .map((row) => `<div class="${HEATER_RESULT_UI_SELECTORS.previewRow}">${row.map((item) => this.buildLoadoutPreviewCell(item, loadout)).join('')}</div>`)
            .join('');
    }

    static buildLoadoutPreviewCell(item: LoadoutPreviewItem | null, loadout: Record<string, number>): string {
        if (item === null) {
            return `
                <div class="ambrosiaBorder Exalt5x1">
                    <img src="Pictures/RedAmbrosia/AmbrosiaBorders.png" alt="Border" />
                </div>
            `;
        }

        const { key, maxLevel } = item;
        const level = Number(loadout[key] ?? 0);
        const upgradeMeta = this.#loadoutUpgradeMetaMap[key];
        if (!upgradeMeta) {
            return `<div class="${HEATER_RESULT_UI_SELECTORS.previewEmptyCell}"></div>`;
        }

        const imageUrl = `Pictures/Default/${upgradeMeta.iconFile}`;
        const imageClass = level > 0 ? 'dimmed' : 'superDimmed';
        const overlayText = level > 0 ? escapeHtml(String(level)) : '';

        const maxLevelClass = level >= maxLevel 
            ? 'maxBlueberryLevel' 
            : '';

        return `
            <button class="blueberryUpgrade relative-container ${HEATER_RESULT_UI_SELECTORS.previewButton}" type="button"> 
                <img src="${escapeHtml(imageUrl)}" class="${imageClass}" alt="${escapeHtml(key)}" />
                <div class="level-overlay ${maxLevelClass}">${overlayText}</div>
            </button>
        `;
    }

    static getLoadoutFromButton(button: HTMLElement): Record<string, number> | null {
        const loadout = button.getAttribute(HEATER_RESULT_UI_SELECTORS.dataLoadout);
        if (!loadout) {
            HSLogger.warn(`missing-loadout-attribute: ${JSON.stringify({ source: 'getLoadoutFromButton', elementClass: button.className })}`, this.#context);
            return null;
        }

        try {
            return JSON.parse(loadout) as Record<string, number>;
        } catch (error) {
            HSLogger.error(`loadout-parse-failed: ${JSON.stringify({ source: 'getLoadoutFromButton', loadoutPreview: loadout.slice(0, 180) })} ${String(error)}`, this.#context);
            return null;
        }
    }

    static positionOverlayNearTarget(preview: HTMLElement, button: HTMLElement, options?: { placement?: 'right' | 'below'; gutter?: number }): void {
        const buttonRect = button.getBoundingClientRect();
        const previewRect = preview.getBoundingClientRect();
        const gutter = options?.gutter ?? 8;
        const placement = options?.placement ?? 'right';

        let left = placement === 'below' ? buttonRect.left : buttonRect.right + gutter;
        let top = placement === 'below' ? buttonRect.bottom + gutter : buttonRect.top;

        const rightOverflow = left + previewRect.width > window.innerWidth - gutter;
        const bottomOverflow = top + previewRect.height > window.innerHeight - gutter;

        if (placement === 'right' && rightOverflow) {
            left = buttonRect.left;
            top = buttonRect.bottom + gutter;
        }

        if (placement === 'below' && bottomOverflow) {
            left = buttonRect.right + gutter;
            top = buttonRect.top;
        }

        if (left + previewRect.width > window.innerWidth - gutter)
            left = Math.max(window.innerWidth - previewRect.width - gutter, gutter);
        if (top + previewRect.height > window.innerHeight - gutter)
            top = Math.max(window.innerHeight - previewRect.height - gutter, gutter);
        if (top < gutter)
            top = gutter;
        if (left < gutter)
            left = gutter;

        preview.style.left = `${left}px`;
        preview.style.top = `${top}px`;
    }

    // === Modal/Interaction/Event Methods ===
    static getResultInteractionTarget(modal: HTMLElement, event: Event): HTMLElement | null {
        const target = (event.target as HTMLElement | null)?.closest(`.${HEATER_RESULT_UI_SELECTORS.importLoadoutBtn}, .${HEATER_RESULT_UI_SELECTORS.jsonTooltipTrigger}`) as HTMLElement | null;
        if (!target || !modal.contains(target)) return null;
        return target;
    }

    static isSelfTransitionEvent(event: Event, target: HTMLElement): boolean {
        if (!(event instanceof MouseEvent)) return false;

        const related = event.relatedTarget as Node | null;
        return Boolean(related && target.contains(related));
    }

    static getOverlayKindFromTarget(target: HTMLElement): 'preview' | 'json' | null {
        if (target.classList.contains(HEATER_RESULT_UI_SELECTORS.importLoadoutBtn)) {
            return 'preview';
        }
        if (target.classList.contains(HEATER_RESULT_UI_SELECTORS.jsonTooltipTrigger)) {
            return 'json';
        }
        return null;
    }

    static clearActiveOverlay(): void {
        this.removeLoadoutPreview();
        this.removeLoadoutJsonTooltip();
        this.#overlayState = { kind: null, target: null };
    }

    static showOverlayForTarget(target: HTMLElement): void {
        const kind = this.getOverlayKindFromTarget(target);
        if (!kind) return;

        const sameTarget = this.#overlayState.target === target;
        const sameKind = this.#overlayState.kind === kind;
        if (sameTarget && sameKind) return;

        this.clearActiveOverlay();
        if (kind === 'preview') {
            this.showLoadoutPreview(target);
        } else {
            this.showLoadoutJsonTooltip(target);
        }
        this.#overlayState = { kind, target };
    }

    static hideOverlayForTarget(target: HTMLElement): void {
        if (this.#overlayState.target !== target) return;
        this.clearActiveOverlay();
    }

    static toggleResultInteractionOverlay(target: HTMLElement, show: boolean): void {
        if (target.classList.contains(HEATER_RESULT_UI_SELECTORS.importLoadoutBtn)) {
            target.classList.toggle('hs-rainbow-border', show);
        }
        if (show) {
            this.showOverlayForTarget(target);
        } else {
            this.hideOverlayForTarget(target);
        }
    }

    static attachResultModalHandlers(modalId: string): void {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        if (this.#attachedModalHandlers.has(modal)) {
            HSLogger.warn(`modal-handlers-already-attached: ${JSON.stringify({ modalId })}`, this.#context);
            return;
        }

        const onClick = (event: Event) => {
            const button = (event.target as HTMLElement | null)?.closest(`.${HEATER_RESULT_UI_SELECTORS.copyLoadoutBtn}, .${HEATER_RESULT_UI_SELECTORS.importLoadoutBtn}`) as HTMLElement | null;
            if (!button) return;

            const loadout = button.getAttribute(HEATER_RESULT_UI_SELECTORS.dataLoadout);
            if (!loadout) {
                HSLogger.warn(`missing-loadout-attribute: ${JSON.stringify({ source: 'attachResultModalHandlers:onClick', elementClass: button.className })}`, this.#context);
                return;
            }

            this.clearActiveOverlay();

            if (button.classList.contains(HEATER_RESULT_UI_SELECTORS.copyLoadoutBtn)) {
                void this.copyLoadoutToClipboard(loadout);
                return;
            }
            if (button.classList.contains(HEATER_RESULT_UI_SELECTORS.importLoadoutBtn)) {
                void this.importLoadoutToActiveSlot(loadout);
            }
        };

        const onIconButtonClick = (event: Event) => {
            const button = (event.target as HTMLElement | null)?.closest('.hs-heater-type-icon-button') as HTMLElement | null;
            if (!button || !modal.contains(button)) return;

            const semanticId = button.dataset.heaterIconId;
            if (!semanticId) return;

            const mouseEvent = event as MouseEvent;
            if (!mouseEvent.altKey) return;

            event.preventDefault();
            event.stopPropagation();
            this.#iconPicker.start(semanticId);
        };

        const onIconButtonContextMenu = (event: Event) => {
            const button = (event.target as HTMLElement | null)?.closest('.hs-heater-type-icon-button') as HTMLElement | null;
            if (!button || !modal.contains(button)) return;

            const semanticId = button.dataset.heaterIconId;
            if (!semanticId) return;

            event.preventDefault();
            event.stopPropagation();
            clearHeaterIconOverride(semanticId);
            this.#refreshHeaterResultIconButtons(modal);
            HSUI.Notify('Heater result icon override cleared.', { notificationType: 'default' });
        };

        const onShowOverlay = (event: Event) => {
            const target = this.getResultInteractionTarget(modal, event);
            if (!target || this.isSelfTransitionEvent(event, target)) return;
            this.toggleResultInteractionOverlay(target, true);
        };

        const onHideOverlay = (event: Event) => {
            const target = this.getResultInteractionTarget(modal, event);
            if (!target || this.isSelfTransitionEvent(event, target)) return;
            this.toggleResultInteractionOverlay(target, false);
        };

        modal.addEventListener('click', onClick);
        modal.addEventListener('mouseover', onShowOverlay);
        modal.addEventListener('mouseout', onHideOverlay);
        modal.addEventListener('focusin', onShowOverlay);
        modal.addEventListener('focusout', onHideOverlay);
        modal.addEventListener('click', onIconButtonClick);
        modal.addEventListener('contextmenu', onIconButtonContextMenu);

        const detach = () => {
            modal.removeEventListener('click', onClick);
            modal.removeEventListener('mouseover', onShowOverlay);
            modal.removeEventListener('mouseout', onHideOverlay);
            modal.removeEventListener('focusin', onShowOverlay);
            modal.removeEventListener('focusout', onHideOverlay);
            modal.removeEventListener('click', onIconButtonClick);
            modal.removeEventListener('contextmenu', onIconButtonContextMenu);
            this.#attachedModalHandlers.delete(modal);
            HSLogger.warn(`modal-handlers-detached: ${JSON.stringify({ modalId })}`, this.#context);
        };

        this.#attachedModalHandlers.set(modal, {
            onClick,
            onShowOverlay,
            onHideOverlay,
            detach,
        });

        this.populateResultsHeader(modal);
        this.#refreshHeaterResultIconButtons(modal);
    }

    static detachResultModalHandlers(modal: HTMLElement): void {
        const handlers = this.#attachedModalHandlers.get(modal);
        if (!handlers) return;
        handlers.detach();
    }

    static clearResultModalResources(): void {
        this.clearActiveOverlay();
        this.#quickbarCloneCleanup?.();
        this.#quickbarCloneCleanup = null;
    }

    // === Async/Clipboard/Game Import Methods ===
    static async copyLoadoutToClipboard(loadout: string): Promise<void> {
        try {
            await navigator.clipboard.writeText(loadout);
            HSUI.Notify('Loadout copied to clipboard.', { position: 'top', notificationType: 'success' });
        } catch (error) {
            HSLogger.error(`clipboard-write-failed: ${JSON.stringify({ source: 'copyLoadoutToClipboard', loadoutPreview: loadout.slice(0, 180) })} ${String(error)}`, this.#context);
            HSUI.Notify('Failed to copy loadout to clipboard.', { position: 'top', notificationType: 'error' });
        }
    }

    static async importLoadoutToActiveSlot(loadout: string): Promise<void> {
        const fileInput = document.getElementById(HEATER_RESULT_UI_SELECTORS.importFileInputId) as HTMLInputElement | null;
        if (!fileInput) {
            HSLogger.warn(`import-file-input-missing: ${JSON.stringify({ source: 'importLoadoutToActiveSlot', inputId: HEATER_RESULT_UI_SELECTORS.importFileInputId })}`, this.#context);
            HSUI.Notify('Failed to import loadout: game import file input was not found.', { position: 'top', notificationType: 'error' });
            return;
        }

        if (typeof DataTransfer === 'undefined' || typeof File === 'undefined' || typeof Blob === 'undefined') {
            HSLogger.warn(`import-not-supported-by-browser: ${JSON.stringify({ source: 'importLoadoutToActiveSlot', dataTransfer: typeof DataTransfer, file: typeof File, blob: typeof Blob })}`, this.#context);
            HSUI.Notify('Loadout import is not supported by this browser.', { position: 'top', notificationType: 'error' });
            return;
        }

        try {
            const blob = new Blob([loadout], { type: 'application/json' });
            const file = new File([blob], 'heater-import.json', { type: 'application/json' });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            fileInput.files = dataTransfer.files;
            fileInput.dispatchEvent(new Event('change', { bubbles: true }));
            HSUI.Notify('Loadout imported to the active slot.', { position: 'top', notificationType: 'success' });
        } catch (error) {
            HSLogger.error(`import-dispatch-failed: ${JSON.stringify({ source: 'importLoadoutToActiveSlot', loadoutPreview: loadout.slice(0, 180) })} ${String(error)}`, this.#context);
            HSUI.Notify('Failed to import loadout.', { position: 'top', notificationType: 'error' });
        }
    }
}
