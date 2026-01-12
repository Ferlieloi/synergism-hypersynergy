"use strict"; (() => {
    var me = (l => (l.SLOT_1 = "blueberryLoadout1", l.SLOT_2 = "blueberryLoadout2", l.SLOT_3 = "blueberryLoadout3", l.SLOT_4 = "blueberryLoadout4", l.SLOT_5 = "blueberryLoadout5", l.SLOT_6 = "blueberryLoadout6", l.SLOT_7 = "blueberryLoadout7", l.SLOT_8 = "blueberryLoadout8", l))(me || {}), he = (T => (T.TUTORIAL = "ambrosiaTutorial", T.PATREON = "ambrosiaPatreon", T.OBTAINIUM = "ambrosiaObtainium1", T.OFFERING = "ambrosiaOffering1", T.HYPEFLUX = "ambrosiaHyperflux", T.RA_TUTORIAL = "redAmbrosiaTutorial", T.RA_FREE = "redAmbrosiaFreeTutorialLevels", T.RA_CONV1 = "redAmbrosiaConversionImprovement1", T.RA_BLUEGEN = "redAmbrosiaBlueberryGenerationSpeed", T.RA_REGLUCK = "redAmbrosiaRegularLuck", T.QUARKS1 = "ambrosiaQuarks1", T.CUBES1 = "ambrosiaCubes1", T.LUCK1 = "ambrosiaLuck1", T.BASE_OBT1 = "ambrosiaBaseObtainium1", T.BASE_OFF1 = "ambrosiaBaseOffering1", T.SING_RED1 = "ambrosiaSingReduction1", T.RA_FREE2 = "redAmbrosiaFreeLevelsRow2", T.RA_CUBE = "redAmbrosiaRedAmbrosiaCube", T.RA_OBT = "redAmbrosiaRedAmbrosiaObtainium", T.RA_OFF = "redAmbrosiaRedAmbrosiaOffering", T.CUBE_QUARK = "ambrosiaCubeQuark1", T.LUCK_QUARK = "ambrosiaLuckQuark1", T.LUCK_CUBE = "ambrosiaLuckCube1", T.QUARK_CUBE = "ambrosiaQuarkCube1", T.CUBE_LUCK = "ambrosiaCubeLuck1", T.QUARK_LUCK = "ambrosiaQuarkLuck1", T.RA_FREE3 = "redAmbrosiaFreeLevelsRow3", T.RA_CONV2 = "redAmbrosiaConversionImprovement2", T.RA_REDGEN = "redAmbrosiaRedGenerationSpeed", T.RA_REDLUCK = "redAmbrosiaRedLuck", T.QUARKS2 = "ambrosiaQuarks2", T.CUBES2 = "ambrosiaCubes2", T.LUCK2 = "ambrosiaLuck2", T.BASE_OBT2 = "ambrosiaBaseObtainium2", T.BASE_OFF2 = "ambrosiaBaseOffering2", T.INF_SHOP1 = "ambrosiaInfiniteShopUpgrades1", T.RA_FREE4 = "redAmbrosiaFreeLevelsRow4", T.RA_CUBE_IMPR = "redAmbrosiaRedAmbrosiaCubeImprover", T.RA_INF_SHOP = "redAmbrosiaInfiniteShopUpgrades", T.RA_ACC = "redAmbrosiaRedAmbrosiaAccelerator", T.QUARKS3 = "ambrosiaQuarks3", T.CUBES3 = "ambrosiaCubes3", T.LUCK3 = "ambrosiaLuck3", T.SING_RED2 = "ambrosiaSingReduction2", T.INF_SHOP2 = "ambrosiaInfiniteShopUpgrades2", T.RA_VISCOUNT = "redAmbrosiaViscount", T.RA_FREE5 = "redAmbrosiaFreeLevelsRow5", T.RA_CONV3 = "redAmbrosiaConversionImprovement3", T.RA_BLUEGEN2 = "redAmbrosiaBlueberryGenerationSpeed2", T.RA_REGLUCK2 = "redAmbrosiaRegularLuck2", T))(he || {}); var b = class { constructor() { throw new Error("Cannot instantiate a static class") } static { this.Debug = { debugMode: !1, performanceDebugMode: !1, gameDataDebugMode: !1, calculationCacheDebugMode: !1 } } static { this.PrivateAPI = { base: "https://jonah.fi", latestRelease: "/hs-version", checkIntervalMs: 9e5 } } static { this.General = { currentModVersion: "2.9.5", isLatestVersion: !0, modGithubUrl: "https://github.com/ahvonenj/synergism-hypersynergy/", modWikiUrl: "https://github.com/ahvonenj/synergism-hypersynergy/wiki/", modWikiFeaturesUrl: "https://github.com/ahvonenj/synergism-hypersynergy/wiki/Mod-Features", modWebsiteUrl: "https://ahvonenj.github.io/synergism-hypersynergy/", heaterUrl: "https://docs.google.com/spreadsheets/d/1v02fjAeAHtLBMB5-7Spz5OHVb-eEDg7m5ISi5Mk0YAY/edit?usp=sharing" } } static { this.Common = { eventAPIUrl: "wss://synergism.cc/consumables/connect", pseudoAPIurl: "https://synergism.cc/stripe/upgrades", meAPIurl: "https://synergism.cc/api/v1/users/me", experimentalGDS: !0 } } static { this.HSPrototypes = { defaultTransitionTiming: 100 } } static { this.HSElementHooker = { elementHookUpdateMS: 10, elementsHookUpdateMS: 100, enableHelementHookTimeout: !0, elementHookTimeout: 500, watcherThrottlingMS: 50, defaultWatcherOptions: { greedy: !1, overrideThrottle: !1, characterData: !0, childList: !0, subtree: !0, attributes: !1, attributeOldValue: !1, attributeFilter: [] } } } static { this.HSLogger = { logLevel: 1, logSize: 5e3 } } static { this.HSStorage = { storagePrefix: "hs-" } } static { this.HSUI = { injectedStylesDomId: "hs-injected-styles", notifyClassName: "hs-notification", notifyTextClassName: "hs-notification-text" } } static { this.HSUIC = { defaultImageWidth: 32, defaultImageHeight: 32 } } static { this.HSSettings = { storageKey: "settings", strategiesKey: "strategies", serializationBlackList: ["settingDescription", "settingHelpText", "settingValueMultiplier", "defaultValue", "settingControl", "settingAction", "patchConfig", "usesGameData"], gameDataRequiredTooltip: "This feature requires Game Data Sniffing to be enabled.", gameDataCheckBlacklist: ["useGameData", "stopSniffOnError"] } } static { this.HSMouse = { autoClickIgnoredElements: ["#chronosHepteractCraft", "#chronosHepteractCraftMax", "#chronosHepteractCap", "#chronosHepteractAuto", "#hyperrealismHepteractCraft", "#hyperrealismHepteractCraftMax", "#hyperrealismHepteractCap", "#hyperrealismHepteractAuto", "#quarkHepteractCraft", "#quarkHepteractCraftMax", "#quarkHepteractCap", "#quarkHepteractAuto", "#challengeHepteractCraft", "#challengeHepteractCraftMax", "#challengeHepteractCap", "#challengeHepteractAuto", "#abyssHepteractCraft", "#abyssHepteractCraftMax", "#abyssHepteractCap", "#abyssHepteractAuto", "#acceleratorHepteractCraft", "#acceleratorHepteractCraftMax", "#acceleratorHepteractCap", "#acceleratorHepteractAuto", "#acceleratorBoostHepteractCraft", "#acceleratorBoostHepteractCraftMax", "#acceleratorBoostHepteractCap", "#acceleratorBoostHepteractAuto", "#multiplierHepteractCraft", "#multiplierHepteractCraftMax", "#multiplierHepteractCap", "#multiplierHepteractAuto", "#hepteractToQuarkTrade", "#hepteractToQuarkTradeMax", "#hepteractToQuarkTradeAuto", "#powderDayWarp", "#warpAuto", "#hepteractAutoPercentageButton", "#toggleautosacrifice", "#toggleautoBuyFragments", "#toggle36", "#toggle37", "#toggleresearchbuy", "#toggleautoresearch", "#toggleautoresearchmode", "#toggle38", "#toggleAntMax", "#toggleAutoChallengeStart", "#retryChallenge", "#toggleAutoChallengeIgnore", "#toggle35", "#ok_prompt", "#cancel_prompt"] } } static { this.HSAmbrosia = { storageKey: "ambrosia-loadouts", quickBarId: "hs-ambrosia-quick-loadout-container", quickBarLoadoutIdPrefix: "hs-ambrosia-quickbar", ambrosiaLoadoutIcons: new Map([["ambrosiaTutorial", { url: "https://synergism.cc/Pictures/Default/BlueberryTutorial.png", draggableIconId: "ambrosiaTutorial" }], ["ambrosiaPatreon", { url: "https://synergism.cc/Pictures/Default/BlueberryPatreon.png", draggableIconId: "ambrosiaPatreon" }], ["ambrosiaObtainium1", { url: "https://synergism.cc/Pictures/Default/BlueberryObtainium.png", draggableIconId: "ambrosiaObtainium1" }], ["ambrosiaOffering1", { url: "https://synergism.cc/Pictures/Default/BlueberryOffering.png", draggableIconId: "ambrosiaOffering1" }], ["ambrosiaHyperflux", { url: "https://synergism.cc/Pictures/Default/BlueberryHyperflux.png", draggableIconId: "ambrosiaHyperflux" }], ["redAmbrosiaTutorial", { url: "https://synergism.cc/Pictures/RedAmbrosia/RedAmbrosiaTutorial.png", draggableIconId: "redAmbrosiaTutorial" }], ["redAmbrosiaFreeTutorialLevels", { url: "https://synergism.cc/Pictures/RedAmbrosia/RedAmbrosiaFreeTutorialLevels.png", draggableIconId: "redAmbrosiaFreeTutorialLevels" }], ["redAmbrosiaConversionImprovement1", { url: "https://synergism.cc/Pictures/RedAmbrosia/RedAmbrosiaConversionImprovement1.png", draggableIconId: "redAmbrosiaConversionImprovement1" }], ["redAmbrosiaBlueberryGenerationSpeed", { url: "https://synergism.cc/Pictures/RedAmbrosia/RedAmbrosiaBlueberryGenerationSpeed.png", draggableIconId: "redAmbrosiaBlueberryGenerationSpeed" }], ["redAmbrosiaRegularLuck", { url: "https://synergism.cc/Pictures/RedAmbrosia/RedAmbrosiaRegularLuck.png", draggableIconId: "redAmbrosiaRegularLuck" }], ["ambrosiaQuarks1", { url: "https://synergism.cc/Pictures/Default/BlueberryQuarks.png", draggableIconId: "ambrosiaQuarks1" }], ["ambrosiaCubes1", { url: "https://synergism.cc/Pictures/Default/BlueberryCubes.png", draggableIconId: "ambrosiaCubes1" }], ["ambrosiaLuck1", { url: "https://synergism.cc/Pictures/Default/BlueberryLuck.png", draggableIconId: "ambrosiaLuck1" }], ["ambrosiaBaseObtainium1", { url: "https://synergism.cc/Pictures/Default/BlueberryBaseObtainium1.png", draggableIconId: "ambrosiaBaseObtainium1" }], ["ambrosiaBaseOffering1", { url: "https://synergism.cc/Pictures/Default/BlueberryBaseOffering1.png", draggableIconId: "ambrosiaBaseOffering1" }], ["ambrosiaSingReduction1", { url: "https://synergism.cc/Pictures/Default/BlueberrySingReduction.png", draggableIconId: "ambrosiaSingReduction1" }], ["redAmbrosiaFreeLevelsRow2", { url: "https://synergism.cc/Pictures/RedAmbrosia/RedAmbrosiaFreeLevelsRow2.png", draggableIconId: "redAmbrosiaFreeLevelsRow2" }], ["redAmbrosiaRedAmbrosiaCube", { url: "https://synergism.cc/Pictures/RedAmbrosia/RedAmbrosiaRedAmbrosiaCube.png", draggableIconId: "redAmbrosiaRedAmbrosiaCube" }], ["redAmbrosiaRedAmbrosiaObtainium", { url: "https://synergism.cc/Pictures/RedAmbrosia/RedAmbrosiaObtainium.png", draggableIconId: "redAmbrosiaRedAmbrosiaObtainium" }], ["redAmbrosiaRedAmbrosiaOffering", { url: "https://synergism.cc/Pictures/RedAmbrosia/RedAmbrosiaOffering.png", draggableIconId: "redAmbrosiaRedAmbrosiaOffering" }], ["ambrosiaCubeQuark1", { url: "https://synergism.cc/Pictures/Default/BlueberryCubeQuark.png", draggableIconId: "ambrosiaCubeQuark1" }], ["ambrosiaLuckQuark1", { url: "https://synergism.cc/Pictures/Default/BlueberryLuckQuark.png", draggableIconId: "ambrosiaLuckQuark1" }], ["ambrosiaLuckCube1", { url: "https://synergism.cc/Pictures/Default/BlueberryLuckCube.png", draggableIconId: "ambrosiaLuckCube1" }], ["ambrosiaQuarkCube1", { url: "https://synergism.cc/Pictures/Default/BlueberryQuarkCube.png", draggableIconId: "ambrosiaQuarkCube1" }], ["ambrosiaCubeLuck1", { url: "https://synergism.cc/Pictures/Default/BlueberryCubeLuck.png", draggableIconId: "ambrosiaCubeLuck1" }], ["ambrosiaQuarkLuck1", { url: "https://synergism.cc/Pictures/Default/BlueberryQuarkLuck.png", draggableIconId: "ambrosiaQuarkLuck1" }], ["redAmbrosiaFreeLevelsRow3", { url: "https://synergism.cc/Pictures/RedAmbrosia/RedAmbrosiaFreeLevelsRow3.png", draggableIconId: "redAmbrosiaFreeLevelsRow3" }], ["redAmbrosiaConversionImprovement2", { url: "https://synergism.cc/Pictures/RedAmbrosia/RedAmbrosiaConversionImprovement2.png", draggableIconId: "redAmbrosiaConversionImprovement2" }], ["redAmbrosiaRedGenerationSpeed", { url: "https://synergism.cc/Pictures/RedAmbrosia/RedAmbrosiaRedGenerationSpeed.png", draggableIconId: "redAmbrosiaRedGenerationSpeed" }], ["redAmbrosiaRedLuck", { url: "https://synergism.cc/Pictures/RedAmbrosia/RedAmbrosiaRedLuck.png", draggableIconId: "redAmbrosiaRedLuck" }], ["ambrosiaQuarks2", { url: "https://synergism.cc/Pictures/Default/BlueberryQuarks2.png", draggableIconId: "ambrosiaQuarks2" }], ["ambrosiaCubes2", { url: "https://synergism.cc/Pictures/Default/BlueberryCubes2.png", draggableIconId: "ambrosiaCubes2" }], ["ambrosiaLuck2", { url: "https://synergism.cc/Pictures/Default/BlueberryLuck2.png", draggableIconId: "ambrosiaLuck2" }], ["ambrosiaBaseObtainium2", { url: "https://synergism.cc/Pictures/Default/BlueberryBaseObtainium2.png", draggableIconId: "ambrosiaBaseObtainium2" }], ["ambrosiaBaseOffering2", { url: "https://synergism.cc/Pictures/Default/BlueberryBaseOffering2.png", draggableIconId: "ambrosiaBaseOffering2" }], ["ambrosiaInfiniteShopUpgrades1", { url: "https://synergism.cc/Pictures/Default/BlueberryInfiniteShopUpgrades.png", draggableIconId: "ambrosiaInfiniteShopUpgrades1" }], ["redAmbrosiaFreeLevelsRow4", { url: "https://synergism.cc/Pictures/RedAmbrosia/RedAmbrosiaFreeLevelsRow4.png", draggableIconId: "redAmbrosiaFreeLevelsRow4" }], ["redAmbrosiaRedAmbrosiaCubeImprover", { url: "https://synergism.cc/Pictures/RedAmbrosia/RedAmbrosiaRedAmbrosiaCubeImprover.png", draggableIconId: "redAmbrosiaRedAmbrosiaCubeImprover" }], ["redAmbrosiaInfiniteShopUpgrades", { url: "https://synergism.cc/Pictures/RedAmbrosia/RedAmbrosiaInfiniteShopLevels.png", draggableIconId: "redAmbrosiaInfiniteShopUpgrades" }], ["redAmbrosiaRedAmbrosiaAccelerator", { url: "https://synergism.cc/Pictures/RedAmbrosia/RedAmbrosiaAccelerator.png", draggableIconId: "redAmbrosiaRedAmbrosiaAccelerator" }], ["ambrosiaQuarks3", { url: "https://synergism.cc/Pictures/Default/BlueberryQuarks3.png", draggableIconId: "ambrosiaQuarks3" }], ["ambrosiaCubes3", { url: "https://synergism.cc/Pictures/Default/BlueberryCubes3.png", draggableIconId: "ambrosiaCubes3" }], ["ambrosiaLuck3", { url: "https://synergism.cc/Pictures/Default/BlueberryLuck3.png", draggableIconId: "ambrosiaLuck3" }], ["ambrosiaSingReduction2", { url: "https://synergism.cc/Pictures/Default/BlueberrySingReduction2.png", draggableIconId: "ambrosiaSingReduction2" }], ["ambrosiaInfiniteShopUpgrades2", { url: "https://synergism.cc/Pictures/Default/BlueberryInfiniteShopUpgrades2.png", draggableIconId: "ambrosiaInfiniteShopUpgrades2" }], ["redAmbrosiaViscount", { url: "https://synergism.cc/Pictures/RedAmbrosia/RedAmbrosiaTutorial.png", draggableIconId: "redAmbrosiaViscount" }], ["redAmbrosiaFreeLevelsRow5", { url: "https://synergism.cc/Pictures/RedAmbrosia/RedAmbrosiaFreeLevelsRow5.png", draggableIconId: "redAmbrosiaFreeLevelsRow5" }], ["redAmbrosiaConversionImprovement3", { url: "https://synergism.cc/Pictures/RedAmbrosia/RedAmbrosiaConversionImprovement3.png", draggableIconId: "redAmbrosiaConversionImprovement3" }], ["redAmbrosiaBlueberryGenerationSpeed2", { url: "https://synergism.cc/Pictures/RedAmbrosia/RedAmbrosiaBlueberryGenerationSpeed.png", draggableIconId: "redAmbrosiaBlueberryGenerationSpeed2" }], ["redAmbrosiaRegularLuck2", { url: "https://synergism.cc/Pictures/RedAmbrosia/RedAmbrosiaRegularLuck.png", draggableIconId: "redAmbrosiaRegularLuck2" }]]), idleSwapIndicatorId: "hs-ambrosia-loadout-idle-swap-indicator", idleSwapMaxBlueTreshold: 97, idleSwapMinBlueTreshold: 3, idleSwapMaxRedTreshold: 99, idleSwapMinRedTreshold: 1, R_TIME_PER_AMBROSIA: 30, R_TIME_PER_RED_AMBROSIA: 1e5, R_digitReduction: 4, blueBarId: "hs-blue-progress-bar", blueBarProgressId: "hs-blue-progress", blueBarProgressTextId: "hs-blue-progress-text", redBarId: "hs-red-progress-bar", redBarProgressId: "hs-red-progress", redBarProgressTextId: "hs-red-progress-text", barWrapperId: "hs-minibar-wrapper" } } static { this.HSGameState = { viewProperties: new Map([[8, { subViewIds: ["cubeTab1", "cubeTab2", "cubeTab3", "cubeTab4", "cubeTab5", "cubeTab6", "cubeTab7"], subViewsSelector: ".cubeTab", viewClassName: "CubeView" }], [13, { subViewIds: ["singularityContainer1", "singularityContainer2", "singularityContainer3", "singularityContainer4", "singularityContainer5"], subViewsSelector: ["#singularityContainer1", "#singularityContainer2", "#singularityContainer3", "#singularityContainer4", "#singularityContainer5"], viewClassName: "SingularityView" }]]) } } static { this.HSGameData = { fetchedDataRefreshInterval: 6e4, campaignTokenRefreshInterval: 6e4, turboModeSpeedMs: 66, turboCSSId: "hs-game-data-turbo-css" } } }; var ae = class { static async getLatestRelease() { try { let t = await (await fetch(`${b.PrivateAPI.base}${b.PrivateAPI.latestRelease}`)).json(); return t.code === 0 ? t.data : null } catch { return null } } }; var y = class { static #e = "HSElementHooker"; static #t = new Map; static HookElement(e, t) { let a = this; return new Promise((n, o) => { let i, r = t ? t.querySelector(e) : document.querySelector(e); r && n(r); let l = setInterval(() => { let u = t ? t.querySelector(e) : document.querySelector(e); u && (clearTimeout(i), clearInterval(l), n(u)) }, b.HSElementHooker.elementHookUpdateMS); b.HSElementHooker.elementHookTimeout && (i = setTimeout(() => { c.warn("Hook timed out", a.#e), clearInterval(l), n(p.nullProxy("ElementHookTimeout")) }, b.HSElementHooker.elementHookTimeout)) }) } static HookElements(e) { let t = this; return new Promise((a, n) => { let o, i = setInterval(() => { let r = []; if (Array.isArray(e) && e.length === 0 || !Array.isArray(e) && (!e || e === "")) { clearInterval(i), a([]); return } if (Array.isArray(e)) e.forEach(l => { r.push(document.querySelector(l)) }); else { let l = document.querySelectorAll(e), u = Array.from(l); r.push(...u) } !r.includes(null) && r.length > 0 && (clearTimeout(o), clearInterval(i), a(r)) }, b.HSElementHooker.elementsHookUpdateMS); b.HSElementHooker.elementHookTimeout && (o = setTimeout(() => { c.warn("Hook timed out", t.#e), clearInterval(i), a(p.nullProxy("ElementsHookTimeout")) }, b.HSElementHooker.elementHookTimeout)) }) } static watchElement(e, t, a) { let n = this, o = { ...b.HSElementHooker.defaultWatcherOptions, ...a }; if (!e) { c.warn("watchElement - element not found", this.#e); return } let i = p.uuidv4(); this.#t.set(i, { element: e, callback: t, value: void 0, parser: o.valueParser ? o.valueParser : d => d.innerText, observer: void 0, lastCall: void 0 }); let r = new MutationObserver(d => { let g = n.#t.get(i); if (g) { if (!o.overrideThrottle && g.lastCall && performance.now() - g.lastCall < b.HSElementHooker.watcherThrottlingMS) return; let m = g.parser, h = g.callback, A = g.value; if (m) { let M = m(e, d); (M !== A || o.greedy) && (g.value = M, h(M)) } else c.warn("watchElement - error while observing, wParser is null", this.#e); g.lastCall = performance.now() } else c.warn("watchElement - error while observing, could not get watcher", this.#e) }), l = n.#t.get(i); l ? l.observer = r : c.warn("watchElement - error while setting up observer, could not get watcher", this.#e); let u = { characterData: o.characterData, childList: o.childList, subtree: o.subtree, attributes: o.attributes }; return o.attributes && (u = { ...u, attributeOldValue: o.attributeOldValue, attributeFilter: o.attributeFilter }), r.observe(e, u), i } static stopWatching(e) { let t = this.#t.get(e); return t ? (t.observer ? t.observer.disconnect() : c.warn("Watcher found, but it's observer is null", this.#e), this.#t.delete(e), !0) : (c.warn(`No watcher found for uuid: ${e}`), !1) } static stopWatchers() { c.log("Stopping all watchers", this.#e), this.#t.forEach(({ observer: e }) => { e && e.disconnect() }), this.#t.clear() } }; var p = class s {
        static #e = null; static { this.sleep = e => new Promise(t => setTimeout(t, e)) } static { this.sleepTime = 10 } static wait(e) { return new Promise(function (t) { setTimeout(t, e) }) } static uuidv4() { return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, e => (+e ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +e / 4).toString(16)) } static domid() { return "hs-rnd-00000000000".replace(/[018]/g, e => (+e ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +e / 4).toString(16)) } static hashCode(e) { let t = 0, a, n; if (e.length === 0) return t; for (a = 0; a < e.length; a++)n = e.charCodeAt(a), t = (t << 5) - t + n, t |= 0; return t } static async computeHash(e) { let a = new TextEncoder().encode(e), n = await crypto.subtle.digest("SHA-1", a); return Array.from(new Uint8Array(n)).map(o => o.toString(16).padStart(2, "0")).join("") } static N(e, t = 2, a = 2) { let n = 0, o = ""; try { typeof e == "string" ? n = parseFloat(e) : n = e, n > 1e6 ? o = n.toExponential(a).replace("+", "") : o = n.toFixed(t) } catch { return console.error(`[HS]: HSUtil.N FAILED FOR ${e}`), o } return o } static getTime() { let e = new Date, t = e.getHours(), a = e.getMinutes(), n = e.getSeconds(), o = t.toString().padStart(2, "0"), i = a.toString().padStart(2, "0"), r = n.toString().padStart(2, "0"); return `${o}:${i}:${r}` } static camelToKebab(e) { return e.replace(/^([A-Z])/, t => t.toLowerCase()).replace(/([A-Z])/g, t => "-" + t.toLowerCase()) } static kebabToCamel(e) { return e.replace(/-([a-z])/g, (t, a) => a.toUpperCase()) } static objectToCSS(e) {
            let t = ""; if (e == null) return ""; for (let [a, n] of Object.entries(e)) n != null && (t += `${this.camelToKebab(a)}: ${n};
`); return t
        } static isNumeric(e) { return !isNaN(e - parseFloat(e)) } static isString(e) { return typeof e == "string" || e instanceof String } static isBoolean(e) { return typeof e == "boolean" } static parseFloat2(e) { if (!e) return NaN; let t = e.indexOf(","); if (t === -1) return parseFloat(e); e = e.replace(/,/g, ""); let a = e.indexOf("."); if (a === -1) return parseFloat(e.replace(/\,/g, ".")); let n = t < a ? e.replace(/\,/g, "") : e.replace(/\./g, "").replace(",", "."); return parseFloat(n) } static nullProxy(e) { let t = new Proxy({}, { get: () => (c.warn(`Get operation intercepted by Null Proxy '${e}', something is not right`, "Proxy"), t), set: () => (c.warn(`Set operation intercepted by Null Proxy '${e}', something is not right`, "Proxy"), !0) }); return t } static parseColorTags(e) { let t = /<([a-zA-Z]+|#[0-9A-Fa-f]{3,8})>(.*?)<\/\1>/g; return e.replace(t, (a, n, o) => `<span style="color: ${n}">${o}</span>`) } static removeColorTags(e) { try { let t = /<([a-zA-Z]+|#[0-9A-Fa-f]{3,6})>(.*?)<\/\1>/g; return e.replace(t, (a, n, o) => `${o}`) } catch (t) { return console.warn("Error removing color tags from log message", t), `${e}` } } static unfuckNumericString(e) { if (!e) return e; if (e.toLowerCase().includes("e")) return e.replace(/,/g, ""); let t = e.replace(/[^0-9.,-]/g, ""), a = t.split("."), n = ""; return a.length > 1 ? n = a[0].replace(/,/g, "") + "." + a[1].replace(/,/g, "") : n = t.replace(/,/g, ""), n } static #t(e) { let t = CSSStyleDeclaration.prototype.setProperty, a; try { a = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(e.style), "display"), a || (a = Object.getOwnPropertyDescriptor(CSSStyleDeclaration.prototype, "display")), a || (a = { configurable: !0, enumerable: !0, get: function () { return this.getPropertyValue("display") }, set: function (n) { this.setProperty("display", n, "") } }) } catch { a = { configurable: !0, enumerable: !0, get: function () { return this.getPropertyValue("display") }, set: function (o) { this.setProperty("display", o, "") } } } return Object.defineProperty(e.style, "display", { get: function () { return "none" }, set: function () { }, configurable: !0 }), e.style.setProperty = function (n, o, i) { return n === "display" ? t.call(this, n, "none") : t.call(this, n, o, i) }, { restore: () => { Object.defineProperty(e.style, "display", a), e.style.setProperty = t } } } static #a = null; static #r = null; static #i = null; static async hiddenAction(e, t = "alert", a = !1, n = 25) { let o = this.#a ? this.#a : await y.HookElement("#transparentBG"), i = this.#r ? this.#r : await y.HookElement("#confirmationBox"), r = this.#i ? this.#i : await y.HookElement("#alertWrapper"); this.#a = o, this.#r = i, this.#i = r; let l = document.querySelector("#ok_alert"), u = document.querySelector("#ok_confirm"), d = s.#t(o), g = s.#t(i), m = s.#t(r); await e(), await s.wait(n), a ? (u.click(), await s.wait(n), d.restore(), g.restore(), m.restore(), l.click()) : (d.restore(), g.restore(), m.restore(), t === "alert" ? l.click() : u.click()) } static async Noop() { } static eventBuffNumToName(e) { return { 0: "Quark", 1: "GoldenQuark", 2: "Cubes", 3: "PowderConversion", 4: "AscensionSpeed", 5: "GlobalSpeed", 6: "AscensionScore", 7: "AntSacrifice", 8: "Offering", 9: "Obtainium", 10: "Octeract", 11: "BlueberryTime", 12: "AmbrosiaLuck", 13: "OneMind" }[e] } static async isLatestVersion() { let e = await ae.getLatestRelease(); return !(e && e.version !== b.General.currentModVersion) } static asString(e) { return e === null ? "" : String(e) } static async waitForElement(e, t = 5e3) { return new Promise((a, n) => { let o = document.getElementById(e); if (o) return a(o); let i = new MutationObserver(() => { let l = document.getElementById(e); l && (i.disconnect(), clearTimeout(r), a(l)) }), r = setTimeout(() => { i.disconnect(), n(new Error(`Element ${e} not found within ${t}ms`)) }, t); i.observe(document.body, { childList: !0, subtree: !0 }) }) } static async waitForInnerText(e, t = a => a.trim().length > 0) { if (!t(e.innerText)) return new Promise(a => { let n = new MutationObserver(() => { t(e.innerText) && (n.disconnect(), a()) }); n.observe(e, { childList: !0, characterData: !0, subtree: !0 }) }) } static async click(e) { return e.click(), await s.sleep(s.sleepTime), Promise.resolve() } static async DblClick(e) { return e.click(), await new Promise(t => setTimeout(t, 5)), e.click(), await s.sleep(s.sleepTime), e.dispatchEvent(new MouseEvent("dblclick", { bubbles: !0 })), Promise.resolve() } static startDialogWatcher() { this.#e === null && (this.#e = window.setInterval(() => { let e = document.getElementById("confirmWrapper"); if (e && e.style.display === "block") { let n = document.getElementById("ok_confirm"); n && (n.click(), c.debug("Auto-clicked ok_confirm")) } let t = document.getElementById("alertWrapper"); if (t && t.style.display === "block") { let n = document.getElementById("ok_alert"); n && (n.click(), c.debug("Auto-clicked ok_alert")) } let a = document.getElementById("promptWrapper"); if (a && a.style.display === "block") { let n = document.getElementById("ok_prompt"); n && (n.click(), c.debug("Auto-clicked ok_prompt")) } }, this.sleepTime)) } static async stopDialogWatcher() { return new Promise(e => { let t = 0, a = 3, n = window.setInterval(() => { let o = !1, i = document.getElementById("confirmWrapper"); if (i && i.style.display === "block") { let l = document.getElementById("ok_confirm"); l && (l.click(), c.debug("Auto-clicked ok_confirm during shutdown"), o = !0) } let r = document.getElementById("alertWrapper"); if (r && r.style.display === "block") { let l = document.getElementById("ok_alert"); l && (l.click(), c.debug("Auto-clicked ok_alert during shutdown"), o = !0) } o ? t = 0 : t++, t >= a && (window.clearInterval(n), this.#e !== null && (window.clearInterval(this.#e), this.#e = null), c.debug("Dialog watcher stopped after clearing all dialogs"), e()) }, s.sleepTime) }) } static base64WithCRLF(e, t = 49e3) {
            let a = []; for (let n = 0; n < e.length; n += t)a.push(e.slice(n, n + t)); return a.join(`\r
`)
        } static getCorruptions(e) { let t = a => { let n = document.getElementById(a); return n ? parseInt(n.textContent || "0", 10) : 0 }; return e === "current" ? { viscosity: t("corrCurrentviscosity"), drought: t("corrCurrentdrought"), deflation: t("corrCurrentdeflation"), extinction: t("corrCurrentextinction"), illiteracy: t("corrCurrentilliteracy"), recession: t("corrCurrentrecession"), dilation: t("corrCurrentdilation"), hyperchallenge: t("corrCurrenthyperchallenge") } : { viscosity: t("corrNextviscosity"), drought: t("corrNextdrought"), deflation: t("corrNextdeflation"), extinction: t("corrNextextinction"), illiteracy: t("corrNextilliteracy"), recession: t("corrNextrecession"), dilation: t("corrNextdilation"), hyperchallenge: t("corrNexthyperchallenge") } } static isBiggerThan1000(e) { let t = e.trim().toLowerCase(); if (/[a-df-z]/.test(t)) return !0; if (t.includes("e")) { let a = t.split("e"); return /[a-df-z]/.test(a[1]) ? !0 : parseInt(a[1], 10) >= 3 } return parseFloat(t) > 1e3 }
    }; var L = class { constructor(e) { this.moduleName = e.moduleName, this.context = e.context, this.moduleColor = e.moduleColor, this.moduleType = 1, this.isInitialized = !1 } getName() { return this.moduleName } setModuleType(e) { this.moduleType = e } }, Ae = class extends L { #e; #t; #a; #r; constructor(e) { super(e), this.setModuleType(2), this.#e = e.moduleKind, this.#t = e.moduleScriptUrl, this.#a = e.moduleCSSUrl, this.#r = e.scriptContext } async#i() { if (!this.#t) { c.error(`Could not load script for ext module ${this.moduleName} - script url missing`); return } let e = document.createElement("script"); return e.type = "text/javascript", e.src = this.#t, document.head.appendChild(e), new Promise((t, a) => { e.onload = () => t(), e.onerror = () => a() }) } async#n() { if (!this.#a) { c.error(`Could not load CSS for ext module ${this.moduleName} - css url missing`); return } let e = document.createElement("link"); return e.rel = "stylesheet", e.href = this.#a, document.head.appendChild(e), new Promise((t, a) => { e.onload = () => t(), e.onerror = () => a() }) } async init() { if (this.#r in window) { c.error(`Could not load ext module ${this.getName} - import conflict in window`); return } switch (this.#e) { case 1: await this.#i(); break; case 2: await this.#n(); break; case 3: await this.#n(), await this.#i(); break; default: break }this.isInitialized = !0 } }; var be = class extends L {
        #e; #t; #a; #r; #i = "white-space: nowrap; user-select: all; -webkit-user-select: all; -moz-user-select: all; -ms-user-select: all;"; constructor(e) { super(e), this.#a = { attributes: !1, childList: !0, subtree: !0 }, this.#r = new MutationObserver((t, a) => { this.#s(t, a) }) } async init() { c.log("Initialising HSCodes module", this.context); let e = this; this.#t = await y.HookElement("#promocodes"), this.#t.addEventListener("click", function (t) { e.#e = document.querySelector("#promptWrapper > #prompt > label"), e.#e && (e.#o(), e.#e.innerHTML = "", e.#n()) }, { capture: !0 }), this.#e = await y.HookElement("#promptWrapper > #prompt > label"), this.#n(), this.isInitialized = !0 } #n() { this.#r?.disconnect(), this.#r?.observe(this.#e, this.#a) } #o() { this.#r?.disconnect() } #s(e, t) {
            let a = this; try {
                if (this.#o(), this.#e && this.#e.innerText.includes("synergism2021")) {
                    let n = this.#e.innerText; this.#e.innerHTML = `<div id="hs-hijack-codes-wrapper">
                    [HSCodes] Hypersynergism has hijacked this modal to offer you all the reusable codes conveniently (click code to auto input it):</br>
                    <span style="${this.#i}" data-code="synergism2021">synergism2021</span>
                    <span style="${this.#i}" data-code="Khafra">Khafra</span>
                    <span style="${this.#i}" data-code=":unsmith:">:unsmith:</span>
                    <span style="${this.#i}" data-code=":antismith:">:antismith:</span>
                </div>`, document.delegateEventListener("click", "#hs-hijack-codes-wrapper > span", function (o) { let i = this.dataset.code, r = document.querySelector("#prompt_text"); i && r ? r.value = i : c.warn("Could not inject code to code input", a.context) }, !0), c.debug("Hijacked code redeem panel", this.context)
                }
            } finally { this.#n() }
        }
    }; var it = ["start", "prestige", "transcend", "reincarnate", "ant", "sacrifice", "ascension"], q = ["start", "prestige", "transcend", "reincarnate", "ant", "sacrifice", "ascension", "challenge10", "challenge11", "challenge12", "challenge13", "challenge14", "w5x10max", "alpha", "p2x1x10", "p3x1", "beta", "1e15-expo", "omega", "singularity", "end"], ie = [{ label: "Exit Transcension challenge", value: 101 }, { label: "Exit Reincarnation challenge", value: 102 }, { label: "Exit Ascension challenge", value: 103 }, { label: "Ascend", value: 104 }, { label: "Ambrosia pre-AOAG loadout", value: 105 }, { label: "Ambrosia post-AOAG Cube loadout", value: 106 }, { label: "Ambrosia Quark loadout", value: 112 }, { label: "Ambrosia Obt/Off loadout", value: 113 }, { label: "Ambrosia Ambrosia loadout", value: 107 }, { label: "Ant Sacrifice", value: 108 }, { label: "Load Ant Speed Corruptions", value: 109 }, { label: "Cleanse corruptions", value: 110 }, { label: "Wait", value: 111 }, { label: "if-jump", value: 200 }, { label: "Set phase corruptions", value: 201 }]; var rt = `{
    "expandCostProtection": {
        "settingName": "expandCostProtection",
        "settingDescription": "Hept. expand cost protection",
        "settingHelpText": "When enabled, makes clicking hepteract icons in the hepteract view (quick expand and max feature) not do anything if it would cost >= settingValue percentage hepteracts",
        "settingType": "numeric",
        "enabled": true,
        "settingValue": 0.5,
        "settingControl": {
            "controlId": "hs-setting-expand-cost-protection-value",
            "controlType": "number",
            "controlGroup": "hepteracts",
            "controlPage": "hepteract",
            "controlEnabledId": "hs-setting-expand-cost-protection-btn",
            "controlOptions": {
                "min": 0,
                "max": 1,
                "step": 0.1
            }
        }
    },
    "expandCostProtectionDoubleCap": {
        "settingName": "expandCostProtectionDoubleCap",
        "settingDescription": "Hepteract double capacity unlocked?",
        "settingHelpText": "Check this if you have the double capacity upgrade unlocked for hepteracts. This will make the expand cost protection setting work correctly.",
        "settingType": "boolean",
        "enabled": false,
        "settingControl": {
            "controlType": "switch",
            "controlGroup": "hepteracts",
            "controlPage": "hepteract",
            "controlEnabledId": "hs-setting-hepteract-double-cap-btn"
        }
    },
    "expandCostProtectionNotifications": {
        "settingName": "expandCostProtectionNotifications",
        "settingDescription": "Suppress cost protection logs",
        "settingHelpText": "Check this if you want to suppress the rather spammy cost protection notifications in the log",
        "settingType": "boolean",
        "enabled": false,
        "settingControl": {
            "controlType": "switch",
            "controlGroup": "hepteracts",
            "controlPage": "hepteract",
            "controlEnabledId": "hs-setting-hepteract-cost-protection-notifications-btn"
        }
    },
    "syncNotificationOpacity": {
        "settingName": "syncNotificationOpacity",
        "settingDescription": "Notification opacity",
        "settingHelpText": "Controls in-game notification opacity. Achievement notifications are one example of in-game notifications.",
        "settingType": "numeric",
        "enabled": true,
        "settingValue": 0.6,
        "settingAction": "syncNotificationOpacity",
        "settingControl": {
            "controlId": "hs-setting-notification-opacity-value",
            "controlType": "number",
            "controlGroup": "notifications",
            "controlPage": "ui",
            "controlEnabledId": "hs-setting-notification-opacity-btn",
            "controlOptions": {
                "min": 0,
                "max": 1,
                "step": 0.05
            }
        }
    },
    "logTimestamp": {
        "settingName": "logTimestamp",
        "settingDescription": "Display timestamps in log",
        "settingHelpText": "Controls whether timestamps are visible or not in the mod's log view",
        "settingType": "boolean",
        "enabled": true,
        "settingAction": "logTimestamp",
        "settingControl": {
            "controlType": "switch",
            "controlGroup": "log",
            "controlPage": "log",
            "controlEnabledId": "hs-setting-display-timestamp-btn"
        }
    },
    "showDebugLogs": {
        "settingName": "showDebugLogs",
        "settingDescription": "Show debug logs",
        "settingHelpText": "Controls whether 'debug' type logs are visible or not in the mod's log view.",
        "settingType": "boolean",
        "enabled": false,
        "settingControl": {
            "controlType": "switch",
            "controlGroup": "debug",
            "controlPage": "debug",
            "controlEnabledId": "hs-setting-display-debug-logs-btn"
        }
    },
    "reactiveMouseHover": {
        "settingName": "reactiveMouseHover",
        "settingDescription": "Reactive mouse hover (when SHIFT is held)",
        "settingHelpText": "When enabled, mouse will emit hover events at current mouse position when SHIFT is held. Setting value is event interval in seconds (0.1 = 100ms).",
        "settingType": "numeric",
        "enabled": true,
        "settingValue": 0.2,
        "settingValueMultiplier": 1000,
        "settingAction": "reactiveMouseHover",
        "settingControl": {
            "controlId": "hs-setting-reactive-mouse-hover-value",
            "controlType": "number",
            "controlGroup": "mouse",
            "controlPage": "input",
            "controlEnabledId": "hs-setting-reactive-mouse-hover-btn",
            "controlOptions": {
                "min": 0,
                "max": 1,
                "step": 0.05
            }
        }
    },
    "autoClick": {
        "settingName": "autoClick",
        "settingDescription": "Auto click (when CTRL is held)",
        "settingHelpText": "When enabled, mouse will click automatically at current mouse position when CTRL is held. Setting value is click interval in seconds (0.1 = 100ms)",
        "settingType": "numeric",
        "enabled": true,
        "settingValue": 0.15,
        "settingValueMultiplier": 1000,
        "settingAction": "autoClick",
        "settingControl": {
            "controlId": "hs-setting-auto-click-value",
            "controlType": "number",
            "controlGroup": "mouse",
            "controlPage": "input",
            "controlEnabledId": "hs-setting-auto-click-btn",
            "controlOptions": {
                "min": 0,
                "max": 1,
                "step": 0.05
            }
        }
    },
    "autoClickIgnoreElements": {
        "settingName": "autoClickIgnoreElements",
        "settingDescription": "Auto click ignores certain elements",
        "settingHelpText": "When enabled, auto click will ignore (not click on) certain elements such as some buttons which there should be no need to auto click. This is to prevent accidental clicks.",
        "settingType": "boolean",
        "enabled": true,
        "settingControl": {
            "controlType": "switch",
            "controlGroup": "mouse",
            "controlPage": "input",
            "controlEnabledId": "hs-setting-autoclick-ignore-btn"
        }
    },
    "autoLoadout": {
        "settingName": "autoLoadout",
        "settingDescription": "Auto loadout",
        "settingHelpText": "When enabled, the mod will automatically switch to configured ambrosia loadouts when ADD or TIME buttons are clicked.",
        "settingType": "boolean",
        "enabled": false,
        "settingAction": "autoLoadout",
        "settingControl": {
            "controlType": "switch",
            "controlGroup": "ambrosia",
            "controlPage": "ambrosia",
            "controlEnabledId": "hs-setting-auto-loadout-btn"
        }
    },
    "autoLoadoutState": {
        "settingName": "autoLoadoutState",
        "settingDescription": "Current loadout state",
        "settingHelpText": "This shows if the mod is aware of your current loadout state. If the state is Unknown, auto loadout switch will not work. To fix this, open the ambrosia menu and switch to any loadout.",
        "settingType": "state",
        "settingValue": "<red>Unknown</red>",
        "enabled": true,
        "settingControl": {
            "controlId": "hs-setting-auto-loadout-state-value",
            "controlType": "state",
            "controlGroup": "ambrosia",
            "controlPage": "ambrosia"
        }
    },
    "autoLoadoutAdd": {
        "settingName": "autoLoadoutAdd",
        "settingDescription": "ADD Loadout",
        "settingHelpText": "Configures to loadout to use when ADD button is clicked.",
        "settingType": "selectstring",
        "enabled": true,
        "settingValue": "",
        "settingControl": {
            "controlId": "hs-setting-add-loadout-value",
            "controlType": "select",
            "controlGroup": "ambrosia",
            "controlPage": "ambrosia",
            "selectOptions": [
                {
                    "text": "None",
                    "value": ""
                },
                {
                    "text": "Loadout 1",
                    "value": "1"
                },
                {
                    "text": "Loadout 2",
                    "value": "2"
                },
                {
                    "text": "Loadout 3",
                    "value": "3"
                },
                {
                    "text": "Loadout 4",
                    "value": "4"
                },
                {
                    "text": "Loadout 5",
                    "value": "5"
                },
                {
                    "text": "Loadout 6",
                    "value": "6"
                },
                {
                    "text": "Loadout 7",
                    "value": "7"
                },
                {
                    "text": "Loadout 8",
                    "value": "8"
                }
            ]
        }
    },
    "autoLoadoutTime": {
        "settingName": "autoLoadoutTime",
        "settingDescription": "TIME loadout",
        "settingHelpText": "Configures to loadout to use when TIME button is clicked.",
        "settingType": "selectstring",
        "enabled": true,
        "settingValue": "",
        "settingControl": {
            "controlId": "hs-setting-time-loadout-value",
            "controlType": "select",
            "controlGroup": "ambrosia",
            "controlPage": "ambrosia",
            "selectOptions": [
                {
                    "text": "None",
                    "value": ""
                },
                {
                    "text": "Loadout 1",
                    "value": "1"
                },
                {
                    "text": "Loadout 2",
                    "value": "2"
                },
                {
                    "text": "Loadout 3",
                    "value": "3"
                },
                {
                    "text": "Loadout 4",
                    "value": "4"
                },
                {
                    "text": "Loadout 5",
                    "value": "5"
                },
                {
                    "text": "Loadout 6",
                    "value": "6"
                },
                {
                    "text": "Loadout 7",
                    "value": "7"
                },
                {
                    "text": "Loadout 8",
                    "value": "8"
                }
            ]
        }
    },
    "ambrosiaIdleSwap": {
        "settingName": "ambrosiaIdleSwap",
        "settingDescription": "Ambrosia AFK swapper",
        "settingHelpText": "When enabled, automatically switches ambrosia loadouts depending on the ambrosia bar progress. IMPORTANT: BY DESIGN, THE AUTO SWAPPER WILL ONLY WORK WHEN IN THE AMBROSIA VIEW, SO NO 'SWAPPING IN THE BACKGROUND'",
        "settingType": "boolean",
        "enabled": true,
        "usesGameData": true,
        "settingAction": "ambrosiaIdleSwapAction",
        "settingControl": {
            "controlType": "switch",
            "controlGroup": "ambrosia2",
            "controlPage": "ambrosia",
            "controlEnabledId": "hs-setting-ambrosia-idle-swap-btn"
        }
    },
    "ambrosiaIdleSwapNormalLoadout": {
        "settingName": "ambrosiaIdleSwapNormalLoadout",
        "settingDescription": "Normal loadout",
        "settingHelpText": "Ambrosia AFK swapper will switch to this loadout when ambrosia bar is not full.",
        "settingType": "selectstring",
        "enabled": true,
        "settingValue": "",
        "settingControl": {
            "controlId": "hs-setting-idle-swap-normal-loadout-value",
            "controlType": "select",
            "controlGroup": "ambrosia2",
            "controlPage": "ambrosia",
            "selectOptions": [
                {
                    "text": "None",
                    "value": ""
                },
                {
                    "text": "Loadout 1",
                    "value": "1"
                },
                {
                    "text": "Loadout 2",
                    "value": "2"
                },
                {
                    "text": "Loadout 3",
                    "value": "3"
                },
                {
                    "text": "Loadout 4",
                    "value": "4"
                },
                {
                    "text": "Loadout 5",
                    "value": "5"
                },
                {
                    "text": "Loadout 6",
                    "value": "6"
                },
                {
                    "text": "Loadout 7",
                    "value": "7"
                },
                {
                    "text": "Loadout 8",
                    "value": "8"
                }
            ]
        }
    },
    "ambrosiaIdleSwap100Loadout": {
        "settingName": "ambrosiaIdleSwap100Loadout",
        "settingDescription": "100% loadout",
        "settingHelpText": "Ambrosia AFK swapper will switch to this loadout when ambrosia bar is about to hit 100%.",
        "settingType": "selectstring",
        "enabled": true,
        "settingValue": "",
        "settingControl": {
            "controlId": "hs-setting-idle-swap-100-loadout-value",
            "controlType": "select",
            "controlGroup": "ambrosia2",
            "controlPage": "ambrosia",
            "selectOptions": [
                {
                    "text": "None",
                    "value": ""
                },
                {
                    "text": "Loadout 1",
                    "value": "1"
                },
                {
                    "text": "Loadout 2",
                    "value": "2"
                },
                {
                    "text": "Loadout 3",
                    "value": "3"
                },
                {
                    "text": "Loadout 4",
                    "value": "4"
                },
                {
                    "text": "Loadout 5",
                    "value": "5"
                },
                {
                    "text": "Loadout 6",
                    "value": "6"
                },
                {
                    "text": "Loadout 7",
                    "value": "7"
                },
                {
                    "text": "Loadout 8",
                    "value": "8"
                }
            ]
        }
    },
    "ambrosiaMinibars": {
        "settingName": "ambrosiaMinibars",
        "settingDescription": "Ambrosia minibars",
        "settingHelpText": "Displays small blue- and red ambrosia progress bars in the page header",
        "settingType": "boolean",
        "enabled": true,
        "usesGameData": true,
        "settingAction": "ambrosiaMinibarAction",
        "settingControl": {
            "controlType": "switch",
            "controlGroup": "ambrosia3",
            "controlPage": "ambrosia",
            "controlEnabledId": "hs-setting-ambrosia-minibar-btn"
        }
    },
    "patch_ambrosiaViewOverflow": {
        "settingName": "patch_ambrosiaViewOverflow",
        "settingDescription": "Fix ambrosia view overflow",
        "settingHelpText": "This patch fixes an overflow issue in the ambrosia view which makes the page jump around when hovering over ambrosia upgrades.",
        "settingType": "boolean",
        "enabled": false,
        "settingAction": "patch",
        "patchConfig": {
            "patchName": "AmbrosiaViewOverflow"
        },
        "settingControl": {
            "controlType": "switch",
            "controlGroup": "patch",
            "controlPage": "patch",
            "controlEnabledId": "hs-setting-patch-ambrosia-view-overflow-btn"
        }
    },
    "patch_testPatch": {
        "settingName": "patch_testPatch",
        "settingDescription": "Test patch",
        "settingHelpText": "Test patch (makes the Buildings button color red)",
        "settingType": "boolean",
        "enabled": false,
        "settingAction": "patch",
        "patchConfig": {
            "patchName": "TestPatch"
        },
        "settingControl": {
            "controlType": "switch",
            "controlGroup": "patch",
            "controlPage": "patch",
            "controlEnabledId": "hs-setting-patch-test-btn"
        }
    },
    "patch_shopItemNameMapping": {
        "settingName": "patch_shopItemNameMapping",
        "settingDescription": "Display shop item names",
        "settingHelpText": "Populates the shop items with their names.",
        "settingType": "boolean",
        "enabled": true,
        "settingAction": "patch",
        "patchConfig": {
            "patchName": "ShopItemNameMapping"
        },
        "settingControl": {
            "controlType": "switch",
            "controlGroup": "patch",
            "controlPage": "patch",
            "controlEnabledId": "hs-setting-patch-shopnames-btn"
        }
    },
    "patch_iconSetCaching": {
        "settingName": "patch_iconSetCaching",
        "settingDescription": "IconSet Caching",
        "settingHelpText": "Use an alternative method of caching for certain icons to prevent excessive fetching when using DevTools. This probably doesn't matter for most players. Leave it off if you don't know what it does.",
        "settingType": "boolean",
        "enabled": false,
        "settingAction": "patch",
        "patchConfig": {
            "patchName": "IconSetCaching"
        },
        "settingControl": {
            "controlType": "switch",
            "controlGroup": "patch",
            "controlPage": "patch",
            "controlEnabledId": "hs-setting-patch-iconsets-btn"
        }
    },
    "useGameData": {
        "settingBlockId": "hs-setting-block-gamedata",
        "settingName": "useGameData",
        "settingDescription": "Game Data Sniffing (GDS)",
        "settingHelpText": "Enables game data sniffing by continuously scanning localStorage save data in the background. Enabling this gives the mod vastly enhanced functionality, but may cause performance issues on some systems.",
        "settingType": "boolean",
        "enabled": true,
        "settingAction": "useGameData",
        "settingControl": {
            "controlType": "switch",
            "controlGroup": "gamedata",
            "controlPage": "gamedata",
            "controlEnabledId": "hs-setting-use-game-data-btn"
        }
    },
    "stopSniffOnError": {
        "settingName": "stopSniffOnError",
        "settingDescription": "Auto disable on error",
        "settingHelpText": "When enabled, the mod will automatically disable game data sniffing if an error occurs. Recommended to be enabled as reading game data is not always reliable.",
        "settingType": "boolean",
        "enabled": true,
        "settingControl": {
            "controlType": "switch",
            "controlGroup": "gamedata",
            "controlPage": "gamedata",
            "controlEnabledId": "hs-setting-stop-sniff-on-error-btn"
        }
    },
    "startAutosing": {
        "settingName": "startAutosing",
        "settingDescription": "Start auto-sing",
        "settingHelpText": "when enabled, the mod will automatically perform singularities.",
        "settingType": "boolean",
        "enabled": false,
        "usesGameData": true,
        "settingAction": "startAutosingAction",
        "settingControl": {
            "controlType": "switch",
            "controlGroup": "auto-sing",
            "controlPage": "auto-sing",
            "controlEnabledId": "hs-setting-auto-sing-enabled"
        }
    },
    "singularityNumber": {
        "settingName": "singularityNumber",
        "settingDescription": "Singularity",
        "settingHelpText": "Controls at what singularity you wil auto-sing.",
        "settingType": "numeric",
        "enabled": true,
        "settingValue": 1,
        "settingControl": {
            "controlId": "hs-setting-auto-sing-number",
            "controlType": "number",
            "controlGroup": "auto-sing",
            "controlPage": "auto-sing",
            "controlOptions": {
                "min": 1,
                "max": 300,
                "step": 1
            }
        }
    },
    "autosingEarlyCubeLoadout": {
        "settingName": "autosingEarlyCubeLoadout",
        "settingDescription": "Pre-AOAG ambrosia cube loadout",
        "settingHelpText": "This is the ambrosia loadout that gives you the most cubes in the early game",
        "settingType": "selectstring",
        "enabled": true,
        "settingValue": "",
        "settingControl": {
            "controlId": "hs-setting-auto-sing-early-cube-loadout-value",
            "controlType": "select",
            "controlGroup": "auto-sing",
            "controlPage": "auto-sing",
            "selectOptions": [
                {
                    "text": "None",
                    "value": ""
                },
                {
                    "text": "Loadout 1",
                    "value": "1"
                },
                {
                    "text": "Loadout 2",
                    "value": "2"
                },
                {
                    "text": "Loadout 3",
                    "value": "3"
                },
                {
                    "text": "Loadout 4",
                    "value": "4"
                },
                {
                    "text": "Loadout 5",
                    "value": "5"
                },
                {
                    "text": "Loadout 6",
                    "value": "6"
                },
                {
                    "text": "Loadout 7",
                    "value": "7"
                },
                {
                    "text": "Loadout 8",
                    "value": "8"
                }
            ]
        }
    },
    "autosingLateCubeLoadout": {
        "settingName": "autosingLateCubeLoadout",
        "settingDescription": "Post-AOAG ambrosia cube loadout",
        "settingHelpText": "This is the ambrosia loadout that gives you the most cubes in the late game",
        "settingType": "selectstring",
        "enabled": true,
        "settingValue": "",
        "settingControl": {
            "controlId": "hs-setting-auto-sing-late-cube-loadout-value",
            "controlType": "select",
            "controlGroup": "auto-sing",
            "controlPage": "auto-sing",
            "selectOptions": [
                {
                    "text": "None",
                    "value": ""
                },
                {
                    "text": "Loadout 1",
                    "value": "1"
                },
                {
                    "text": "Loadout 2",
                    "value": "2"
                },
                {
                    "text": "Loadout 3",
                    "value": "3"
                },
                {
                    "text": "Loadout 4",
                    "value": "4"
                },
                {
                    "text": "Loadout 5",
                    "value": "5"
                },
                {
                    "text": "Loadout 6",
                    "value": "6"
                },
                {
                    "text": "Loadout 7",
                    "value": "7"
                },
                {
                    "text": "Loadout 8",
                    "value": "8"
                }
            ]
        }
    },
    "autosingQuarkLoadout": {
        "settingName": "autosingQuarkLoadout",
        "settingDescription": "Quark loadout",
        "settingHelpText": "This is the ambrosia loadout that gives you the most quarks. Note: this loadout is automatically selected right before the autosing presses the singularity button, the ascension button is also clicked so you gain the extra quarks.",
        "settingType": "selectstring",
        "enabled": true,
        "settingValue": "",
        "settingControl": {
            "controlId": "hs-setting-auto-sing-quark-loadout-value",
            "controlType": "select",
            "controlGroup": "auto-sing",
            "controlPage": "auto-sing",
            "selectOptions": [
                {
                    "text": "None",
                    "value": ""
                },
                {
                    "text": "Loadout 1",
                    "value": "1"
                },
                {
                    "text": "Loadout 2",
                    "value": "2"
                },
                {
                    "text": "Loadout 3",
                    "value": "3"
                },
                {
                    "text": "Loadout 4",
                    "value": "4"
                },
                {
                    "text": "Loadout 5",
                    "value": "5"
                },
                {
                    "text": "Loadout 6",
                    "value": "6"
                },
                {
                    "text": "Loadout 7",
                    "value": "7"
                },
                {
                    "text": "Loadout 8",
                    "value": "8"
                }
            ]
        }
    },
    "autosingObtLoadout": {
        "settingName": "autosingObtLoadout",
        "settingDescription": "Obt/Off Loadout",
        "settingHelpText": "This is the ambrosia loadout that gives you the most obtainium and offerings.",
        "settingType": "selectstring",
        "enabled": true,
        "settingValue": "",
        "settingControl": {
            "controlId": "hs-setting-auto-sing-obt-loadout-value",
            "controlType": "select",
            "controlGroup": "auto-sing",
            "controlPage": "auto-sing",
            "selectOptions": [
                {
                    "text": "None",
                    "value": ""
                },
                {
                    "text": "Loadout 1",
                    "value": "1"
                },
                {
                    "text": "Loadout 2",
                    "value": "2"
                },
                {
                    "text": "Loadout 3",
                    "value": "3"
                },
                {
                    "text": "Loadout 4",
                    "value": "4"
                },
                {
                    "text": "Loadout 5",
                    "value": "5"
                },
                {
                    "text": "Loadout 6",
                    "value": "6"
                },
                {
                    "text": "Loadout 7",
                    "value": "7"
                },
                {
                    "text": "Loadout 8",
                    "value": "8"
                }
            ]
        }
    },
    "autosingObtLoadout": {
        "settingName": "autosingObtLoadout",
        "settingDescription": "Obt/Off Loadout",
        "settingHelpText": "This is the ambrosia loadout that gives you the most obtainium and offerings.",
        "settingType": "selectstring",
        "enabled": true,
        "settingValue": "",
        "settingControl": {
            "controlId": "hs-setting-auto-sing-obt-loadout-value",
            "controlType": "select",
            "controlGroup": "auto-sing",
            "controlPage": "auto-sing",
            "selectOptions": [
                {
                    "text": "None",
                    "value": ""
                },
                {
                    "text": "Loadout 1",
                    "value": "1"
                },
                {
                    "text": "Loadout 2",
                    "value": "2"
                },
                {
                    "text": "Loadout 3",
                    "value": "3"
                },
                {
                    "text": "Loadout 4",
                    "value": "4"
                },
                {
                    "text": "Loadout 5",
                    "value": "5"
                },
                {
                    "text": "Loadout 6",
                    "value": "6"
                },
                {
                    "text": "Loadout 7",
                    "value": "7"
                },
                {
                    "text": "Loadout 8",
                    "value": "8"
                }
            ]
        }
    },
    "autosingAmbrosiaLoadout": {
        "settingName": "autosingAmbrosiaLoadout",
        "settingDescription": "Ambrosia loadout",
        "settingHelpText": "This is the ambrosia loadout that gives you the most ambrosia.",
        "settingType": "selectstring",
        "enabled": true,
        "settingValue": "",
        "settingControl": {
            "controlId": "hs-setting-auto-sing-ambrosia-loadout-value",
            "controlType": "select",
            "controlGroup": "auto-sing",
            "controlPage": "auto-sing",
            "selectOptions": [
                {
                    "text": "None",
                    "value": ""
                },
                {
                    "text": "Loadout 1",
                    "value": "1"
                },
                {
                    "text": "Loadout 2",
                    "value": "2"
                },
                {
                    "text": "Loadout 3",
                    "value": "3"
                },
                {
                    "text": "Loadout 4",
                    "value": "4"
                },
                {
                    "text": "Loadout 5",
                    "value": "5"
                },
                {
                    "text": "Loadout 6",
                    "value": "6"
                },
                {
                    "text": "Loadout 7",
                    "value": "7"
                },
                {
                    "text": "Loadout 8",
                    "value": "8"
                }
            ]
        }
    },
    "autosingStrategy": {
        "settingName": "autosingStrategy",
        "settingDescription": "autosing strategy",
        "settingHelpText": "This is the strategy that the autosinger will follow",
        "settingType": "selectstring",
        "enabled": true,
        "settingValue": "default_strategy",
        "settingControl": {
            "controlId": "hs-setting-auto-sing-strategy",
            "controlType": "select",
            "controlGroup": "auto-sing-strategy",
            "controlPage": "auto-sing",
            "selectOptions": []
        }
    },
    "editAutosingStrategy": {
        "settingName": "editAutosingStrategy",
        "settingDescription": "edit strategy",
        "settingHelpText": "Opens a new window where you can edit the selected autosing strategy",
        "settingType": "button",
        "enabled": true,
        "settingValue": "",
        "settingAction": "editAutosingStrategy",
        "settingControl": {
            "controlId": "hs-setting-auto-sing-strategy-editor-button",
            "controlType": "button",
            "controlGroup": "auto-sing-strategy",
            "controlPage": "auto-sing"
        }
    },
    "deleteAutosingStrategy": {
        "settingName": "deleteAutosingStrategy",
        "settingDescription": "delete strategy",
        "settingHelpText": "deletes the selected strategy",
        "settingType": "button",
        "enabled": true,
        "settingValue": "",
        "settingAction": "deleteAutosingStrategy",
        "settingControl": {
            "controlId": "hs-setting-auto-sing-strategy-deleter-button",
            "controlType": "button",
            "controlGroup": "auto-sing-strategy",
            "controlPage": "auto-sing"
        }
    },
    "createAutosingStrategy": {
        "settingName": "createAutosingStrategy",
        "settingDescription": "create strategy",
        "settingHelpText": "Opens a new window where you can create your own autosing strategy",
        "settingType": "button",
        "enabled": true,
        "settingValue": "",
        "settingAction": "createAutosingStrategy",
        "settingControl": {
            "controlId": "hs-setting-auto-sing-strategy-maker-button",
            "controlType": "button",
            "controlGroup": "auto-sing-strategy",
            "controlPage": "auto-sing"
        }
    },
    "exportAutosingStrategy": {
        "settingName": "exportAutosingStrategy",
        "settingDescription": "export strategy",
        "settingHelpText": "exports the selected strategy to your clipboard",
        "settingType": "button",
        "enabled": true,
        "settingValue": "",
        "settingAction": "exportAutosingStrategy",
        "settingControl": {
            "controlId": "hs-setting-auto-sing-strategy-exporter-button",
            "controlType": "button",
            "controlGroup": "auto-sing-strategy",
            "controlPage": "auto-sing"
        }
    },
    "importAutosingStrategy": {
        "settingName": "importAutosingStrategy",
        "settingDescription": "import strategy",
        "settingHelpText": "Opens a Modal where you can paste a strategy that you want to import",
        "settingType": "button",
        "enabled": true,
        "settingValue": "",
        "settingAction": "importAutosingStrategy",
        "settingControl": {
            "controlId": "hs-setting-auto-sing-strategy-importer-button",
            "controlType": "button",
            "controlGroup": "auto-sing-strategy",
            "controlPage": "auto-sing"
        }
    },
    "advancedDataCollection": {
        "settingName": "advancedDataCollection",
        "settingDescription": "Advanced data collection",
        "settingHelpText": "When enabled, collects advanced autosing data for debugging purposes.",
        "settingType": "boolean",
        "enabled": true,
        "settingControl": {
            "controlType": "switch",
            "controlGroup": "auto-sing-timer-modal",
            "controlPage": "auto-sing",
            "controlEnabledId": "hs-setting-auto-sing-advanced-data"
        }
    },
    "ambrosiaQuickBar": {
        "settingName": "ambrosiaQuickBar",
        "settingDescription": "Ambrosia quick bar",
        "settingHelpText": "When enabled, displays ambrosia loadout quick bar in the header. This is a quick way to load ambrosia loadouts without having to open the ambrosia menu.",
        "settingType": "boolean",
        "enabled": true,
        "settingAction": "ambrosiaQuickBarAction",
        "settingControl": {
            "controlType": "switch",
            "controlGroup": "quickbar-qol",
            "controlPage": "qol-buttons",
            "controlEnabledId": "hs-setting-ambrosia-quickbar-btn"
        }
    }
}`; var st = `{
    "hepteracts": {
        "groupName": "Hepteract settings",
        "order": 1
    },
    "notifications": {
        "groupName": "Notification settings",
        "order": 2
    },
    "log": {
        "groupName": "Log settings",
        "order": 3
    },
    "mouse": {
        "groupName": "Mouse settings",
        "order": 4
    },
    "ambrosia": {
        "groupName": "Ambrosia quickbar settings",
        "order": 5
    },
    "ambrosia2": {
        "groupName": "Idle Swapper settings",
        "order": 6
    },
    "ambrosia3": {
        "groupName": "Minibar settings",
        "order": 7
    },
    "patch": {
        "groupName": "Patch settings",
        "order": 8
    },
    "gamedata": {
        "groupName": "Game data settings",
        "order": 9
    },
    "shop": {
        "groupName": "Shop settings",
        "order": 10
    },
    "debug": {
        "groupName": "Debugging settings",
        "order": 11
    },
    "auto-sing": {
        "groupName": "Auto-Sing settings",
        "order": 12
    },
    "auto-sing-strategy": {
        "groupName": "Auto-Sing strategy settings",
        "order": 13
    },
    "auto-sing-timer-modal": {
        "groupName": "Auto-Sing timer modal settings",
        "order": 14
    },
    "quickbar-qol": {
        "groupName": "Quickbar QOL settings",
        "order": 15
    }
}`; var lt = `{
    "hepteract": {
        "page": "hepteract",
        "pageName": "Hepteracts",
        "pageColor": "mediumpurple",
        "order": 1
    },
    "ui": {
        "page": "ui",
        "pageName": "UI",
        "pageColor": "cyan",
        "order": 2
    },
    "log": {
        "page": "log",
        "pageName": "Logging",
        "pageColor": "orange",
        "order": 3
    },
    "input": {
        "page": "input",
        "pageName": "Input",
        "pageColor": "plum",
        "order": 4
    },
    "ambrosia": {
        "page": "ambrosia",
        "pageName": "Ambrosia",
        "pageColor": "gold",
        "order": 5
    },
    "patch": {
        "page": "patch",
        "pageName": "Patch",
        "pageColor": "fuchsia",
        "order": 6
    },
    "gamedata": {
        "page": "gamedata",
        "pageName": "Game Data",
        "pageColor": "crimson",
        "order": 7
    },
    "shop": {
        "page": "shop",
        "pageName": "Shop",
        "pageColor": "#b300b2",
        "order": 8
    },
    "debug": {
        "page": "debug",
        "pageName": "Debugging",
        "pageColor": "maroon",
        "order": 9
    },
    "auto-sing": {
        "page": "auto-sing",
        "pageName": "auto-sing",
        "pageColor": "#00ff7f",
        "order": 10
    },
    "qol-buttons": {
        "page": "qol-buttons",
        "pageName": "QOL-Buttons",
        "pageColor": "#c0c0c0",
        "order": 10
    },
    "misc": {
        "page": "misc",
        "pageName": "Misc.",
        "pageColor": "white",
        "order": 11
    }
}`; var ct = `[
    {
        "strategyName": "default_strategy",
        "strategy": [
            {
                "startPhase": "start",
                "endPhase": "challenge14",
                "corruptions": {
                    "viscosity": 0,
                    "drought": 0,
                    "deflation": 0,
                    "extinction": 0,
                    "illiteracy": 0,
                    "recession": 0,
                    "dilation": 0,
                    "hyperchallenge": 0
                },
                "strat": [
                    {
                        "challengeNumber": 105,
                        "challengeCompletions": 0,
                        "challengeWaitTime": 0,
                        "challengeMaxTime": 0
                    },
                    {
                        "challengeNumber": 6,
                        "challengeCompletions": 1,
                        "challengeWaitTime": 500,
                        "challengeMaxTime": 10000
                    },
                    {
                        "challengeNumber": 7,
                        "challengeCompletions": 0,
                        "challengeWaitTime": 500,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 8,
                        "challengeCompletions": 0,
                        "challengeWaitTime": 500,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 9,
                        "challengeCompletions": 0,
                        "challengeWaitTime": 500,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 10,
                        "challengeCompletions": 1,
                        "challengeWaitTime": 0,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 11,
                        "challengeCompletions": 0,
                        "challengeWaitTime": 0,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 6,
                        "challengeCompletions": 0,
                        "challengeWaitTime": 500,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 7,
                        "challengeCompletions": 0,
                        "challengeWaitTime": 500,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 8,
                        "challengeCompletions": 0,
                        "challengeWaitTime": 500,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 9,
                        "challengeCompletions": 0,
                        "challengeWaitTime": 500,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 10,
                        "challengeCompletions": 1,
                        "challengeWaitTime": 100,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 12,
                        "challengeCompletions": 0,
                        "challengeWaitTime": 0,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 6,
                        "challengeCompletions": 0,
                        "challengeWaitTime": 500,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 7,
                        "challengeCompletions": 0,
                        "challengeWaitTime": 500,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 8,
                        "challengeCompletions": 0,
                        "challengeWaitTime": 500,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 9,
                        "challengeCompletions": 0,
                        "challengeWaitTime": 500,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 10,
                        "challengeCompletions": 1,
                        "challengeWaitTime": 100,
                        "challengeMaxTime": 10000
                    },
                    {
                        "challengeNumber": 13,
                        "challengeCompletions": 0,
                        "challengeWaitTime": 0,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 10,
                        "challengeCompletions": 1,
                        "challengeWaitTime": 100,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 14,
                        "challengeCompletions": 0,
                        "challengeWaitTime": 0,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 10,
                        "challengeCompletions": 1,
                        "challengeWaitTime": 100,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 15,
                        "challengeCompletions": 1,
                        "challengeWaitTime": 500,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 104,
                        "challengeCompletions": 0,
                        "challengeWaitTime": 0,
                        "challengeMaxTime": 0
                    },
                    {
                        "challengeNumber": 103,
                        "challengeCompletions": 0,
                        "challengeWaitTime": 0,
                        "challengeMaxTime": 0
                    }
                ]
            },
            {
                "startPhase": "challenge14",
                "endPhase": "alpha",
                "corruptions": {
                    "viscosity": 0,
                    "drought": 6,
                    "deflation": 4,
                    "extinction": 11,
                    "illiteracy": 0,
                    "recession": 14,
                    "dilation": 4,
                    "hyperchallenge": 1
                },
                "strat": [
                    {
                        "challengeNumber": 5,
                        "challengeCompletions": 1,
                        "challengeWaitTime": 500,
                        "challengeMaxTime": 10000
                    },
                    {
                        "challengeNumber": 6,
                        "challengeCompletions": 1,
                        "challengeWaitTime": 500,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 7,
                        "challengeCompletions": 1,
                        "challengeWaitTime": 500,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 8,
                        "challengeCompletions": 1,
                        "challengeWaitTime": 500,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 9,
                        "challengeCompletions": 1,
                        "challengeWaitTime": 500,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 10,
                        "challengeCompletions": 1,
                        "challengeWaitTime": 500,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 15,
                        "challengeCompletions": 1,
                        "challengeWaitTime": 500,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 104,
                        "challengeCompletions": 0,
                        "challengeWaitTime": 0,
                        "challengeMaxTime": 0
                    },
                    {
                        "challengeNumber": 103,
                        "challengeCompletions": 0,
                        "challengeWaitTime": 0,
                        "challengeMaxTime": 0
                    }
                ]
            },
            {
                "startPhase": "alpha",
                "endPhase": "1e15-expo",
                "corruptions": {
                    "viscosity": 3,
                    "drought": 16,
                    "deflation": 1,
                    "extinction": 12,
                    "illiteracy": 16,
                    "recession": 16,
                    "dilation": 7,
                    "hyperchallenge": 7
                },
                "strat": [
                    {
                        "challengeNumber": 5,
                        "challengeCompletions": 1,
                        "challengeWaitTime": 500,
                        "challengeMaxTime": 10000
                    },
                    {
                        "challengeNumber": 6,
                        "challengeCompletions": 1,
                        "challengeWaitTime": 500,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 7,
                        "challengeCompletions": 1,
                        "challengeWaitTime": 500,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 8,
                        "challengeCompletions": 1,
                        "challengeWaitTime": 500,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 9,
                        "challengeCompletions": 1,
                        "challengeWaitTime": 500,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 10,
                        "challengeCompletions": 1,
                        "challengeWaitTime": 500,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 15,
                        "challengeCompletions": 1,
                        "challengeWaitTime": 500,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 104,
                        "challengeCompletions": 0,
                        "challengeWaitTime": 0,
                        "challengeMaxTime": 0
                    },
                    {
                        "challengeNumber": 103,
                        "challengeCompletions": 0,
                        "challengeWaitTime": 0,
                        "challengeMaxTime": 0
                    }
                ]
            },
            {
                "startPhase": "1e15-expo",
                "endPhase": "omega",
                "corruptions": {
                    "viscosity": 6,
                    "drought": 16,
                    "deflation": 16,
                    "extinction": 13,
                    "illiteracy": 16,
                    "recession": 16,
                    "dilation": 11,
                    "hyperchallenge": 10
                },
                "strat": [
                    {
                        "challengeNumber": 5,
                        "challengeCompletions": 1,
                        "challengeWaitTime": 500,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 6,
                        "challengeCompletions": 1,
                        "challengeWaitTime": 500,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 7,
                        "challengeCompletions": 1,
                        "challengeWaitTime": 500,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 8,
                        "challengeCompletions": 1,
                        "challengeWaitTime": 500,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 9,
                        "challengeCompletions": 1,
                        "challengeWaitTime": 500,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 10,
                        "challengeCompletions": 1,
                        "challengeWaitTime": 500,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 15,
                        "challengeCompletions": 1,
                        "challengeWaitTime": 500,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 104,
                        "challengeCompletions": 0,
                        "challengeWaitTime": 0,
                        "challengeMaxTime": 0
                    },
                    {
                        "challengeNumber": 103,
                        "challengeCompletions": 0,
                        "challengeWaitTime": 0,
                        "challengeMaxTime": 0
                    }
                ]
            },
            {
                "startPhase": "omega",
                "endPhase": "singularity",
                "corruptions": {
                    "viscosity": 10,
                    "drought": 16,
                    "deflation": 16,
                    "extinction": 16,
                    "illiteracy": 16,
                    "recession": 14,
                    "dilation": 14,
                    "hyperchallenge": 13
                },
                "strat": [
                    {
                        "challengeNumber": 106,
                        "challengeCompletions": 0,
                        "challengeWaitTime": 0,
                        "challengeMaxTime": 0
                    },
                    {
                        "challengeNumber": 5,
                        "challengeCompletions": 1,
                        "challengeWaitTime": 500,
                        "challengeMaxTime": 10000
                    },
                    {
                        "challengeNumber": 6,
                        "challengeCompletions": 1,
                        "challengeWaitTime": 500,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 7,
                        "challengeCompletions": 1,
                        "challengeWaitTime": 500,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 8,
                        "challengeCompletions": 1,
                        "challengeWaitTime": 500,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 9,
                        "challengeCompletions": 1,
                        "challengeWaitTime": 500,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 10,
                        "challengeCompletions": 1,
                        "challengeWaitTime": 500,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 15,
                        "challengeCompletions": 1,
                        "challengeWaitTime": 500,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 104,
                        "challengeCompletions": 0,
                        "challengeWaitTime": 0,
                        "challengeMaxTime": 0
                    },
                    {
                        "challengeNumber": 103,
                        "challengeCompletions": 0,
                        "challengeWaitTime": 0,
                        "challengeMaxTime": 0
                    }
                ]
            },
            {
                "startPhase": "singularity",
                "endPhase": "end",
                "corruptions": {
                    "viscosity": 16,
                    "drought": 16,
                    "deflation": 16,
                    "extinction": 16,
                    "illiteracy": 16,
                    "recession": 16,
                    "dilation": 16,
                    "hyperchallenge": 16
                },
                "strat": [
                    {
                        "challengeNumber": 5,
                        "challengeCompletions": 1,
                        "challengeWaitTime": 500,
                        "challengeMaxTime": 10000
                    },
                    {
                        "challengeNumber": 6,
                        "challengeCompletions": 1,
                        "challengeWaitTime": 500,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 7,
                        "challengeCompletions": 1,
                        "challengeWaitTime": 500,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 8,
                        "challengeCompletions": 1,
                        "challengeWaitTime": 500,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 9,
                        "challengeCompletions": 1,
                        "challengeWaitTime": 500,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 10,
                        "challengeCompletions": 1,
                        "challengeWaitTime": 500,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 11,
                        "challengeCompletions": 0,
                        "challengeWaitTime": 0,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 10,
                        "challengeCompletions": 70,
                        "challengeWaitTime": 500,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 12,
                        "challengeCompletions": 0,
                        "challengeWaitTime": 0,
                        "challengeMaxTime": 10000
                    },
                    {
                        "challengeNumber": 10,
                        "challengeCompletions": 70,
                        "challengeWaitTime": 100,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 13,
                        "challengeCompletions": 0,
                        "challengeWaitTime": 0,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 10,
                        "challengeCompletions": 70,
                        "challengeWaitTime": 100,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 14,
                        "challengeCompletions": 0,
                        "challengeWaitTime": 0,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 10,
                        "challengeCompletions": 70,
                        "challengeWaitTime": 100,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 15,
                        "challengeCompletions": 0,
                        "challengeWaitTime": 0,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 5,
                        "challengeCompletions": 1,
                        "challengeWaitTime": 100,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 6,
                        "challengeCompletions": 1,
                        "challengeWaitTime": 100,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 7,
                        "challengeCompletions": 1,
                        "challengeWaitTime": 100,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 8,
                        "challengeCompletions": 1,
                        "challengeWaitTime": 100,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 9,
                        "challengeCompletions": 1,
                        "challengeWaitTime": 100,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 10,
                        "challengeCompletions": 1,
                        "challengeWaitTime": 100,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 104,
                        "challengeCompletions": 0,
                        "challengeWaitTime": 0,
                        "challengeMaxTime": 0
                    },
                    {
                        "challengeNumber": 103,
                        "challengeCompletions": 0,
                        "challengeWaitTime": 0,
                        "challengeMaxTime": 0
                    },
                    {
                        "challengeNumber": 5,
                        "challengeCompletions": 1,
                        "challengeWaitTime": 100,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 6,
                        "challengeCompletions": 1,
                        "challengeWaitTime": 100,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 7,
                        "challengeCompletions": 1,
                        "challengeWaitTime": 100,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 8,
                        "challengeCompletions": 1,
                        "challengeWaitTime": 100,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 9,
                        "challengeCompletions": 1,
                        "challengeWaitTime": 100,
                        "challengeMaxTime": 1000000
                    },
                    {
                        "challengeNumber": 10,
                        "challengeCompletions": 1,
                        "challengeWaitTime": 100,
                        "challengeMaxTime": 1000000
                    }
                ]
            }
        ]
    }
]`; var x = class {
        static #e = "HSUIC"; static #t(e) { if (!e) return ""; let t = ""; for (let [a, n] of e.entries()) t += `data-${a}="${n}" `; return t } static #a(e) { switch (e) { case 1: return "checkbox"; case 2: return "color"; case 3: return "number"; case 4: return "text"; case 5: return "select"; case 6: return "state" } } static #r(e) { switch (e) { case 1: return "hs-panel-input-checkbox"; case 2: return "hs-panel-input-color"; case 3: return "hs-panel-input-number"; case 4: return "hs-panel-input-text"; case 5: return "hs-panel-input-select"; case 6: return "hs-panel-input-state" } } static #i(e) { if (!e) return ""; let t = ""; for (let [a, n] of Object.entries(e)) typeof n !== void 0 && (t += ` ${a}="${n}"`); return t } static Button(e) {
            let t = e.class ?? "", a = e.text ?? "", n = e.id ?? p.domid(), o = this.#i(e.props), i = this.#t(e.data); return S.injectStyle(`#${n} {
            ${p.objectToCSS(e.styles)}
        }`), `<div class="hs-panel-btn ${t}" id="${n}"${o} ${i}>${a}</div>`
        } static Input(e) {
            let t = e.class ?? "", a = this.#a(e.type), n = this.#r(e.type), o = e.id ?? p.domid(), i = this.#i(e.props), r = this.#t(e.data); return S.injectStyle(`#${o} {
            ${p.objectToCSS(e.styles)}
        }`), `<input type="${a}" class="${n} ${t}" id="${o}"${i} ${r}></input>`
        } static Select(e, t) {
            let a = e.class ?? "", n = this.#a(e.type), o = this.#r(e.type), i = e.id ?? p.domid(), r = this.#i(e.props), l = this.#t(e.data); S.injectStyle(`#${i} {
            ${p.objectToCSS(e.styles)}
        }`); let u = t.map(d => `<option value="${d.value}" ${d.selected ? "selected" : ""}>${d.text}</option>`).join(`
`); return `<select class="${o} ${a}" id="${i}"${r} ${l}>${u}</select>`
        } static Div(e) {
            let t = e.class ?? "", a = e.id ?? p.domid(), n = "", o = this.#i(e.props), i = this.#t(e.data); return e.html && (Array.isArray(e.html) ? n = e.html.join(`
`) : n = e.html), S.injectStyle(`#${a} {
            ${p.objectToCSS(e.styles)}
        }`), `<div class="hs-panel-div ${t}" ${a ? `id="${a}"` : ""}${o} ${i}>${n}</div>`
        } static P(e) {
            let t = e.class ?? "", a = e.id ?? p.domid(), n = "", o = this.#i(e.props), i = this.#t(e.data); return e.text && (Array.isArray(e.text) ? n = e.text.join(`
`) : n = e.text), S.injectStyle(`#${a} {
            ${p.objectToCSS(e.styles)}
        }`), `<p class="hs-panel-p ${t}" ${a ? `id="${a}"` : ""}${o} ${i}>${n}</p>`
        } static Image(e) {
            let t = e.class ?? "", a = e.id ?? p.domid(), n = this.#i(e.props), o = this.#t(e.data); if (!e.src) return c.warn("HSUIC.Image: No src provided for image component", this.#e), ""; let i = e.width ? e.width : b.HSUIC.defaultImageWidth, r = e.height ? e.height : b.HSUIC.defaultImageHeight; return S.injectStyle(`#${a} {
            ${p.objectToCSS(e.styles)}
        }`), `<img src="${e.src}" width="${i}" height="${r}" class="hs-panel-img ${t}" ${a ? `id="${a}"` : ""}${n} ${o}/>`
        } static Grid(e) {
            let t = e.class ?? "", a = e.id ?? p.domid(), n = "", o = this.#i(e.props), i = this.#t(e.data); return e.html && (Array.isArray(e.html) ? n = e.html.join(`
`) : n = e.html), S.injectStyle(`#${a} {
            display: grid;
            ${p.objectToCSS(e.styles)}
        }`), `<div class="hs-panel-div ${t}" id="${a}"${o} ${i}>${n}</div>`
        } static Flex(e) {
            let t = e.class ?? "", a = e.id ?? p.domid(), n = "", o = this.#i(e.props), i = this.#t(e.data); return e.html && (Array.isArray(e.html) ? n = e.html.join(`
`) : n = e.html), S.injectStyle(`#${a} {
            display: flex;
            ${p.objectToCSS(e.styles)}
        }`), `<div class="hs-panel-div ${t}" id="${a}"${o} ${i}>${n}</div>`
        } static _modal(e) {
            let t = e.class ?? "", a = e.htmlContent ?? "", n = e.data ?? [], o = e.title ?? "", i = e.id ?? p.domid(), r = this.#i(e.props), l = this.#t(e.data); return S.injectStyle(`#${i} {
            ${p.objectToCSS(e.styles)}
        }`), `<div class="hs-modal ${t}" id="${i}"${r} ${l}>
                    <div class="hs-modal-head">
                        <div class="hs-modal-head-left">
                        <div class="hs-modal-title">${o}</div>
                        </div>
                        <div class="hs-modal-head-right" data-close="${e.id}">x</div>
                    </div>
                    <div class="hs-modal-body">
                        ${a}
                    </div>
                    <div class="hs-modal-resizer"></div>
                </div>`}
    }; var dt = `.hs-panel-body::-webkit-scrollbar,
#hs-ui-log::-webkit-scrollbar {
    width: 5px;
    height: 5px;
}

.hs-panel-body::-webkit-scrollbar-track,
#hs-ui-log::-webkit-scrollbar-track {
    background: #1c1b22;
    border-radius: 3px;
}

.hs-panel-body::-webkit-scrollbar-thumb,
#hs-ui-log::-webkit-scrollbar-thumb {
    background: #a22a2a;
    border-radius: 3px;
}

.hs-panel-body::-webkit-scrollbar-corner,
#hs-ui-log::-webkit-scrollbar-corner {
    background: #1c1b22;
}

@supports not selector(::-webkit-scrollbar) {

    .hs-panel-body::-webkit-scrollbar,
    #hs-ui-log::-webkit-scrollbar {
        scrollbar-color: #a22a2a #1c1b22;
    }
}


#hs-panel,
.hs-panel-header,
.hs-panel-header-left,
.hs-panel-header-right,
.hs-panel-tabs,
.hs-panel-tab,
.hs-panel-body {
    box-sizing: border-box;
}

.hs-panel-closed {
    display: none;
}

#hs-panel {
    width: 500px;
    height: 400px;
    position: absolute;
    top: 100px;
    left: 100px;
    z-index: 7000;

    background-color: #1c1b22;
    border: 1px solid white;
    border-radius: 3px;

    -webkit-box-shadow: 3px 3px 5px 0px rgba(0, 0, 0, 0.75);
    -moz-box-shadow: 3px 3px 5px 0px rgba(0, 0, 0, 0.75);
    box-shadow: 3px 3px 5px 0px rgba(0, 0, 0, 0.75);

    font-family: -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        Roboto,
        Oxygen,
        Ubuntu,
        Cantarell,
        "Open Sans",
        "Helvetica Neue",
        sans-serif;

    opacity: 0.92;
}

.hs-panel-header {
    width: 100%;
    height: 45px;
    line-height: calc(45px - (5px * 2));
    font-size: 14pt;
    color: white;
    background-color: #353439;
    display: flex;
}

.hs-panel-header-left {
    padding: 5px 10px 5px 10px;
    flex-grow: 1;
}

.hs-panel-header-right {
    width: 36px;
    height: 36px;
    margin: 4px;
    border: 1px solid white;
    flex-grow: 0;
    line-height: 35px;
    text-align: center;
    font-size: 14pt;
    font-weight: bold;
}

.hs-panel-header-right:hover {
    background-color: maroon;
    cursor: pointer;
}

.hs-panel-tabs {
    width: 100%;
    height: 40px;
    padding: 0px 0px 0px 0px;
    color: white;

    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: center;
    align-items: center;
    align-content: space-between;
}

.hs-panel-tab {
    height: 100%;
    flex-grow: 1;
    flex-shrink: 1;
    flex-basis: auto;
    display: flex;
    justify-content: center;
    font-weight: bold;
    line-height: 40px;
    margin: 0px 2px 0px 2px;
    border-radius: 0px;
    font-size: 13pt;
}

.hs-panel-tab:hover {
    background-color: #006;
    cursor: pointer;
}

#hs-panel-tab-1 {
    border-top: 1px solid orange;
    border-left: 1px solid orange;
    border-right: 1px solid orange;
}

#hs-panel-tab-1.hs-tab-selected {
    background-color: orange;
}

#hs-panel-tab-2 {
    border-top: 1px solid cyan;
    border-left: 1px solid cyan;
    border-right: 1px solid cyan;
}

#hs-panel-tab-2.hs-tab-selected {
    background-color: blue;
}

#hs-panel-tab-3 {
    border-top: 1px solid maroon;
    border-left: 1px solid maroon;
    border-right: 1px solid maroon;
}

#hs-panel-tab-3.hs-tab-selected {
    background-color: maroon;
}

#hs-panel-tab-4 {
    border-top: 1px solid plum;
    border-left: 1px solid plum;
    border-right: 1px solid plum;
}

#hs-panel-tab-4.hs-tab-selected {
    background-color: plum;
}

#hs-panel-tab-5 {
    border-top: 1px solid royalblue;
    border-left: 1px solid royalblue;
    border-right: 1px solid royalblue;
}

#hs-panel-tab-5.hs-tab-selected {
    background-color: royalblue;
}

.hs-panel-body {
    width: 100%;
    height: calc(100% - 45px - 40px);
    background-color: #18171c;
    border-top: 1px solid white;
    display: none;
    padding: 5px;
    overflow-y: auto;
}

.hs-panel-body-open-flex {
    display: flex;
}

.hs-panel-body-open-block {
    display: block;
}

#hs-log-panel {
    flex-direction: column;
    flex-wrap: nowrap;
    justify-content: flex-start;
    align-items: flex-start;
    align-content: space-between;

    padding: 0;
    overflow: hidden;
}

#hs-ui-log {
    width: 100%;
    resize: none;
    box-sizing: border-box;

    background-color: #18171c;
    color: white;

    overflow-x: auto;
    overflow-y: scroll;

    flex-grow: 1;

    padding: 5px;
}

.hs-ui-log-line {
    font-family: consolas, courier-new;
    font-size: 9pt;
    white-space: nowrap;
}

.hs-ui-log-line-info {
    color: aqua;
}

.hs-ui-log-line-warn {
    color: yellow;
}

.hs-ui-log-line-error {
    color: red;
}

.hs-ui-log-line-debug {
    font-style: italic;
}

.hs-log-ts-hidden {
    display: none;
}

.hs-log-ctx {}

.hs-log-ts {}

#hs-ui-log-controls {
    width: 100%;
    height: 35px;
    box-sizing: border-box;
    margin: 5px;
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: flex-start;
    align-items: center;
    align-content: space-between;
}

#hs-panel-control {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 35px;
    height: 35px;
    background-image: url(https://synergism.cc/Pictures/Default/OcteractCorruptions.png);
    background-repeat: no-repeat;
    background-size: contain;
    transform-origin: 50% 50%;
}

#hs-panel-control:hover {
    cursor: pointer;
    transform: scale(1.05);
}

.hs-panel-btn {
    border: 2px solid white;
    min-height: 30px;
    color: white;
    transition: background-color 0.15s, border-color 0.15s;
    cursor: pointer;
    background-color: #101828;
    width: 130px;
    height: 30px;
    line-height: 30px;
    text-align: center;
}

.hs-panel-btn:hover {
    background-color: #005;
}

.hs-modal {
    width: auto;
    height: auto;
    position: absolute;
    z-index: 7000;

    top: -9001px;
    left: -9001px;

    background-color: #1c1b22;
    border: 1px solid white;
    border-radius: 3px;

    -webkit-box-shadow: 3px 3px 5px 0px rgba(0, 0, 0, 0.75);
    -moz-box-shadow: 3px 3px 5px 0px rgba(0, 0, 0, 0.75);
    box-shadow: 3px 3px 5px 0px rgba(0, 0, 0, 0.75);

    font-family: -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        Roboto,
        Oxygen,
        Ubuntu,
        Cantarell,
        "Open Sans",
        "Helvetica Neue",
        sans-serif;

    opacity: 0.97;
}

.hs-modal-head {
    width: 100%;
    height: 45px;
    line-height: calc(45px - (5px * 2));
    font-size: 14pt;
    color: white;
    background-color: #353439;
    display: flex;
}

.hs-modal-head-left {
    padding: 5px 10px 5px 10px;
    flex-grow: 1;
}

.hs-modal-head-right {
    width: 36px;
    height: 36px;
    margin: 4px;
    border: 1px solid white;
    flex-grow: 0;
    line-height: 35px;
    text-align: center;
    font-size: 14pt;
    font-weight: bold;
}

.hs-modal-head-right:hover {
    background-color: maroon;
    cursor: pointer;
}

.hs-modal-body {
    width: 100%;
    height: calc(100% - 45px);
    background-color: #18171c;
    border-top: 1px solid white;
    padding: 10px;
    box-sizing: border-box;
    overflow-x: hidden;
    overflow-y: auto;
}

.hs-modal-img {
    image-rendering: auto;
    width: 100%;
    max-width: 40vw;
}

#hs-settings-panel {
    padding: 10px;
    scrollbar-gutter: stable;
}

.hs-panel-setting-block {
    display: grid;
    grid-column: span 2;
    grid-template-columns: 2fr auto;
    /*grid-template-rows: auto auto;*/
    grid-column-gap: 5px;
    grid-row-gap: 5px;
    width: 100%;
    padding-bottom: 10px;
    /*border-bottom: 1px solid white;*/
    box-sizing: border-box;
    padding-left: 10px;
}

#hs-settings-panel>.hs-panel-setting-block:not(:last-child) {
    /*padding-bottom: 10px;
    margin-bottom: 10px;*/
}

.hs-panel-setting-block-text-wrapper {
    grid-column: 1 / span 2;
    box-sizing: border-box;
}

.hs-panel-setting-block-text:hover {
    cursor: help;
}

.hs-modal-resizer {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 16px;
    height: 16px;
    cursor: nwse-resize;
    background: linear-gradient(135deg, transparent 0%, transparent 50%, #888 50%, #888 100%);
}

.hs-modal-resizer:hover {
    background: linear-gradient(135deg, transparent 0%, transparent 50%, #aaa 50%, #aaa 100%);
}

.hs-panel-setting-block-num-input {
    display: block;
    height: 30px;
    border: 1px solid green;
    grid-column: 1 / 2;
    box-sizing: border-box;
}

.hs-panel-setting-block-select-input {
    display: block;
    height: 30px;
    border: 1px solid green;
    grid-column: 1 / 2;
    box-sizing: border-box;
    min-height: 20px;
    color: white;
    padding: 0 0 0 0.2em;
    background-color: #101828;
}

.hs-panel-setting-block-select-input:hover {
    cursor: pointer;
}

.hs-panel-setting-block-state {
    margin: 0;
}

.hs-panel-setting-block-btn {
    width: 30px;
    border: 1px solid green;
    display: block;
    grid-column: 2 / 3;
    height: 30px;
    box-sizing: border-box;
}

.hs-panel-settings-block-btn-standalone {
    grid-column: 1 / 1;
}

.hs-panel-setting-block-gamedata-icon {
    margin-left: 5px;
}

.hs-panel-setting-block-gamedata-icon:hover {
    cursor: help;
    filter: brightness(150%);
}

.hs-disabled {
    border: 1px solid red;
}

.hs-ambrosia-slot {
    background-repeat: no-repeat;
    background-size: 80%;
    background-position: center;
}

.hs-notification {
    position: fixed;
    width: 300px;
    max-width: 300px;
    height: 50px;
    max-height: 50px;
    color: #f5f6fa;
    border: 1px solid #f5f6fa;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 7000;
    padding: 5px;
    box-sizing: border-box;
}

.hs-notification-text {
    text-overflow: ellipsis;
    overflow: hidden;
    font-size: 10pt;
    max-height: 36px;
    text-align: center;
    box-sizing: border-box;
}

.hs-panel-info-h1 {
    font-size: 16pt;
    margin-left: 5px;
}

.hs-panel-info-h2 {
    font-size: 13pt;
    margin-left: 10px;
}

.hs-panel-info-p {
    font-size: 11pt;
    margin-left: 15px;
}

.hs-panel-subtabs {
    width: 100%;
    height: auto;
    padding: 0px 0px 0px 0px;
    color: white;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 5px;
}

.hs-panel-subtab {
    height: 25px;
    width: 100px;
    max-width: 100px;
    flex-grow: 1;
    flex-shrink: 1;
    flex-basis: auto;
    display: flex;
    justify-content: center;
    font-weight: bold;
    line-height: 25px;
    margin: 0px 2px 0px 2px;
    border-radius: 0px;
    font-size: 11pt;
}

.hs-panel-subtab:hover {
    background-color: #006;
    cursor: pointer;
}

.hs-panel-settings-grid {
    display: none;
    margin-top: 15px;
}

.hs-panel-settings-grid.open {
    display: block;
}

.hs-resizer {
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 10px;
    height: 10px;
    cursor: se-resize;
    user-select: none;
    background: linear-gradient(to right, #ee64ff 2px, transparent 2px) 0 0, linear-gradient(to left, #ee64ff 2px, transparent 2px) 100% 100%, linear-gradient(to bottom, #ee64ff 2px, transparent 2px) 0 0, linear-gradient(to top, #ee64ff 2px, transparent 2px) 100% 100%;
    background-repeat: no-repeat;
    background-size: 5px 5px;
}

a.hs-link:visited {
    color: #ff3d00;
}

a.hs-link:hover {
    color: #ff3d00;
    text-decoration: underline;
}

a.hs-link {
    color: #ff3d00;
    text-decoration: none;
}

.hs-rainbowBorder {
    border: 2px solid;
    --angle: 0deg;
    border-image: conic-gradient(from var(--angle), #ff5e00, #ff9a00, #ffcd00, #e5ff00, #a5ff00, #00ffc8, #00c8ff, #00a5ff, #9500ff, #ff00e1, #ff0095, #ff5e00) 1;
    animation: hue-rotate 6s linear infinite;
}

.hs-rainbow-text {
    color: #ff5e00;
    animation: hs-color_rotate 6s linear infinite;
}

#hs-panel-new-ver {
    background: linear-gradient(to right, #e74949 20%, #f9bb44 30%, #ff982e 70%, #b73636 80%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    background-size: 500% auto;
    animation: hs-animtext-1 3.5s ease-in-out infinite alternate;
}

/* Strategy Modal Styles */
.hs-strategy-modal-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 20px;
    width: 100%;
    height: 100%;
    min-width: 500px;
    min-height: 400px;
    background-color: #18171c;
    border-radius: 3px;
    box-sizing: border-box;
}

.hs-challenges-input-section {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px 20px;
}

.hs-challenges-input-label {
    white-space: nowrap;
    text-align: left;
    font-weight: 500;
}

/* Make inputs fill the remaining space */
.hs-challenges-input {
    width: 100%;
    box-sizing: border-box;
}

.hs-strategy-input-label {
    font-weight: 600;
    color: white;
    font-size: 14px;
    margin-bottom: 4px;
}

.hs-strategy-name-input {
    padding: 10px 14px;
    background-color: #101828;
    border: 2px solid white;
    border-radius: 3px;
    color: white;
    font-size: 14px;
    transition: all 0.2s;
    box-sizing: border-box;
}

.hs-strategy-name-input:focus {
    border-color: cyan;
    background-color: #005;
    outline: none;
}

.hs-strategy-phase-list {
    flex: 1;
    background-color: #1c1b22;
    border-radius: 3px;
    border: 1px solid #353439;
    padding: 12px;
    overflow-y: auto;
    box-sizing: border-box;
}

.hs-strategy-phase-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background-color: #353439;
    border: 1px solid white;
    border-radius: 3px;
    margin-bottom: 6px;
    transition: all 0.15s;
}

.hs-strategy-phase-item:hover {
    background-color: #005;
    border-color: cyan;
}

.hs-strategy-phase-text {
    flex: 1;
    font-weight: 500;
    color: white;
    font-size: 12px;
}

.hs-strategy-phase-arrow {
    color: cyan;
    font-weight: bold;
}

.hs-strategy-btn-group {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
}

.hs-strategy-btn {
    padding: 10px 20px;
    border-radius: 3px;
    border: 2px solid white;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    text-align: center;
    background-color: #101828;
    color: white;
    min-height: 30px;
    line-height: 30px;
}

.hs-strategy-btn:hover {
    background-color: #005;
}

.hs-strategy-btn-primary {
    border-color: green;
}

.hs-strategy-btn-primary:hover {
    background-color: #006;
}

.hs-strategy-btn-secondary {
    border-color: white;
}

.hs-strategy-btn-icon {
    padding: 4px 8px;
    font-size: 13px;
    min-width: 26px;
    width: 26px;
    height: 26px;
    line-height: 16px;
    border: 1px solid white;
}

.hs-jump-highlight {
    background: rgba(255, 200, 0, 0.25);
    outline: 4px solid rgba(255, 170, 0, 0.8);
}

.hs-strategy-btn-edit {
    border-color: orange;
}

.hs-strategy-btn-edit:hover {
    background-color: #660;
}

.hs-strategy-btn-delete {
    border-color: red;
}

.hs-strategy-btn-delete:hover {
    background-color: maroon;
}

.hs-strategy-empty-state {
    text-align: center;
    color: #888;
    padding: 40px 20px;
    font-style: italic;
}

/* Phase Modal Styles */
.hs-phase-modal-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 20px;
    width: 100%;
    height: 100%;
    min-width: 500px;
    min-height: 400px;
    background-color: #18171c;
    border-radius: 3px;
    box-sizing: border-box;
}

.hs-phase-select-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.hs-phase-label {
    font-weight: 600;
    color: white;
    font-size: 14px;
}

.hs-phase-select {
    padding: 10px 14px;
    background-color: #101828;
    border: 2px solid white;
    border-radius: 3px;
    color: white;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.15s;
    box-sizing: border-box;
}

.hs-phase-select:focus {
    border-color: plum;
    background-color: #005;
    outline: none;
}

.hs-phase-select:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    border-color: #666;
}

.hs-phase-config-group {
    display: flex;
    gap: 12px;
}

.hs-phase-config-btn {
    flex: 1;
    padding: 14px 20px;
    background-color: #101828;
    border: 2px solid plum;
    color: white;
    border-radius: 3px;
    font-weight: 600;
    cursor: pointer;
    text-align: center;
    transition: all 0.15s;
}

.hs-phase-config-btn:hover {
    background-color: #006;
}

.hs-phase-footer {
    display: flex;
    justify-content: flex-end;
}

.hs-phase-done-btn {
    padding: 12px 32px;
    background-color: #101828;
    border: 2px solid green;
    color: white;
    border-radius: 3px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
}

.hs-phase-done-btn:hover {
    background-color: #060;
}

/* Corruption Modal Styles */
.hs-corruption-modal-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 20px;
    width: 100%;
    height: 100%;
    min-width: 550px;
    min-height: 450px;
    background-color: #18171c;
    border-radius: 3px;
    box-sizing: border-box;
}

.hs-corruption-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    flex: 1;
    overflow-y: auto;
}

.hs-corruption-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px;
    background-color: #353439;
    border: 1px solid white;
    border-radius: 3px;
    transition: all 0.15s;
}

.hs-corruption-item:hover {
    background-color: #005;
    border-color: maroon;
}

.hs-corruption-icon {
    width: 40px;
    height: 40px;
    flex-shrink: 0;
}

.hs-corruption-label {
    flex: 1;
    font-weight: 600;
    color: white;
    font-size: 14px;
}

.hs-corruption-input {
    width: 70px;
    padding: 8px 12px;
    background-color: #101828;
    border: 2px solid white;
    border-radius: 3px;
    color: white;
    font-size: 14px;
    font-weight: 600;
    text-align: center;
    transition: all 0.15s;
    box-sizing: border-box;
}

.hs-corruption-input:focus {
    border-color: maroon;
    background-color: #005;
    outline: none;
}

.hs-corruption-footer {
    display: flex;
    justify-content: flex-end;
    padding-top: 10px;
    border-top: 1px solid #353439;
}

.hs-corruption-done-btn {
    padding: 12px 32px;
    background-color: #101828;
    border: 2px solid green;
    color: white;
    border-radius: 3px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
}

.hs-corruption-done-btn:hover {
    background-color: #060;
}

/* Challenges Modal Styles */
.hs-challenges-modal-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    width: 100%;
    height: 100%;
    min-width: 550px;
    min-height: 500px;
    background-color: #18171c;
    border-radius: 3px;
    box-sizing: border-box;
}

.hs-challenges-input-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    padding: 12px;
    background-color: #353439;
    border: 1px solid white;
    border-radius: 3px;
}

.hs-challenges-input-row {
    display: flex;
    align-items: center;
    gap: 8px;
}

.hs-challenges-input {
    flex: 1;
    padding: 5px 8px;
    background-color: #101828;
    border: 2px solid white;
    border-radius: 3px;
    color: white;
    font-size: 12px;
    transition: all 0.15s;
    box-sizing: border-box;
}

.hs-challenges-input:focus {
    border-color: royalblue;
    background-color: #005;
    outline: none;
}

.hs-challenges-add-btn {
    grid-column: 1 / -1;
    padding: 6px 16px;
    background-color: #101828;
    border: 2px solid green;
    color: white;
    border-radius: 3px;
    font-weight: 600;
    cursor: pointer;
    text-align: center;
    transition: all 0.15s;
    margin-top: 2px;
    font-size: 12px;
}

.hs-challenges-action-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
}

.hs-challenges-action-label {
    width: 80px;
    font-weight: 600;
    color: white;
    font-size: 13px;
}

.hs-challenges-action-select {
    flex: 1;
    padding: 6px 10px;
    background-color: #101828;
    border: 2px solid white;
    border-radius: 3px;
    color: white;
    font-size: 13px;
    transition: all 0.15s;
    box-sizing: border-box;
}

.hs-challenges-add-btn:hover {
    background-color: #060;
}

.hs-challenges-list-container {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
    background-color: #1c1b22;
    border: 1px solid #353439;
    border-radius: 3px;
    box-sizing: border-box;
}

.hs-challenge-item {
    display: flex;
    gap: 6px;
    padding: 6px 8px;
    background-color: #353439;
    border: 1px solid white;
    border-radius: 3px;
    margin-bottom: 4px;
    transition: all 0.15s;
}

.hs-challenge-item:hover {
    background-color: #005;
    border-color: royalblue;
}

.hs-challenge-item-text {
    flex: 1;
    font-weight: 500;
    color: white;
    font-size: 12px;
}

.hs-challenge-item-text>div {
    font-size: 11px;
    color: #4db8ca;
    margin-top: 2px;
}

.hs-challenge-controls {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    gap: 3px;
}

.hs-challenge-btn {
    padding: 3px 6px;
    min-width: 24px;
    width: 24px;
    height: 24px;
    cursor: pointer;
    background-color: #101828;
    border: 1px solid white;
    border-radius: 3px;
    text-align: center;
    font-weight: 600;
    line-height: 16px;
    font-size: 11px;
    transition: all 0.15s;
}

.hs-challenge-btn:hover {
    background-color: #005;
}

.hs-challenge-btn-edit {
    border-color: orange;
}

.hs-challenge-btn-edit:hover {
    background-color: #660;
}

.hs-challenge-btn-delete {
    border-color: red;
}

.hs-challenge-btn-delete:hover {
    background-color: maroon;
}

.hs-challenges-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding-top: 8px;
    border-top: 1px solid #353439;
}

.hs-challenges-footer-btn {
    padding: 10px 24px;
    border-radius: 3px;
    border: 2px solid white;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    background-color: #101828;
    color: white;
    font-size: 13px;
}

.hs-challenges-cancel-btn {
    border-color: white;
}

.hs-challenges-cancel-btn:hover {
    background-color: #005;
}

.hs-challenges-save-btn {
    border-color: green;
}

.hs-challenges-save-btn:hover {
    background-color: #060;
}

.hs-challenges-empty-state {
    text-align: center;
    color: #888;
    padding: 40px 20px;
    font-style: italic;
}

.hs-strategy-phase-list::-webkit-scrollbar,
.hs-corruption-grid::-webkit-scrollbar,
.hs-challenges-list-container::-webkit-scrollbar {
    width: 5px;
    height: 5px;
}

.hs-strategy-phase-list::-webkit-scrollbar-track,
.hs-corruption-grid::-webkit-scrollbar-track,
.hs-challenges-list-container::-webkit-scrollbar-track {
    background: #1c1b22;
    border-radius: 3px;
}

.hs-strategy-phase-list::-webkit-scrollbar-thumb,
.hs-corruption-grid::-webkit-scrollbar-thumb,
.hs-challenges-list-container::-webkit-scrollbar-thumb {
    background: #a22a2a;
    border-radius: 3px;
}

.hs-strategy-error {
    margin-top: 8px;
    padding: 6px 10px;
    background: rgba(255, 0, 0, 0.12);
    border-left: 3px solid #c33;
    color: #900;
    font-size: 0.9em;
}

#hs-autosing-timer-display {
    position: fixed;
    top: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.9);
    color: #fff;
    border-radius: 8px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    font-size: 14px;
    z-index: 10000;
    min-width: 200px;
    width: 280px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.hs-timer-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 8px 12px;
    cursor: move;
    display: flex;
    justify-content: space-between;
    align-items: center;
    user-select: none;
}

.hs-timer-title {
    font-weight: bold;
    font-size: 13px;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

.hs-minimize-btn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    width: 20px;
    height: 20px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
}

.hs-minimize-btn:hover {
    background: rgba(255, 255, 255, 0.4);
}

.hs-timer-content {
    padding: 12px;
}

.hs-timer-section {
    margin-bottom: 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.hs-timer-label {
    font-size: 10px;
    color: #888;
    margin-bottom: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.hs-export-btn {
    background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
    border: none;
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    font-weight: bold;
    width: 100%;
    margin-top: 4px;
    transition: filter 0.2s, box-shadow 0.2s;
    display: block;
}

.hs-export-btn:hover {
    filter: brightness(1.1);
    box-shadow: 0 2px 10px rgba(56, 239, 125, 0.3);
}

.hs-export-btn:active {
    filter: brightness(0.9);
}

@keyframes hs-color_rotate {
    0% {
        color: #ff5e00;
    }

    25% {
        color: #e5ff00;
    }

    50% {
        color: #00ffc8;
    }

    75% {
        color: #9500ff;
    }

    100% {
        color: #ff5e00;
    }
}

.hs-rainbow-text {
    font-weight: bold;
    animation: hs-color_rotate 6s linear infinite;
}

.hs-resize-handle {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 12px;
    height: 12px;
    cursor: nwse-resize;
    background: linear-gradient(135deg, transparent 50%, rgba(255, 255, 255, 0.2) 50%);
}

@keyframes hs-animtext-1 {
    0% {
        background-position: 0% 50%;
    }

    100% {
        background-position: 100% 50%;
    }
}

@-webkit-keyframes hs-animtext-1 {
    0% {
        background-position: 0% 50%;
    }

    100% {
        background-position: 100% 50%;
    }
}`; var gt = `<div id="hs-panel" class="hs-panel-closed">
    <div class="hs-panel-header">
        <div class="hs-panel-header-left" id="hs-panel-version">Hypersynergism</div>
        <div class="hs-panel-header-right">X</div>
    </div>
    <div class="hs-panel-tabs">
        <div class="hs-panel-tab hs-tab-selected" id="hs-panel-tab-1" data-tab="1">Log</div>
        <div class="hs-panel-tab" id="hs-panel-tab-5" data-tab="5">Info</div>
        <div class="hs-panel-tab" id="hs-panel-tab-2" data-tab="2">Tools</div>
        <div class="hs-panel-tab" id="hs-panel-tab-3" data-tab="3">Settings</div>
        <div class="hs-panel-tab" id="hs-panel-tab-4" data-tab="4">Debug</div>
    </div>
    <div class="hs-panel-body hs-panel-body-1 hs-panel-body-open-flex" id="hs-log-panel">
        <div id="hs-ui-log"></div>
        <div id="hs-ui-log-controls">
            <button class="hs-panel-btn" id="hs-ui-log-clear">Clear log</button>
        </div>
    </div>
    <div class="hs-panel-body hs-panel-body-2" id="hs-tools-panel">Tools</div>
    <div class="hs-panel-body hs-panel-body-3" id="hs-settings-panel">Setting</div>
    <div class="hs-panel-body hs-panel-body-4" id="hs-debug-panel"></div>
    <div class="hs-panel-body hs-panel-body-5" id="hs-info-panel">
        <h1 class="hs-panel-info-h1">Important information about the mod can be found here</h1>

        <h2 class="hs-panel-info-h2">12.5.2025 - Game Data Sniffing (GDS) and Singularity</h2>
        <p class="hs-panel-info-p">
            The mod will automatically disable GDS when the player enters a new Singularity or exits or leaves Singularity challenge.</br></br>
            This is because GDS reads and writes to localStorage heavily, which is fine otherwise,
            but results in stuttering and other issues if it is enabled when starting a new singularity.</br></br>
            <span style = "color: chartreuse">After a few seconds, the mod will automatically re-enable GDS for the new Singularity.</span>
        </p>
    </div>
    <div class="hs-resizer"></div>
</div>`; var S = class s extends L { constructor(t) { super(t); this.uiReady = !1; this.#d = new Set; this.#b = [{ tabId: 1, tabBodySel: ".hs-panel-body-1", tabSel: "#hs-panel-tab-1", panelDisplayType: "flex" }, { tabId: 2, tabBodySel: ".hs-panel-body-2", tabSel: "#hs-panel-tab-2", panelDisplayType: "block" }, { tabId: 3, tabBodySel: ".hs-panel-body-3", tabSel: "#hs-panel-tab-3", panelDisplayType: "block" }, { tabId: 4, tabBodySel: ".hs-panel-body-4", tabSel: "#hs-panel-tab-4", panelDisplayType: "block" }, { tabId: 5, tabBodySel: ".hs-panel-body-5", tabSel: "#hs-panel-tab-5", panelDisplayType: "block" }]; this.#a = dt, this.#t = gt } static #e = "HSUI"; #t; #a; #r; #i; #n; #o; #s; #l; static #u = !1; #d; static #m = new Map; static #g; #b; async init() { c.log("Initialising HSUI module", this.context); let t = this; s.#g = document.createElement("style"), s.#g.id = b.HSUI.injectedStylesDomId, document.head.appendChild(s.#g), s.injectStyle(this.#a, "hs-panel-css"), s.injectHTMLString(this.#t), this.#r = await y.HookElement("#hs-panel"), this.#i = await y.HookElement("#hs-panel-version"), this.#n = await y.HookElement(".hs-panel-header-right"), this.#s = await y.HookElement("#hs-ui-log"), this.#l = await y.HookElement("#hs-ui-log-clear"); let a = await y.HookElement(".hs-panel-header"), n = await y.HookElement(".hs-resizer"); this.#f(this.#r, a), this.#v(this.#r, n), this.#n.addEventListener("click", async () => { s.#u && t.#r && (await t.#r.transition({ opacity: 0 }), s.#u = !1, t.#r?.classList.add("hs-panel-closed")) }), this.#l.addEventListener("click", () => { c.clear() }); let o = document.querySelectorAll(".hs-panel-tab"); o.forEach(i => { i.addEventListener("click", r => { let l = r.target, u = l.dataset.tab ? parseInt(l.dataset.tab, 10) : null; if (!l.classList.contains("hs-tab-selected")) if (u) { let d = t.#b.find(m => m.tabId === u); if (!d) { c.error(`Could not find tab config for tabId ${u}`, t.context); return } o.forEach(m => { m.classList.remove("hs-tab-selected") }), l.classList.add("hs-tab-selected"), document.querySelectorAll(".hs-panel-body").forEach(m => { m.classList.remove("hs-panel-body-open-flex"), m.classList.remove("hs-panel-body-open-block") }); let g = document.querySelector(d.tabBodySel); if (g) { switch (d.panelDisplayType) { case "flex": g.classList.add("hs-panel-body-open-flex"); break; case "block": g.classList.add("hs-panel-body-open-block"); break }u === 1 && c.scrollToBottom() } } else c.error("tabId is null", t.context) }) }), this.#o = document.createElement("div"), this.#o.id = "hs-panel-control", this.#o.addEventListener("click", async () => { if (!s.#u && t.#r) { s.#u = !0, t.#r.style.opacity = "0", t.#r.classList.remove("hs-panel-closed"); let i = t.#M(1, t.#r); t.#r.style.left = `${i.x}px`, t.#r.style.top = `${i.y}px`, c.scrollToBottom(), await t.#r.transition({ opacity: .92 }) } }), document.body.appendChild(this.#o), this.uiReady = !0, this.isInitialized = !0 } static isModPanelOpen() { return s.#u } #f(t, a) { let n = 0, o = 0, i = 0, r = 0; a.onmousedown = l; function l(g) { g.preventDefault(), i = g.clientX, r = g.clientY, document.onmouseup = d, document.onmousemove = u } function u(g) { g.preventDefault(), n = i - g.clientX, o = r - g.clientY, i = g.clientX, r = g.clientY; let m = t.offsetTop - o, h = t.offsetLeft - n, A = t.getBoundingClientRect(), M = window.innerWidth, E = window.innerHeight, f = 45, v = 10; h = Math.max(-(A.width - f), Math.min(h, M - f)), m = Math.max(v, Math.min(m, E - f)), t.style.top = m + "px", t.style.left = h + "px" } function d() { document.onmouseup = null, document.onmousemove = null } } #v(t, a) { let n = t, o = a, i = !1, r, l, u, d; o.addEventListener("mousedown", h => { i = !0, r = h.clientX, l = h.clientY, u = n.offsetWidth, d = n.offsetHeight, document.addEventListener("mousemove", g), document.addEventListener("mouseup", m) }); function g(h) { if (!i) return; let A = u + (h.clientX - r), M = d + (h.clientY - l); A <= 500 && (A = 500), M <= 400 && (M = 400), A >= 1e3 && (A = 1e3), M >= 700 && (M = 700), n.style.width = A + "px", n.style.height = M + "px" } function m() { i = !1, document.removeEventListener("mousemove", g), document.removeEventListener("mouseup", m) } } async getLogElement() { if (this.#s) return this.#s; { let t = await y.HookElement("#hs-ui-log"); return this.#s = t, t } } replaceTabContents(t, a) { let n = this.#b.find(i => i.tabId === t); if (!n) { c.warn("Could not find tab to replace contents", this.context); return } let o = document.querySelector(n.tabBodySel); o && (o.innerHTML = a, c.log(`Replaced tab ${n.tabId} content`, this.context)) } updateTitle(t) { this.#i ? this.#i.innerText = t : c.warn("Could not update panel title", this.context) } static #h(t) { let a = t.indexOf("{"), n = t.indexOf("}"); if (a > -1 && n > -1) { a++; let o = t.substring(a, n); return p.isString(o) ? o.replace(/\s+/g, "").length === 0 : !0 } else return !0 } static injectStyle(t, a) { if (t && !this.#h(t)) { let n = a || "hs-injected-style-" + p.domid(); this.#m.has(n) || this.#m.set(n, t), this.updateInjectedStyleBlock(), c.debug("Injected new CSS", this.#e) } } static removeInjectedStyle(t) { this.#m.has(t) ? (this.#m.delete(t), this.updateInjectedStyleBlock(), c.debug("Removed injected CSS", this.#e)) : c.debug(`<yellow>Could not find style with id ${t}</yellow>`, this.#e) } static updateInjectedStyleBlock() { let t = document.querySelector(`#${b.HSUI.injectedStylesDomId}`); this.#g || (this.#g = document.createElement("style"), this.#g.id = b.HSUI.injectedStylesDomId, document.head.appendChild(this.#g)), this.#g.innerHTML = "", this.#m.forEach((a, n) => { s.#g.innerHTML += a }) } static injectHTMLString(t, a) { let n = document.createElement("div"); for (n.innerHTML = t; n.firstChild;)a ? a(n.firstChild) : document.body.appendChild(n.firstChild); c.debug("Injected new HTML", this.#e) } static injectHTMLElement(t, a) { a(t), c.debug("Injected new HTML", this.#e) } renameTab(t, a) { let n = this.#b.find(i => i.tabId === t); if (!n) { c.warn("Could not find tab to rename", this.context); return } let o = document.querySelector(n.tabSel); o && (o.innerHTML = a) } #M(t = 1, a) { let n = { x: 0, y: 0 }, o = window.innerWidth / 2, i = window.innerHeight / 2, r = 0, l = 0; if (a) { let u = a.getBoundingClientRect(); r = u.width, l = u.height } if (Number.isInteger(t)) switch (t) { case 1: n = { x: o - r / 2, y: i - l / 2 }; break; case 2: n = { x: window.innerWidth - 25 - r, y: i - l / 2 }; break; case 3: n = { x: 25 + r, y: i - l / 2 }; break; default: n = { x: o - r / 2, y: i - l / 2 }; break } else n = t; return n } async Modal(t) { let a = `hs-dom-${p.uuidv4()}`, n = x._modal({ ...t, id: a, title: t.title || "", styles: { opacity: 0 } }); s.injectHTMLString(n); let o = document.querySelector(`#${a}`), i = document.querySelector(`#${a} > .hs-modal-head`); if (this.#d.add(o), t.needsToLoad && t.needsToLoad === !0) { let r = document.querySelectorAll(`#${a} > .hs-modal-body img`), l = Array.from(r).map(u => new Promise(d => { u.complete ? d() : (u.addEventListener("load", () => d()), u.addEventListener("error", () => { d() })) })); await Promise.all(l) } if (o) { let r = this.#M(t.position, o), l = o.getBoundingClientRect(), u = window.innerWidth, d = window.innerHeight, g = r.x, m = r.y; g + l.width > u - 10 && (g = u - l.width - 10), g < 10 && (g = 10), m + l.height > d - 10 && (m = d - l.height - 10), m < 10 && (m = 10), o.style.left = `${g}px`, o.style.top = `${m}px`, await o.transition({ opacity: 1 }), this.#f(o, i); let h = o.querySelector(".hs-modal-resizer"); h && this.#v(o, h), o.addEventListener("click", async function (A) { let M = A.target.dataset.close; if (M) { let E = document.querySelector(`#${M}`); E && (await E.transition({ opacity: 0 }), E.parentElement?.removeChild(E)) } }) } return a } CloseModal(t) { if (t) { let a = document.getElementById(t); a && (a.remove(), this.#d.delete(a)) } else this.#d.forEach(a => a.remove()), this.#d.clear() } static async Notify(t, a) { let n = { position: a?.position ?? "bottomRight", popDuration: a?.popDuration ?? 400, displayDuration: a?.displayDuration ?? 4e3, hideDuration: a?.hideDuration ?? 2300, notificationType: a?.notificationType ?? "default" }, o = document.createElement("div"), i = document.createElement("div"); o.className = b.HSUI.notifyClassName, i.className = b.HSUI.notifyTextClassName; let r = 300, l = 50, u = { default: "#192a56", warning: "#cd6133", error: "#b33939", success: "#009432" }, d = { topLeft: { top: `-${l}px`, left: "15px" }, top: { top: `-${l}px`, left: `calc(50vw - ${r / 2}px)` }, topRight: { top: `-${l}px`, right: "15px" }, right: { top: `calc(50vh - ${l / 2}px)`, right: `-${r}px` }, bottomRight: { bottom: `-${l}px`, right: "15px" }, bottom: { bottom: `-${l}px`, left: `calc(50vw - ${r / 2}px)` }, bottomLeft: { bottom: `-${l}px`, left: "15px" }, left: { top: `calc(50vh - ${l / 2}px)`, left: `-${r}px` } }, g = { topLeft: { top: "15px" }, top: { top: "15px" }, topRight: { top: "15px" }, right: { right: "15px" }, bottomRight: { bottom: "15px" }, bottom: { bottom: "15px" }, bottomLeft: { bottom: "15px" }, left: { left: "15px" } }; o.style = p.objectToCSS({ ...d[n.position], opacity: "1", backgroundColor: u[n.notificationType] }), i.innerText = t, o.appendChild(i), document.body.querySelectorAll(`.${b.HSUI.notifyClassName}`).forEach(m => { m.clearTransitions(), m.remove() }), document.body.appendChild(o), await o.transition({ ...g[n.position] }, n.popDuration, "linear(0, 0.408 26.7%, 0.882 50.9%, 0.999 57.7%, 0.913 65.3%, 0.893 68.8%, 0.886 72.4%, 0.903 78.5%, 0.986 92.3%, 1)"), await p.wait(n.displayDuration), await o.transition({ opacity: "0" }, n.hideDuration, "linear"), i.remove(), o.remove(), i = null, o = null } }; var ee = class s extends L { static #e = ""; static #t; static #a; static #r; static #i; static #n = []; constructor(e) { super(e), s.#e = e.context } async init() { let e = this; c.log("Capturing mouse events", this.context), document.addEventListener("mousemove", s.#o.bind(s)), document.addEventListener("keydown", function (t) { let a = C.getSetting("reactiveMouseHover"), n = C.getSetting("autoClick"); t.code === "ShiftLeft" && !s.#r && a.isEnabled() && (s.#r = setInterval(() => { s.#s("mouseover") }, a.getCalculatedValue())), t.code === "ControlLeft" && !s.#i && n.isEnabled() && (s.#i = setInterval(() => { s.#s("click") }, n.getCalculatedValue())) }), document.addEventListener("keyup", function (t) { t.code === "ShiftLeft" && s.clearInterval("hover"), t.code === "ControlLeft" && s.clearInterval("click") }), this.isInitialized = !0 } static #o(e) { this.#t = { x: e.clientX, y: e.clientY }, this.#l() } static #s(e) { let { x: t, y: a } = this.#t, n = document.elementFromPoint(t, a); if (n) { if (e === "click" && C.getSetting("autoClickIgnoreElements").getValue()) { if (n.id && n.id !== "" && b.HSMouse.autoClickIgnoredElements.includes(`#${n.id}`)) return; n.classList.length > 0 && n.classList.forEach(r => { b.HSMouse.autoClickIgnoredElements.includes(`.${r}`) }) } let o = new MouseEvent(e, { view: window, bubbles: !0, cancelable: !0 }); n.dispatchEvent(o) } } static #l() { if (S.isModPanelOpen()) if (!this.#a || this.#a === void 0) { let e = document.querySelector("#hs-panel-debug-mousepos"); e && (this.#a = e, this.#a.innerHTML = `Mouse: (X: ${this.#t.x}, Y: ${this.#t.y})`) } else this.#a.innerHTML = `Mouse: (X: ${this.#t.x}, Y: ${this.#t.y})` } static clearInterval(e) { e === "hover" && s.#r ? (clearInterval(s.#r), s.#r = null) : e === "click" && s.#i && (clearInterval(s.#i), s.#i = null) } static getPosition() { return this.#t } }; var pt = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyBpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNSBXaW5kb3dzIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjlFRTlFRTgzMzRENzExRURBOTNGRjlGMjMxMjY1Njg0IiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjlFRTlFRTg0MzRENzExRURBOTNGRjlGMjMxMjY1Njg0Ij4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6OUVFOUVFODEzNEQ3MTFFREE5M0ZGOUYyMzEyNjU2ODQiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6OUVFOUVFODIzNEQ3MTFFREE5M0ZGOUYyMzEyNjU2ODQiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz598tXoAAANF0lEQVR42pxbfYhdRxWf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"; var mt = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyBpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNSBXaW5kb3dzIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjlBQjBCNzc0MzRENzExRUQ4ODQ2OUJFMUNFRTNFMzAyIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjlBQjBCNzc1MzRENzExRUQ4ODQ2OUJFMUNFRTNFMzAyIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6OUFCMEI3NzIzNEQ3MTFFRDg4NDY5QkUxQ0VFM0UzMDIiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6OUFCMEI3NzMzNEQ3MTFFRDg4NDY5QkUxQ0VFM0UzMDIiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz6Zz/0GAAAO5UlEQVR42sRbDZAcRRV+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"; var ht = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyBpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNSBXaW5kb3dzIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjlDMDZBRjg2MzRENzExRUQ4N0I0RDkzMDZENDJFM0ZFIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjlDMDZBRjg3MzRENzExRUQ4N0I0RDkzMDZENDJFM0ZFIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6OUMwNkFGODQzNEQ3MTFFRDg3QjREOTMwNkQ0MkUzRkUiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6OUMwNkFGODUzNEQ3MTFFRDg3QjREOTMwNkQ0MkUzRkUiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7QX0wqAAATBElEQVR42qRbC3BdxXnePfcajAxEteglohEdSQbHJGDMQzyaWg3llU7aicHB129gaEkptWw3TTLuQ3UfTEkzgDV5kJRHYsu2oAZnKE0DpJmRZlqCS0jNy7WxdScjalENSmwTsGNb5+/+u/+/++/ecyVBz8y599xzzj1n/+9///+urt57KyillVLmy39Pf4v/Uf9/Td/Q8EzRO8N4wlWY4t3vb8T83zKeunTDEqV1uKUOCoRITzFk+lPRfyTJeB9o8YzkoTyOQsLEw3T9Kfc7uQcke3W4jude/LsBBECHF5qPnYv/VLV85ENq/M3D0bvxHG1rzN5XcN2ep+stZm8uIOGQ2cf5L1Owqtm8o4ffy+8zvzfS796Ca3XjTrebdvxD9DuzVGdguAKe+CLC6cFVBgHP076JB0XXdxORzxPBB8Q+Lh49TvsecSz3Q/TcTbjz+xLANybM2cjHjeh40tCItIJ2MmZVAH98d9EXG6JGL8NtlPb5xGm5IeEjC7+6oTZ09z0j4v5WOq6Yfex9KOt48jt9Hz8LQWgmApslsRIEKSU7b/qC+sx3v2x1walABoUihL9v2nZAPbmsU754hIiqJAPCc62G+Da6RzUYsPp/XhsV75OqpYQUKjE+VLXeOvXQudV5qwIsDinxjPqi7Qf6+Lw5HhaDsNvN2w703bxt/0Ay0LZEaoo2PL+rgLj0HrmP0D5K4KSqU6FruyX3mTb8RtqAmJ6ho4ESpCJfFfpsLfeibcMIQuvOpZ3di7YdGKSX2/2JZZ1VfM5n60Hw27L+NwaW9+8bWGG+V5pvwcW2Aq6OTiIRbbSPEHhP0zh5HxMgWYBQhevUgQEAIQFsaIzYD9A+aMS/yn4Yz+HRzmWd3XzM2w4Ewdy4pH//oOC+37atOM9ez2i/dbMFYVR9sA2B6hJ7a6ISXTSGSqMH5BpslJFZp5zlETqG6G60DXhp0fbhAXbO+Psmx328p7o44fjjy+dU8dal/W8MJu+zItu/8nwjKbn34Ldv3pveV6G9VajHSAObUqQeqcqNib078iSlXIEZil56z+1w4Vd+Vz193V9KvbeGZ1HEZassdATqiWVzuvH4lq37Bw3h9rjav39IuygLsVJbV5zXYcS9pgHs2S0rz2/H+27bvHeYxM/GJBleNcffvPWj7dPgftsHkBYG5hqMH/DHp5/bqF75/NPGBuROAoj4TfKfRtSrMszSZA/w+7Nbragj17tR7KtbPfGWKDxeuWXfMBrbTICH26Or5nZk9DxDPOgkmpts+9JDrwxteOjlISEZU+3S0PrgCY0g0q6X/e0dcEHfjeqFlQ+wT0VLOobctwAo5XU/E2GvtjGtPdZ4rMEFuY6bjmDtQgynTAYSTeFmRlKE8YiTAiDQUCpAffW2C+ok4fMPv1orm2t4XdNYULIyOsbzf37nxQsbGNMRsgvzEAQ8cWX/WvXa3d9XZT2BXiCvCzSQeAJhDdqEm0n3tQfBBfUaOQgaOW5wMMfacT9ztGrtOAzukgMv89Jkb2cJMGC4e3oeeb3G0sTEeaJZdTSI57gx3fPN/xraEEBIY4UKMdcGTrnOe1ACnAo4APpSf4wgGO7b88bVdViiLXFMPA3AgsCi7/TfSQyQjtuQE7Q/B16V0Aoz571EaPCE0nkHHLh3251/g3seS8TfP/jSUKOAVuQfPch0AiCzbxVB0JhEzlr7rY77/7R8TgeLsdRbBsENgrjuCSROm8GVwCLo7tdeSpAYkhq7gyfcvwcYzFgKvIRIcOqsSYVCd956kVYHQEYAlHIOfsaEK6oE4wf6lq02AkSj12F1XEMYGABl7sRlQ2/GIJCe4iEOcgbqguequWafk+PAtQ6qoby0QBB19hZeirwkgVcFfMd933jpMeEOx5LkyxnBkjOCmYkIVO5UQAYNLTdv8+HvLipL6CVb9w9X+9+oOX0XXkF7cccBg/JGjaSCRBTIPpRBecvvuOeMZubspo3PM3K8XgIgqA3bEfYuGV3PvG0CJWKHUREL+FzBihlKQJZ7I9gnQBjHl1Cg0/X48s52w/l2Z7R48AkIwiqTQYtsAnMpt5x2kpB5bkMAktQBgWSiMkk4xNzOovczMKAaBFhjHOpDaYIkYAJtQF5nMXYsd6GtCXQGojiAiSL3loqtBYFiZxJZrZnjNGhn51ASIJIEAaD2dkV4AG8HAKTEBW8g7ERBqr5bAgJGDPUES0A5TyspY2T0qvhQI/bDSr4EAmezUMWiQenAUXAgIFcjYslDBpcYDF5GAGbWZrhnaG9nVGToROAV/me+19x12ZQRJTLdAqDqjWCUfz+2/Dyb6ZlsblhLAp17A+VckfZiSsRk2ltsSwBqTzkPNsGe0w6YEgQCIttAgRUHSwSINZolQbD/j1ZRbbNB7kBGkFRAn0QMoOGNuG1fgZLgUkfO5lxoCxYErw5koVmcFXjVsCAgdiXIvYvEc5iPlK090MRd4QJdrKE12axMJTqfqgQZygabTKr6rBdACcAPKE+oxP21pv/GxCbUXcFabk5mUKG9OgixzoQfL1MMgKJvCYZgtDAkL6vcu83g74Hths6EHZG2JvPqpj0YkyRRXZzx5iQBZfwoMoJFEmGyuY7Vm02C4ziqNUBiGEH/zttv62fOOgvikNepzey39svRwQ/eOxq95KG978HAghZ1yYxfiQTZ+g2Hsdo3a1Zk9HzkCMFITrFVsEACP837MsP8sg2EypAaQC49tYlvtXrL3ppwbdats8vJ2CaY7xvHx/Wzs2ezaqgXa6+qa5tOU0jwBTNsHVatf/VIXANvm2X36k/G1cAC91AGAoWHQHCq51VAx54AvAdoVJeskARYFVDWC5xENziREs9lrEH5MKAiCbsxjPZywjy3oqz1sy0tmPio6wwIR9/co7702mueeMNhS3hKfNH2ubePqa7RUXj6vTGQILgqjsgTfJAkbE8AoTVJjGw+gOV2VHsbCqMXyMt5ynn7ACRtBVV3Vm1xhQ3vxrRzY1Z3RTJyvSH831pm24H/9WEPrOU8cxn3ht0QkoIHz5ppf+MzJAgyBggeIoDxB3/c1V5Ura4riZWcGyyjF6BIMLWYbUzwKixsOIvvMzNrwa0bs2E15Npdx+3oyH8rJh4JOXjihHr9xEm1uImCrPf0pCCkm3vWGHy6qaJDjJFTiytEkcIDjBSkwxHOSLO1AVnuAagk+UCr5pYBWB/L7TWbwCgQ7TyDVBlcG+7Lhw/aYTCxUu95W9wUW2p5/ZwZM5Qi7rMUMICvm2cvARqD8AiZDilzYvVHExA4GRoHlgAbCjsAOFe+htpVasuK86urN+8dsEkHKK7wcInUix+eKjk3Bqjn6Xbfx88sJBaJ4u/0f+gNUBXSrSpqCVq6Sjp+tO+F2m1rrmiXxjuJbWxOwABkKAZ5vQp4SfjOqrnVIHbgih8UB8gYHmwKrNQ/3ni5/d8dc5u8mKPRY8JRnHlHVeBd2gdJPJ/D5+3rmqNlCUwWRhTENYpGLpC/2QbYQEiVJo8DHlk1t/vh1a6Q6QjW3vApwRG0Cd0/+7l++IbLPEcn0/VUFYoMIt/3hQ+do9+cOTOJL4hgrUVOoSaNav3mAThZKAFjBe0o9a3VH+0QhQmIMzHXXkBX9Zs/P6S/ff1lnkAkhKUgJfrQyLt1oCD3U+KtUv/ylzqTCZCSZbHwuyD8HW3kBawKgHODzbSPT9ZRcSmwr8ZCCHkD+gjC1YcO6d86d54ncDpWH+/FmCEC48Md/pm+Ip1LlRQGEaY/ZQRpDrlACIUPify5bvvDb++pybq/zQTNa2XsL8PXrsOH9fbrLvEgoN5LAlH3JfGo58x95vy5R4/p/zGiH9UkNIQcQKqCGc/KtVe2T9JI4Ux3zKbDJxmAkvXZz5P1390ItQwi96NDRQeztbj5wSBceviIfuzaBZGoSzWQkoHg8O+lH+5Ub5420xbcP2JE/+App4CvOXBFWofaoDWI5t5tDzxfEw3UhkaQ4wACAIrigCLxD1mY03+dASdFAEWpKBKw4Mg7+onfdiBgiCulQHIfr9kSfEe7N64HTz3VPvWc48f1/yIIIunRUWAWVCLhPkeCsjI8lksVoFC4j2KB+WkEdZcRffzGjk1APNJBnfFkA1UMwoXvvKN3XnOxl4RGHmAHEs81B9Lzt4j7ZxsQ2O6E2J+jwFBbnITzHO9UlJF6LwHUHd6YTEvxIHz91nntUg3S+htVc2xV6EdnntkQhI/94hf6nz85PwpwmPtoD3a1tuqMkx0VGiS4j82YAZQNaueGfYQqgiITKK27aqpy2LjvDU6UokCot6CKWm8HRH0+ao64dMVKwouTgDD33Xf1v3xyfp0U7Ohw1r7t2LHQQhPije/9mQGBq0+2dK65CgS+7lBQ/YmMX50bRBSgcSDUKh+0/pHXaiH6C1FgyaelSnUZfb/syBH90hlnNAThPAPC4tZOawuQ+87aH/XW/teM0fNpLtf8g7qFDhTE4TB+77j/P2pJHLCrIMYJobBrjvrW2FgysWBXjyHaEf9qTUNoUJREjy6oBqgfn3GGMsRblXj59NPh9VlNak9Tk9pr9n2G4P1mHz6tyV6ffeY5qnp2pzbWXhnibQtt1Oi70XlrV5QWpTEtjZ4Lx3WSnXId0jd47/v3WsM4wAKAJTGUADc/YCO1j+XWten2j1l3YrK9Wux7Q9Mi06JZga0Pap3ZJgdoHyj5DpAOPcGME6wQ4urQcRaNlagnqdXMT30cyuefrY9u+kEYk3YPfjImvC1RbXTzg84GeAnIp5yepqGAeOZOzufC3ICsrnjhytm+ehP8uK4LqV27nXqIsuQeRP74915WE/vegtN6ro1cIkskj7NgSl9rkAAfCYISU1vHBfE+hr73jgsXBsJUlHykg8uSbg0TrdO6v68M6xDQBHdm5w5kbDpATqxw7z3xvVcsLaeuvY76gSBsAqjP/Mkn2pM8oIWrwr4xgnUxygZ7GkxM9Bb1njsuWhgKEGC9Z9qfz1hfQUXzAELfTgDDz0rmDITGCmjZZ5x544Ux2Ob+4w88a0E4Zd31PgZYtP4T7UQ8zmscFMRjpDtqm0AG/cwlQ1FZvLfBdDSvR3/z+waERAKCuFMJHETfPpoVAsJrBLXKlFApn9QAu1dfAUKdP/VTF/nCKAN94v7nXH6z/npD/G/4OOCpi+YPFwREWPCZl2P0y83RnCZIiP5gpaBRYve/+tbuIQ1JL08lMziIAB319aG+3a1Cyc1bcy3nA4Sav0/jDQgz114b7BLZlvz+Z6JZ9pb4gbrJIp2k6r0ovk4CUAXCXOHuZFJBcSCkVcQ5KZZ8rpRKBhYtgKfXCKnQEDdI45klHhT8PvbAc94mn2L0PjRlqUh33zPqKZg17In/11ekQW+WcyGtDchFOkxusLVgUkGLlAYvtqJHKMvSnKwoiFvVJYA4f9d0j+e+jj1LFOGF9xy/P4BQRr1X4BMnC92egyohXqb6B3gavjX8tjs84WeL49yZgYJk6IdSIv7izouXpNlYXQ9f2ABVN7VNVHNYSkR+70FR1AiBJPND6+8Mn6W4tO4Gv1rFgoGE1xM/jySAvUAvApC53mBm580K/cessFv4zzQnGN1w54KF9z74k6F4koIzfmtFb/7rX/vPGoNx592XR0nKo5teqHEs6+cVUrS3rOeq9gET0urIrekIiN/T77aTce5+av0Ng5bz9YSnEtAcFTcmqDmKP8Rs6mqD9QBjwjOMfvFzCxY2aEH7COyuP7q8rcE1dVvPFe3f2fSjGhsxBmHZWpfNVddd3f64BcERvHj91QuLnmO3+XOc6E+9HeKlNhh+ZiYKLnMgJCRggIzhdOfgppXXac/lXd1zZXv/pudrKfG83bLu6oVTPcMYvMEGOl+0+YUTp/+q8xlWBaSfIUkYLFh5MdXKDjVFO8r1GfpeGGK9XmkAWNFzVbv6gNv7IH5cRoEucc9tPcCpgArLZXhFRQHhlQIiK8nEytaCdlTM9TVXIFdHkPPvc7Z39C4T4Q08uv0A9dNap/OcPfE8KO0mSCgCgAkXIPSp+oVKciByfn6rihdFFYEQtaoN5yfr48v/VIpKWzuXdq5RjZfe/ZD+y9ltX/1yOhcJlrNcR4sl5HGy9GysYA5BpSCFrhSoS4UGOz6FrehK7EqlgMhxNfWaQwauN2VunOGiBEBcR03W1vSl50gqKtMYRFqIVMl/5ovvolL8/Ene0azilWLpuXkMtiQ+BSHMFjf6cO4ll3rOyzV26TkaFIpUL6++kIQSaH2TDLxZxatKW0TZujJJPbLRitOicfQWiT3/ZlqdDYCwUPnXzYWfvvTjxqbUodibqEovgWWX2giU++SKTlW/lLazQFpaEoLHC8bQS2F7rySKltmuYaktIlwSzzMY9VfK3wdcRDyddd/p1cmuTG9ld9GqdRcTQMPrRW8qGudkI3DXLv2zKk7fU/YguleuE6LzIMcih8Z1SJ1Alqw49zNKdGyI03f5Uzq+BSCcT1ed141FqeJV5pBgarb/E2AAscDCqBSmRtoAAAAASUVORK5CYII="; var At = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyBpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNSBXaW5kb3dzIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjlCNTUxMDJDMzRENzExRURBN0MxOTI5QUU5MUExOTQ5IiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjlCNTUxMDJEMzRENzExRURBN0MxOTI5QUU5MUExOTQ5Ij4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6OUI1NTEwMkEzNEQ3MTFFREE3QzE5MjlBRTkxQTE5NDkiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6OUI1NTEwMkIzNEQ3MTFFREE3QzE5MjlBRTkxQTE5NDkiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz69vdT5AAANmElEQVR42qxbb4gdVxW/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"; var bt = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyBpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNSBXaW5kb3dzIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjlDQkQ0MzJCMzRENzExRURCQkFFQTREMTUxMzc4ODMwIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjlDQkQ0MzJDMzRENzExRURCQkFFQTREMTUxMzc4ODMwIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6OUNCRDQzMjkzNEQ3MTFFREJCQUVBNEQxNTEzNzg4MzAiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6OUNCRDQzMkEzNEQ3MTFFREJCQUVBNEQxNTEzNzg4MzAiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz69LeAdAAAKiElEQVR42sxbW4scRRSu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"; var ft = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyBpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNSBXaW5kb3dzIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjlBMDRCRDgwMzRENzExRURCQ0JGQkU4RjkxNTU1MDM0IiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjlBMDRCRDgxMzRENzExRURCQ0JGQkU4RjkxNTU1MDM0Ij4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6OUEwNEJEN0UzNEQ3MTFFREJDQkZCRThGOTE1NTUwMzQiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6OUEwNEJEN0YzNEQ3MTFFREJDQkZCRThGOTE1NTUwMzQiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz6rEQeOAAAO70lEQVR42qxbf4xcRR2f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"; var St = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyBpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNSBXaW5kb3dzIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjlFMkQ3OTkwMzRENzExRURCNDBEOTk1M0U1RUQ3MTU1IiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjlFMkQ3OTkxMzRENzExRURCNDBEOTk1M0U1RUQ3MTU1Ij4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6OUUyRDc5OEUzNEQ3MTFFREI0MEQ5OTUzRTVFRDcxNTUiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6OUUyRDc5OEYzNEQ3MTFFREI0MEQ5OTUzRTVFRDcxNTUiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4cE+YzAAAPW0lEQVR42tRbe3BVxRnf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"; var yt = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyBpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNSBXaW5kb3dzIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjlENzFBMEUwMzRENzExRUQ4NzA5RDRDQzYxNDA4QjUyIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjlENzFBMEUxMzRENzExRUQ4NzA5RDRDQzYxNDA4QjUyIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6OUQ3MUEwREUzNEQ3MTFFRDg3MDlENENDNjE0MDhCNTIiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6OUQ3MUEwREYzNEQ3MTFFRDg3MDlENENDNjE0MDhCNTIiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz6iNPAIAAAW90lEQVR42qRbC3RU5Z3/3TvPzCMJCQQjREPAUD0IigvKnlq27VZpw8sggo8Wa61KFx+13e2e6jkp56x7utvaUqTHR5GHiyxYCBgIWD0HRLsVQY08BE2AgAEGAhOSmcx75t79/t/cb/LNzZ1J3P3OuXPnvr//+/kpi//jQR1QALBdbj/8kf/E4OcVY68XPGP1zYH5DFzVh/j2V5uxeNZOp2755SIoysAtg1BBKFKGmLLxkNUzMsh0n65I7zC9VMzDEjDpZcrgU9lj0z26TF5l4Dqd++i5TYQAZeCD7Gfb3f+MyrFlCJ7ty/s2nTPGE2xbaXGdnzeuV7Kt3AKEXrYFxSNDkKqcfeNJ8V3xPXa83Dhusrg2aN7m0bjlN3nHKoda1RlV9BzwVoAbL14skEDnje0PYlLG9UMGkB8YAJ+UtqD06qCxHZf+y1uv8d4/0Ca+Z0L4chNxlov/heBoZjASrLqS5TEuAnSw/a5fFMSa8TEaAWObYlBaHgR41zdW/bLzvWX/3iXdX238r2Jb91cQ1qDp2Pw98S5CQrkBYLkMrIwEmUu2Nf4L5m//Ty4LWRFQdUsWMmPRGF0GUFWm83SumgFfY9yDAhPG//NaQPqeLFqQuBDS/EjUmgaJh6JxmbfTj2AHC+CfKCCrAQsEmEeNPOHl+xPPbIzenbv4xbd2rDGuEbKmW3CMGWCZAMVGlcGNglPz4KL/BJtuEF0lQ6PbdDPLLzbJs0zlGoky8jassQRv1dF+4p45D0nvM1M1MARiBZcdYNtOY55i6zaudRn/gyTCg8TBQIBdlzhAuilgYvdB1DAAEJQsRP3cIOoT8Osx6xTtN6TnHBkC0GKj2oJT5PlNH4pLNUXnXoadG2VVG8QihQChccPbjU8du6N5jUBEASTkxkP1P60/fuCK35b0eMvdZaNscY+3zFd61YwDD/66+h69he6JpMMViUycf9hlc/d57f6e5tPrNxdCKhOph9xpPbI+el/uHJvTChNSZc6cyeDal+MAmwadgW1XtHwRMDR+dRHMH7ClnP3iQwz458TFm5sfvOcp34vL6P++Zb98mPbX+Ooust3FtsSHM2J2D/uws3rXrYvhpHepGQQ7bDOywuhgZLHxv3F2fsz1/h8zxH2bjg/+PvAN8Y2MI+lb4tkIBnjEBDgnjHxsoVOWk//ALR8jusKIzxFAHGBQ/Q9FCCkUFh7xrsPjcOddXP927D34XnxvjffpnfzE2jhjRK3hJI4ikuxFXzKE/ngfLvadR6ifHBA7QrazKM2MhYY0EvYuuNI1/LzmO4dIvP5PXrcf4xkiyip9YxuTW2r1RCTkyCCxtvuxgzZXvPRIw6YmeQ4M8J/R/sbWxctN17oMDspZA1KCBDs3g5qqW5kTFNO+hO1f4PVGcdz5r6vn0P6bwMt7PzzaEovG0NUWRiqR4oA+oJ1jXOeBOzUGVT118NhvRbd6BFXajUweUzhp34Lx6buZbrKjI7YFn8X3wuFREY1O/ZNnmgdv7r+3FYyBQhdjp3/oeX3a2uj9BxnSO/MU7B0lnFMY8K2SHpC5d7lAAmxZn9yuZEgENCtHw2xWILD7Cslpwn1+BZauonPz/u2Wv9B+78FDLbH+JM60X2F8bMfE8CMMIAfOqh/jaDKN77k2olSrQ1S5TLBw4GmctG/HOft+7pddl7qbIWIe+qInoEXZtVAP4DuOupvqG7yfVrSWji6pRdh6osSFAgkWvkKVYdG446Qp2pPEASoXgSwCVhaxvTngaf9zx9oQ7Zm8gya094Vjj7a88mHLhA824fIH/Rh/4UfwRetwWfmcP3e1Phkh9RQ2pG/ETPdvEXZ24Jy6GsdL/4ijpSvQ498L1XuJ7z9y/xqfuJ7P6pTETzEp/ARKLk3F6fZORG7qaeDyW+ItL8Smdx995L1CDq3k0zxJROcioGgqlwdJ+3ebMNctA/+gc+vkFeGlf6X/TN5rG9P/fV3Q7qyPhyJIpVNIZuLo09/FyPhouB3Xo9OxDUHb58h4ujAqVIMtjDO/796PXbbvwg8HlJoM48Sbs3pwJNB+4hCisTBsTE224feozHyNi8bJS0Bf8BK08nADUxntnBMiwzKZVSZz2MR1AEeAaiDApgnnB6abu4V2Z7vQA/7Xv74uueCwXbbvpY313T1nkUjEmVi58IDtE7htZ7A7cT8uZv6MyyP2w+bJoK7vZrZ38GfeVxe2LmGIa7bfy1iB6Y3Hb3hZvG+v2581i/EwTnQcQzxcCiVs40i4mNmM7yjbsL5sTv1S2xsdnY+vnjPu1w/vsOCCzVsmvfINC/YfCJttQgmyHy0rAnKwUik9QN7W7VzxhO//qwBeyP3O9//acP5IB8bGpsGhe/Fu+nb0qp2Y634ezczCTXQw6pan4O+vaG0UQJMrHov0hqKx0/T/zWc/vpP2nKpw5O6bctutDaRTTh1fB+8lF5xlfmzvmwdN78XqynkN7heO4c3+pXfKgI0Hlpk0f8CECCL0Ju4KEweoWk4JrpQUYVBCxvQ0MzkpG1ziLWTrO7F6Dik9YllHpA41yo/Z+9K4iM2IquewxT4d99n24/3EwlacNeIPCei1uJ9r8zzSGcqNafh3Skej9pvTpsyl4x3tB1pCJUHMj+7Cu9o/oS/RCb2WAXAsi7QF4dWjjOcOnmxPrhpf71xmIQY5jiZu19sym7gSREblTkEx+092Xx5k60nxEZuSvDp0Dz9/xr4THb53YWOc7nOUYpSSbqfzZLpokxEoJmzeytTQQfGMYG9f0tfqLy+F7ojjinoCFZiH0ycucD9Dfs8ghOaH6odkhOgsCFAyggPsmtkFll3I6heT9/mY93f4x8YHtuLhS7gt1dB+9BC0mAMerYpJUporO7fHjpKRToy4UNHajHtB1CFqm2ckkGAxVsnXCQl7vU8/uiSys51kP57qwUn1z+hNMc5WxzD9MellumdFf9Yk02DyP24ozcg9QYYAFflK0DKyE64lYXmr/+FLJKMkm87QBFSn7kR9ai467Ju4pr925EQsWjhrLik2mepWQFoNBsgg5Ij3OFQXYpUZjE8txFWJqYiFMjkn7CfjdtTS/Mg0D+HNGkowg6wfkFZlT7CQH1BNrqWYWPPfL6onZ+eG8E+Y47IQ7Y5duOjYx16aQIndB0E580sFmxKQhQZ9Q6amPNwxZ2vthKtwoewvuCY2D4GuEMjr/PDoqZYN0Xu4Pthx9ZPLiniywptdya0AcQD96PaMbC+rCgVDzMsax00WC1ZC6S+YzLfyrEpUPQ+1JIVxlZMw966vz/2qsW0hgPOyzkyB8vg9pqCiOo7YuL0Y7fMidSmFvtN9SI1LNMjmtECIPl1Eg5rBAdlosLgStPQMU0oEfbaTyKSTSCgheEr8RalvonIe0GaWF1xgpSccna7WOxigqX6H0+FLJf8PuYQqinj1M9pKNSMcIbtuzsEFJDsq9vjV1Bcm8RtOB7inlkYKba7fIeP9EjdMmA7y1ck6kG2WNb2snel4CCVYUEkKXUB+Q6Hnj179JKR5W3mFxAFcBMCtQJrMYMYMvJl1+MsIuPDYnoYzl7+ALXIN89WfziIASVDoSspxXXD+OyYgVjFqHhymBcCIwx/l/l+Z/HeD9If4b8VB/NlZ/yXPu9qUbqsUtQX9QqaJu8JkBTS7ZkX5vAwMc4d/htHZ//F0BGV6KTMhDvaCrHsbPhsGeW8/9KyeJiZoTGzZEJrZEnD5WIiE4B6Zowy/gZBMYd4y2QQWy1aR98v9ALIChicIiwQCj/spA8QmEVqDp7NyyFxej3Y1U39E+xiXfzOlxGSHA7hMaRkZYk/XBZVlRJhHU92rq9CI51ng9rCRFyiUqisnmNWsI5RDgDlqqiYMZuwpLFF3fG1FaOmeUi/V9mzwZMbzmJ3ieN0TQP2EmzH79qz2F379VxkytYdCkowImUPoHkKAlA2qscgJiPgmqNuEI5TJIUDEy98SwIs09hp1Vldb47rnZTND2eQ+2wluDUj+h6P9hxpmTuAUteAK2paf+hFHBO3FNfo/8drSHxihe5eFJRNOXncOAcQG2mARqBLAUxpbJD6/7D81WlcY2zvP4oT9DfSpX/J01lex50PdR0gQG1GW7QchgRBDm0CCeRAHiPxFgaCoakAHsB/YtGFTiUTApo1EXequbBJR+4DH7mQhmCeW9f0Nl9TKlhey72bq57nGDAmy9ygAl58xi5EkBgFLx05Wghl3Ku8aY//ZD2lv1azX5hz5IhsH5NiJOCClBnDasQM1sXq4k2H07A/BVuFtuC/U3E6hrHHrMrPPXwj4YnqANHtTHWR5hzh+ypeL/QdZjqHKaMQBtoQjKwJ61gyWG1tQs6VLGPCfS/n1gSjqSwdPbZUkI7yyspDFAI3aPnw3vhsi2VGA3VcNxfLF9AJRnTbiBGEGzaJU6B2W0aBdEgHJFeb+dsfM3c+aH3jh3fhyd9trFZ/55mFx8kOmAh3w2g9jfeqbyDiuoNp9LdzRfCdHCmxWWUV5Zo4oBABR/cpk4UssLWpqLULhGpOXyzNfPBxOi2DIxj3BD4xmhUNWk3gl8iAo4iI2d7s92KLPwKbUDOYS2xkf2JCpj/DcnqgPmJAwpOtbRFmuwkCayxKJpnxgp5UjZ1aCOT8giwBdvliwYEkKbqv/4Y54SbJeDfWhypYtZHSl/sT1wO72thZ31NXKSDAsc1gs6JHGMnPxpfSFY7Vb8UjPkpKNd26zL/6CkqO5u187ssNE/WqrZK9miADnAMMVXmn4AVPMWrPlt+/zCkwuL6joOF9+mKfAYumP4NLLsUB7H3dGd+ZNdDgxvonSuWNxv/k5iv2VqfaGmKLOei2zeEL6Gr3h7Z1tLbQNkRqX6wNVYFyvCgQY1eHlFr0AfMz9+e3jKC9IKXEKeNyTVV62onCYxiL739Cc+B42xG9B3JNoKKQIrZBAyBFiYugKkRLLU3ai5hi82IvzH9mBS1fBn5wLxTUKZTUVPEweZjosmE2JUULElucINVkVEygW4OUwpgN4Nog0/X5Ha/2EKUh4TiGsZstzxAV6SkEqk+Q+gZiwDFAxJ8ikPLn9N4fSlP3p6uhFeU8levxBxK5/D7b2K2/P2rO63eSJdplMYLc51yk5QjarYEj4A88wU/iYVHvrpGoMsfjeg4caiAsSSi92Je/HIufrSOAKMn39cLldDfuwoJUjoT9bzOzTSnmlewilByNldlAOrh6s3P6dZtzbQQVXKra6HDeh1/ESxl51DfSzDO0i3e7LKkGJC7pMLTg5JORc4WxxVBd9NDKmupkL/JiQf7kSSxQWXNBV0Y6I0o3dDAl7EsvQwizFxth0hF1hLgo0+WGkrQsqyWyxBIhNijSc/TyGTEJBm+v3SPvPMFtePCFkWARrP4AjQDE4INsfQDrgetN905n8C3PSmWNfRlVOFecilDuqMVL5B3Q7TmGUfgPzpCbguPIqtD4mamUYqONJhY/hDHqGa/cXjmHD1O/VX/gsjfrgI/zaZ94/YpSPkZsRYRiA11hUuvdldUCOAyxFoNtKkREVc5Q8oLbW1o9C24iV6HK8z02iE6UYkZ6IVDyNXoYEXjg1FCNVdTlgJishA01pd0IuHe9+ta2FKsKdJ05AC/kRT2ddXZtdRYndmzPNQ+QezC191bIIGJ4g5ce4G9xrKovlfIKEL3T1Y9qOMbm8XpQmjNoSnxO6/xxCqeP40j4O16ZnozJehX61H3PT2/FaeBrUeAAVt5U2NLupTS5Vz35etkICNVcQ0FfiJQg7wvW9PUEEDp9EGXtHVWwsup0aot4NqByt4AdndpHiu65MDb1TKM1m6AK5WYpMYDeJe8W1AgGaEQ1m8KRhCrsLBRQxO/ybQvfvydUHsw7Iyywa5DXCi5c/xZjMPyKmXEKZVgevVg1vuhZnHB0MkDaeO6DsEd3PcwjUE0T5SKM3iFpppkRasSZyKxap2/BG4ju4KjYJ1fpC9CnvoDbzXXSPOI/Kbt9bzBplRJLUnHIrYAorDU83wItAqr4pmxHK5KXFmzDQaSm3owWoMQlxP+cE0RpDZocoSdkgZvNaTujHcC7wKhK2KOba3sDuxOPwMkf5lsR8nMhs4/WDRCSEz6Jt2caJ3sm4UH4cJelxvE9ofvp/sCdyB880wuHEyMxN6LEdxjllHYIjA1D8aTTMmnZvSVUswk2eb6DSJDzKIfyAKqHnNPJ+eXk8k60Myb20Vv11a5ILvUvUtxyuUGmuNYY+SBMhc+dFRetEz7SG9MgUvh3ejU3JmXCpJzDathBdyscYn57PYwbKI57J7OT6Yow+C67L2+DXanmG6W9qNWps9yCRasM2qLjLvYIRJ4Wt2tdRl6rFnMab73b4Yklz5qlYpck0xosOEXL+cjlBqVd4ZgH3MVsM8fSfktuozFYBIXCHZOOIRfUjmEMU6r2IT92/QUwN4kLsbeYslfJkKiGDEMDFylnCKH0zb5I6Zz+AMIvQxmMBu/IptmAG/K5SfF/fi322Ba1UCLFKuxVxteWu1vFyL2TZ10SHiBEOG2ZQ5NHlgMhgmXTJBsbKzxpemjk9vTaYTYSQJmdhcYebwobrUg2UPo9m3KBaQl+6HVHdy45Pw66XMF5IIWY7haB2hInNlyzG6MVl5z7mXAUwuqoELmcp/GcrWivTyeuGk3OUGqSsEiFCwVfyuoCqN/HCCDK5bvEmo0T+hEkRktKr7pi5+890cHq/Ohv96JCrPHldoZHfzRYBEXOY+DkfcwhKxvoa5LTaQIZpMj/WlVF5abc5jTPmCqdL9vQKDdJNFpQXJjBvAQc1S/on6VBFkxT1zUod1RQVzpQezhOFzaF7I8ca173BGyMLFFD5n08eP7o+EptNrElc4Qn494p76n/g33hybXy+3DKTM4WP3/AyJV/HvPqrR52Xzp5+s3/paXgwqsB3JECbVxgtvJsLiHGvjAROdEZ85bmRW/WjT7eiP9guLi0uoAM4V1CPbtNtrueG0UyZK6xw5yXbXiuSlbzrzJ5wh8x1Q2rHEcfiOp0nCh8z5SdNlLZaRwCJA3LUJ0Xvq6zHjc/PHnCEJA7YZFKGeSPb87/D/KGAAOqBsnU+amCW84lUWNmABR/J7asidS2LEXWhyd9Ku+B8SZvzOQaAH84ISAiZgvz1DrlWWd8oXtwwHCElr1madvusOIGyxcU6wwmoNXsWvrTEvqNuPYsk6RxVllRnuD+jJUmCa1hwlROdubg9hxBCBuUb5PdRY7TcoTLMIYfC1SZHKEdoXdF4PiDbLI2B5TJSr5C5X7BKAt68DkgcV1MRhYCnoorDGb5CJ1cnF16xDSRXSFN3iSjTlMe3MmPVkj6Sv3WgQLqrUAxwPH9FmTLQJygwY0KC3DZnlim5jB4wTRACCUjm9RltlhHFEFGsjl8ICPn/bBN7V0pme4/pXNPg5XSGJ6hqA8sOrdbWFMiqBMyupXmSJlER9wULhKm58Nsky1UYvGYpiKHXHArENZmJm1/lEitGZDTmr61ZaT5ncEXVMCZRZUEd+Zkp0t4qFT+lyDdE5FroXA7ZMvBmJAx0izN5uGbqLTnKm+KCvHPGpGjlaJNYfSEDaiBtZZGJlyN/VWmlQbEpyG/UskxmWiDFah5NsFjdKo4FrFkdoA8sVL6WXTjzyceF06lZLDaZRKXJQBb3ICUsr5RXdGLwUtrxFtxSaQI4aDGHJsNtb5KBMpbZPiG41gpwGfjsQmemCH9rf0unRcTDWfdtvlrsyvBWdlutWucL+Yyj4qvaB75kNc9iM8heu+WZxSwmYffQn7x7FVlRCJ8dg1Zv51aDGyfypmJacQ6xilvJV8Tmb+VOKfm3iFXguRXq0qrzQXMBrFeZ6yacsvG/AgwA8McvkpPxRroAAAAASUVORK5CYII="; var ta = { viscosity: pt, drought: mt, deflation: ht, extinction: At, illiteracy: bt, recession: ft, dilation: St, hyperchallenge: yt }, fe = { viscosity: { label: "Viscosity" }, drought: { label: "Drought" }, deflation: { label: "Deflation" }, extinction: { label: "Extinction" }, illiteracy: { label: "Illiteracy" }, recession: { label: "Recession" }, dilation: { label: "Dilation" }, hyperchallenge: { label: "Hyperchallenged" } }; async function vt(s, e) {
        let t = "hs-autosing-corruption-modal", a = Object.keys(fe).map(i => `
        <div class="hs-corruption-item">
            <img src="${ta[i]}" class="hs-corruption-icon" alt="${fe[i].label}" />
            <div class="hs-corruption-label">${fe[i].label}</div>
            <input 
                type="number" 
                id="hs-corruption-${i}" 
                class="hs-corruption-input"
                min="0" 
                max="16" 
                value="${e[i] ?? 0}"
            />
        </div>
    `).join(""), n = {
            htmlContent: `
            <div id="${t}" class="hs-corruption-modal-container">
                <div class="hs-corruption-grid">
                    ${a}
                </div>
                <div class="hs-corruption-footer">
                    <div class="hs-corruption-done-btn" id="hs-corruption-save-btn">
                        Done
                    </div>
                </div>
            </div>
        `, title: "Configure Corruption Loadout"
        }, o = await s.Modal(n); setTimeout(() => { document.getElementById("hs-corruption-save-btn")?.addEventListener("click", () => { Object.keys(fe).forEach(i => { let r = document.getElementById(`hs-corruption-${i}`), l = Math.max(0, Math.min(16, Number(r?.value) || 0)); e[i] = l }), S.removeInjectedStyle("hs-corruption-modal-styles"), s.CloseModal(o) }) }, 0)
    } async function Mt(s, e, t, a) {
        let n = "hs-autosing-challenges-modal", o = [...e], i = k => ie.find(I => I.value === k)?.label ?? null, r = k => k.challengeNumber === 200 && k.ifJump !== void 0, l = k => `${k.toLocaleString()}ms`, u = (k, I) => `
    <div class="hs-challenge-item hs-if-block"
        data-index="${I}"
        data-if-index="${I}"
        data-if-id="${k.ifJump.id}">
        <div class="hs-challenge-drag-handle">\u22EE\u22EE</div>
        
        <div class="hs-if-content">
            <strong>IF</strong>
            challenge ${k.ifJump.ifJumpChallenge}
            ${k.ifJump.ifJumpOperator}
            ${k.ifJump.ifJumpValue}
        </div>

        <div style="flex-grow: 1;"></div>

        <div class="hs-challenge-btn hs-challenge-btn-edit" id="hs-challenge-edit-${I}" data-index="${I}">\u270E</div>
        <div class="hs-challenge-btn hs-challenge-btn-delete" id="hs-challenge-delete-${I}" data-index="${I}">\xD7</div>
    </div>
    `, d = (k, I) => `
        <div class="hs-challenge-item hs-if-target"
            data-jump-for="${k}"
            data-if-id="${I}">
            <div class="hs-challenge-drag-handle">\u22EE\u22EE</div>
            \u21B3 Jump here (IF)
        </div>
    `, g = (k, I) => {
            let R = i(k.challengeNumber), B = !!R, H = B ? `<strong>${R}</strong>` : `Challenge ${k.challengeNumber}
     (${k.challengeCompletions} completions)`; return `
        <div class="hs-challenge-item" data-index="${I}">
            <div class="hs-challenge-drag-handle">\u22EE\u22EE</div>
            <div class="hs-challenge-item-text">
                ${H}
                <div class="hs-challenge-meta">
                    Wait outside: ${l(k.challengeWaitAfter ?? 0)} |
                    Wait inside: ${l(k.challengeWaitTime)}
                    ${B ? "" : ` | Max: ${l(k.challengeMaxTime ?? -1)}`}
                </div>
            </div>
            <div class="hs-challenge-btn hs-challenge-btn-edit" id="hs-challenge-edit-${I}" data-index="${I}">\u270E</div>
            <div class="hs-challenge-btn hs-challenge-btn-delete" id="hs-challenge-delete-${I}" data-index="${I}">\xD7</div>
        </div>
        `}, m = () => { let k = [], I = new Map; o.forEach((B, H) => { if (r(B)) { let G = B.ifJump.ifJumpIndex; I.has(G) || I.set(G, []), I.get(G).push({ ifIndex: H, ifId: B.ifJump.id }) } }), o.forEach((B, H) => { I.has(H) && I.get(H).forEach(G => { let Z = o[G.ifIndex]; k.push(d(G.ifIndex, Z.ifJump.id)) }), r(B) ? k.push(u(B, H)) : k.push(g(B, H)) }); let R = o.length; return I.has(R) && I.get(R).forEach(B => { let H = o[B.ifIndex]; k.push(d(B.ifIndex, H.ifJump.id)) }), k.join("") }, h = () => { let k = document.getElementById("hs-challenge-list-container"); k && (k.innerHTML = m(), F(), Q()) }, A = {
            htmlContent: `
    <div id="${n}" class="hs-challenges-modal-container">
        <div class="hs-challenges-input-section">
            <div class="hs-challenges-input-row" style="grid-column: 1 / -1; grid-template-columns: 120px 1fr;">
            <div class="hs-challenges-input-label">Special Action:</div>
                <select id="hs-challenge-action-select" class="hs-challenges-input">
                    <option value="">None (Standard Challenge)</option>
                    ${ie.map(k => `<option value="${k.value}">${k.label}</option>`).join("")}
                </select>
            </div>
            <div class="hs-challenges-input-row">
                <div class="hs-challenges-input-label">Challenge #:</div>
                <input type="number" id="hs-challenge-num-input" class="hs-challenges-input" min="1" max="15" value="1" />
            </div>
            <div class="hs-challenges-input-row">
                <div class="hs-challenges-input-label">Min Completions:</div>
                <input type="number" id="hs-challenge-completions-input" class="hs-challenges-input" min="1" value="1" />
            </div>
            <div class="hs-challenges-input-row">
                <div class="hs-challenges-input-label">Wait inside (ms):</div>
                <input type="number" id="hs-challenge-wait-inside-input" class="hs-challenges-input" min="0" value="0" />
            </div>
            <div class="hs-challenges-input-row">
                <div class="hs-challenges-input-label">Max Time (ms):</div>
                <input type="number" id="hs-challenge-max-time-input" class="hs-challenges-input" min="100" value="10000" />
            </div>
            <div class="hs-challenges-input-row">
                <div class="hs-challenges-input-label">Wait outside (ms):</div>
                <input type="number" id="hs-challenge-wait-outside-input" class="hs-challenges-input" min="0" value="0" />
            </div>
            <div class="hs-challenges-input-row hs-if-jump-row" style="display:none;">
                <div class="hs-challenges-input-label">If Challenge</div>
                    <input type="number"
                        id="hs-if-jump-challenge"
                        class="hs-challenges-input"
                        min="1"
                        max="15"
                        value="1" />
                    </div>

                <div class="hs-challenges-input-row hs-if-jump-row" style="display:none;">
                    <div class="hs-challenges-input-label">Condition</div>
                    <select id="hs-if-jump-operator" class="hs-challenges-input">
                        <option value=">">&gt;</option>
                        <option value="<">&lt;</option>
                    </select>
                </div>

                <div class="hs-challenges-input-row hs-if-jump-row" style="display:none;">
                    <div class="hs-challenges-input-label">Value</div>
                    <input type="number"
                        id="hs-if-jump-value"
                        class="hs-challenges-input"
                        value="1" />
                </div>
            </div>
            <div class="hs-challenges-add-btn" id="hs-challenge-add-btn">Add Action/Challenge</div>

        <div class="hs-challenges-list-container">
            <div id="hs-challenge-list-container">
                ${m()}
            </div>
        </div>

        <div class="hs-challenges-footer">
            <div class="hs-challenges-footer-btn hs-challenges-cancel-btn" id="hs-challenges-cancel-btn">Cancel</div>
            <div class="hs-challenges-footer-btn hs-challenges-save-btn" id="hs-challenges-save-btn">Save Strategy</div>
        </div>
    </div>`, title: `Configure Strategy Actions (${t}-${a})`
        }, M = await s.Modal(A), E = null, f = null, v = null, w = null, U = !1, P = null, V = (k, I) => { let R; return function (...B) { R || (k.apply(this, B), R = !0, setTimeout(() => R = !1, I)) } }, Q = () => { document.querySelectorAll(".hs-challenge-item").forEach(k => { let I = k, R = I.dataset.ifId; R && (I.addEventListener("mouseenter", () => { document.querySelectorAll(`[data-if-id="${R}"]`).forEach(B => B.classList.add("hs-jump-highlight")) }), I.addEventListener("mouseleave", () => { document.querySelectorAll(`[data-if-id="${R}"]`).forEach(B => B.classList.remove("hs-jump-highlight")) })) }) }, O = k => { let I = document.getElementById("hs-challenge-list-container"); return I ? Array.from(I.querySelectorAll(".hs-challenge-item")).indexOf(k) : 0 }, J = k => { let I = document.getElementById("hs-challenge-list-container"); if (!I) return 0; let R = Array.from(I.querySelectorAll(".hs-challenge-item")), B = 0; for (let H = 0; H <= k && H < R.length; H++)if (!R[H].dataset.jumpFor) { if (H === k) return B; B++ } return Math.min(B, o.length) }, F = () => { document.querySelectorAll(".hs-challenge-item").forEach(I => { let R = I.querySelector(".hs-challenge-drag-handle"); R.addEventListener("mousedown", B => { B.preventDefault(); let H = I; if (U = H.dataset.jumpFor !== void 0, U) P = Number(H.dataset.jumpFor), v = null; else if (H.dataset.index !== void 0) v = Number(H.dataset.index), P = null; else return; f = H; let G = H.getBoundingClientRect(), Z = B.clientX - G.left, $ = B.clientY - G.top; w = H.cloneNode(!0), w.style.opacity = "0.3", w.style.pointerEvents = "none"; let j = H.getBoundingClientRect().width, Nt = H.getBoundingClientRect().height; H.style.position = "fixed", H.style.zIndex = "1000", H.style.cursor = "grabbing", H.style.pointerEvents = "none", H.style.width = j + "px", H.style.height = Nt + "px", H.style.boxSizing = "border-box", H.style.boxShadow = "0 8px 16px rgba(0,0,0,0.3)", H.style.transform = "scale(1.03)", H.style.transition = "transform 0.15s ease", H.parentNode?.insertBefore(w, H); let de = (W, ge) => { f && (f.style.left = W - Z + "px", f.style.top = ge - $ + "px") }; de(B.clientX, B.clientY); let $e = V(W => { let ge = document.getElementById("hs-challenge-list-container"); if (ge && (de(W.clientX, W.clientY), f)) { f.style.display = "none"; let tt = document.elementFromPoint(W.clientX, W.clientY); if (f.style.display = "", !tt) return; let te = tt.closest(".hs-challenge-item"), Pt = ge.getBoundingClientRect(), at = W.clientY > Pt.bottom - 5; if (te && te !== f && te !== w || at) { let nt = O(te), Ut = O(f); if (nt === Ut) return; if (U && P !== null) { let T = at ? o.length : J(nt), pe = o[P]; if (r(pe)) { pe.ifJump.ifJumpIndex = T; let X = document.getElementById("hs-challenge-list-container"); if (X) { let Ke = X.scrollTop; X.innerHTML = m(), X.scrollTop = Ke; let N = document.querySelector(`[data-jump-for="${P}"]`); N && (f = N, w = N.cloneNode(!0), w.style.opacity = "0.3", w.style.pointerEvents = "none", N.style.position = "fixed", N.style.zIndex = "1000", N.style.cursor = "grabbing", N.style.pointerEvents = "none", N.style.width = N.offsetWidth + "px", N.style.boxShadow = "0 8px 16px rgba(0,0,0,0.3)", N.style.transform = "scale(1.03)", N.parentNode?.insertBefore(w, N), de(W.clientX, W.clientY)), F(), Q() } } } else if (v !== null && te.dataset.index !== void 0) { let T = Number(te.dataset.index); if (T !== v) { let pe = o[v]; o.splice(v, 1), o.splice(T, 0, pe), v = T; let X = document.getElementById("hs-challenge-list-container"); if (X) { let Ke = X.scrollTop; X.innerHTML = m(), X.scrollTop = Ke; let N = document.querySelector(`[data-index="${v}"]`); N && !N.dataset.jumpFor && (f = N, w = N.cloneNode(!0), w.style.opacity = "0.3", w.style.pointerEvents = "none", N.style.position = "fixed", N.style.zIndex = "1000", N.style.cursor = "grabbing", N.style.pointerEvents = "none", N.style.width = N.offsetWidth + "px", N.style.boxShadow = "0 8px 16px rgba(0,0,0,0.3)", N.style.transform = "scale(1.03)", N.parentNode?.insertBefore(w, N), de(W.clientX, W.clientY)), F(), Q() } } } } } }, 16), et = () => { f && (f.style.position = "", f.style.zIndex = "", f.style.cursor = "", f.style.pointerEvents = "", f.style.width = "", f.style.boxShadow = "", f.style.transform = "", f.style.left = "", f.style.top = "", f.style.transition = ""), w && w.parentNode && w.parentNode.removeChild(w), f = null, v = null, U = !1, P = null, w = null, document.removeEventListener("mousemove", $e), document.removeEventListener("mouseup", et), Y() }; document.addEventListener("mousemove", $e), document.addEventListener("mouseup", et) }), R.style.cursor = "grab" }) }, z = () => { let k = document.getElementById("hs-challenge-action-select"), I = !!k?.value, R = Number(k.value) === 200;["hs-challenge-num-input", "hs-challenge-completions-input", "hs-challenge-max-time-input"].forEach(H => { let G = document.getElementById(H); G && (G.disabled = I, G.parentElement.style.opacity = I ? "0.4" : "1", G.parentElement.style.display = R ? "none" : "") }), document.querySelectorAll(".hs-if-jump-row").forEach(H => { H.style.display = R ? "" : "none" }) }, Y = () => { document.getElementById("hs-challenge-num-input").value = "1", document.getElementById("hs-challenge-completions-input").value = "0", document.getElementById("hs-challenge-wait-inside-input").value = "0", document.getElementById("hs-challenge-wait-outside-input").value = "0", document.getElementById("hs-challenge-max-time-input").value = "1000000", document.getElementById("hs-challenge-action-select").value = "", document.getElementById("hs-challenge-add-btn").textContent = "Add Action/Challenge", E = null, z() }; setTimeout(() => { let k = document.getElementById(n), I = document.getElementById("hs-challenge-action-select"); I?.addEventListener("change", z), F(), Q(), k?.addEventListener("click", R => { let B = R.target, H = B.id; if (H === "hs-challenge-add-btn") { let G = !!I.value, Z = Number(I.value) === 200, $; if (Z) { let j = E !== null ? o[E] : null; $ = { challengeNumber: 200, challengeCompletions: 0, challengeWaitTime: 0, challengeMaxTime: 0, ifJump: { id: p.uuidv4(), ifJumpChallenge: Number(document.getElementById("hs-if-jump-challenge").value), ifJumpOperator: document.getElementById("hs-if-jump-operator").value, ifJumpValue: Number(document.getElementById("hs-if-jump-value").value), ifJumpIndex: j?.ifJump?.ifJumpIndex ?? o.length + 1 } } } else $ = { challengeNumber: Number(G ? I.value : document.getElementById("hs-challenge-num-input").value), challengeCompletions: G ? 0 : Number(document.getElementById("hs-challenge-completions-input").value), challengeWaitTime: Number(document.getElementById("hs-challenge-wait-inside-input").value), challengeWaitAfter: Number(document.getElementById("hs-challenge-wait-outside-input").value), challengeMaxTime: G ? 0 : Number(document.getElementById("hs-challenge-max-time-input").value) }; E !== null ? o[E] = $ : o.push($), h(), Y() } if (H.startsWith("hs-challenge-edit-")) { E = Number(B.dataset.index); let G = o[E], Z = i(G.challengeNumber); if (r(G)) { I.value = String(200), document.getElementById("hs-if-jump-challenge").value = String(G.ifJump?.ifJumpChallenge), document.getElementById("hs-if-jump-operator").value = G.ifJump?.ifJumpOperator ?? ">", document.getElementById("hs-if-jump-value").value = String(G.ifJump?.ifJumpValue), document.getElementById("hs-challenge-wait-inside-input").value = String(G.challengeWaitTime), document.getElementById("hs-challenge-wait-outside-input").value = String(G.challengeWaitAfter ?? 0), document.getElementById("hs-challenge-add-btn").textContent = "Update Action", z(); return } Z ? I.value = String(G.challengeNumber) : (I.value = "", document.getElementById("hs-challenge-num-input").value = String(G.challengeNumber), document.getElementById("hs-challenge-completions-input").value = String(G.challengeCompletions), document.getElementById("hs-challenge-max-time-input").value = String(G.challengeMaxTime)), document.getElementById("hs-challenge-wait-inside-input").value = String(G.challengeWaitTime), document.getElementById("hs-challenge-wait-outside-input").value = String(G.challengeWaitAfter ?? 0), document.getElementById("hs-challenge-add-btn").textContent = "Update Action", z() } H.startsWith("hs-challenge-delete-") && (o.splice(Number(B.dataset.index), 1), h(), Y()), H === "hs-challenges-save-btn" && (e.length = 0, e.push(...o), s.CloseModal(M)), H === "hs-challenges-cancel-btn" && s.CloseModal(M) }) }, 0)
    } async function qe(s, e, t, a, n) {
        let o = !!n, i = e.length ? e[e.length - 1].endPhase : "start", r = n?.corruptions || { viscosity: 0, drought: 0, deflation: 0, extinction: 0, illiteracy: 0, recession: 0, dilation: 0, hyperchallenge: 0 }, l = n?.strat || [], u = q.indexOf(i), g = q.slice(u + 1).map((A, M) => `<option value="${A}" ${n?.endPhase === A || M === 0 ? "selected" : ""}>${A}</option>`).join(""), m = {
            htmlContent: `
        <div class="hs-phase-modal-container">
            <div class="hs-phase-select-group">
                <label class="hs-phase-label">Starting Phase</label>
                <select class="hs-phase-select" disabled>
                    <option selected>
                        ${n?.startPhase ?? i}
                    </option>
                </select>
            </div>

            <div class="hs-phase-select-group">
                <label class="hs-phase-label">Ending Phase</label>
                <select
                    id="hs-autosing-end-phase"
                    class="hs-phase-select"
                >
                    ${g}
                </select>
            </div>

            <div class="hs-phase-config-group">
                <div class="hs-phase-config-btn" id="hs-autosing-phase-corruptions">
                    Configure Corruptions
                </div>
                <div class="hs-phase-config-btn" id="hs-autosing-phase-challenges">
                    Configure Challenges
                </div>
            </div>

            <div class="hs-phase-footer">
                <div class="hs-phase-done-btn" id="hs-autosing-phase-done">
                    ${o ? "Save" : "Create Phase"}
                </div>
                <div class="hs-phase-error" id="hs-phase-error" style="display:none;"></div>
            </div>
        </div>
        `, title: o ? `Edit Strategy Phase ${n.startPhase}-${n.endPhase}` : "Create Strategy Phase"
        }, h = await s.Modal(m); setTimeout(() => { let A = document.querySelector(".hs-phase-modal-container"); A && A.addEventListener("click", async M => { let E = M.target; if (E.id === "hs-autosing-phase-done") { let v = document.getElementById("hs-autosing-end-phase")?.value; if (!v) return; let w = { startPhase: n ? n.startPhase : i, endPhase: v, corruptions: { ...r }, strat: [...l] }; o && a ? a(w) : t(w), S.removeInjectedStyle("hs-phase-modal-styles"), s.CloseModal(h) } E.id === "hs-autosing-phase-corruptions" && await vt(s, r), E.id === "hs-autosing-phase-challenges" && await Mt(s, l, n?.startPhase ?? "error", n?.endPhase ?? "error") }) }, 0)
    } var ne = class {
        static async open(e, t) {
            let a = D.getModule("HSUI"); if (!a || !a.uiReady) return; let n = !!e, o = e ? { strategyName: e.strategyName, strategy: JSON.parse(JSON.stringify(e.strategy)) } : { strategyName: "", strategy: [] }, i = () => { for (let d = 1; d < o.strategy.length; d++) { let g = o.strategy[d - 1], m = o.strategy[d]; m.startPhase = g.endPhase } }, r = () => {
                let d = document.getElementById("hs-autosing-phase-list"); if (d) {
                    if (o.strategy.length === 0) { d.innerHTML = '<div class="hs-strategy-empty-state">No strategy phases added yet.</div>'; return } d.innerHTML = o.strategy.map((g, m) => `
                    <div class="hs-strategy-phase-item">
                        <div class="hs-strategy-phase-text">
                            Phase ${m + 1}: ${g.startPhase} <span class="hs-strategy-phase-arrow">\u2192</span> <strong>${g.endPhase}</strong>
                        </div>
                        <div class="hs-strategy-btn hs-strategy-btn-icon hs-strategy-btn-edit" data-phase-index="${m}" data-action="edit">
                            \u270E
                        </div>
                        <div class="hs-strategy-btn hs-strategy-btn-icon hs-strategy-btn-delete" data-phase-index="${m}" data-action="delete">
                            \xD7
                        </div>
                    </div>
                `).join("")
                }
            }, l = {
                htmlContent: `
                <div class="hs-strategy-modal-container" id="hs-strategy-modal-root">
                    <div class="hs-strategy-input-section">
                        <div class="hs-strategy-input-label">Strategy Name</div>
                        <input 
                            type="text" 
                            id="hs-autosing-strategy-name" 
                            class="hs-strategy-name-input"
                            placeholder="Enter strategy name..."
                            value="${o.strategyName}"
                        />
                    </div>

                    <div class="hs-strategy-input-section">
                        <div class="hs-strategy-input-label">Strategy Phases</div>
                        <div id="hs-autosing-phase-list" class="hs-strategy-phase-list">
                            <div class="hs-strategy-empty-state">No strategy phases added yet.</div>
                        </div>
                    </div>

                    <div class="hs-strategy-error" id="hs-strategy-error" style="display: none; color: #ef5350; padding: 10px; background: rgba(239, 83, 80, 0.1); border: 1px solid #ef5350; border-radius: 3px; margin-top: 10px;"></div>

                    <div class="hs-strategy-btn-group">
                        <div class="hs-strategy-btn hs-strategy-btn-secondary" id="hs-autosing-add-phase-btn">
                            + Add Phase
                        </div>
                        <div class="hs-strategy-btn hs-strategy-btn-primary" id="hs-autosing-create-btn">
                            ${n ? "Update Strategy" : "Create Strategy"}
                        </div>
                    </div>
                </div>
            `, title: n ? "Edit Autosing Strategy" : "Create Autosing Strategy"
            }, u = await a.Modal(l); setTimeout(() => { let d = document.querySelector(".hs-strategy-modal-container"); d && (r(), d.addEventListener("click", async g => { let m = g.target, h = m.dataset.action, A = m.dataset.phaseIndex; if (m.id === "hs-autosing-add-phase-btn") await qe(a, o.strategy, M => { o.strategy.push(M), i(), r() }); else if (m.id === "hs-autosing-create-btn") { let M = document.getElementById("hs-strategy-error"), E = document.getElementById("hs-autosing-strategy-name"); o.strategyName = E?.value || "Unnamed Strategy"; try { n ? (C.saveStrategiesToStorage(o, e.strategyName), S.Notify(`Strategy "${o.strategyName}" updated`, { notificationType: "success" })) : (C.saveStrategiesToStorage(o), S.Notify(`Strategy "${o.strategyName}" created`, { notificationType: "success" })), a.CloseModal(u) } catch (f) { M && (M.textContent = f.message, M.style.display = "block") } } else if (h === "edit" && A !== void 0) { let M = parseInt(A), E = o.strategy[M]; await qe(a, o.strategy.slice(0, M), () => { }, f => { o.strategy[M] = f, i(), r() }, E) } else if (h === "delete" && A !== void 0) { let M = parseInt(A); o.strategy.splice(M, 1), i(), r() } })) }, 0)
        }
    }; var Se = class { #e = { syncNotificationOpacity: async e => { let t = document.querySelector("#notification"), a = e.contextName ?? "HSSettings"; if (e.disable && e.disable === !0) t.style.removeProperty("opacity"); else { let n = e.value; t && n && n >= 0 && n <= 1 && (t.style.opacity = n.toString()) } }, logTimestamp: async e => { e.disable && e.disable === !0 ? c.setTimestampDisplay(!1) : c.setTimestampDisplay(!0) }, reactiveMouseHover: async e => { let t = e.contextName ?? "HSSettings"; e.disable && e.disable === !0 && ee.clearInterval("hover") }, autoClick: async e => { let t = e.contextName ?? "HSSettings"; e.disable && e.disable === !0 && ee.clearInterval("click") }, ambrosiaQuickBarAction: async e => { let t = e.contextName ?? "HSSettings", a = D.getModule("HSAmbrosia"); a && (e.disable && e.disable === !0 ? await a.destroyQuickBar() : await a.createQuickBar()) }, ambrosiaMinibarAction: async e => { let t = e.contextName ?? "HSSettings", a = D.getModule("HSAmbrosia"); a && (e.disable && e.disable === !0 ? await a.disableBerryMinibars() : await a.enableBerryMinibars()) }, patch: async e => { let t = e.contextName ?? "HSSettings"; if (!e.patchConfig || !e.patchConfig.patchName) { c.error("No patch config provided for setting action", t); return } let a = D.getModule("HSPatches"); a && (e.disable && e.disable === !0 ? (console.log("Disabling patch", e.patchConfig.patchName, t), await a.revertPatch(e.patchConfig.patchName)) : (console.log("Enabling patch", e.patchConfig.patchName, t), await a.applyPatch(e.patchConfig.patchName))) }, useGameData: async e => { let t = e.contextName ?? "HSSettings", a = D.getModule("HSGameData"); a && (e.disable && e.disable === !0 ? a.disableGDS() : a.enableGDS()) }, autoLoadout: async e => { let t = e.contextName ?? "HSSettings", a = D.getModule("HSAmbrosia"); a && (e.disable && e.disable === !0 ? await a.disableAutoLoadout() : await a.enableAutoLoadout()) }, ambrosiaIdleSwapAction: async e => { let t = e.contextName ?? "HSSettings", a = D.getModule("HSAmbrosia"); a && (e.disable && e.disable === !0 ? await a.disableIdleSwap() : await a.enableIdleSwap()) }, startAutosingAction: async e => { let t = e.contextName ?? "HSSettings", a = D.getModule("HSAutosing"); a && (e.disable && e.disable === !0 ? await a.disableAutoSing() : await a.enableAutoSing()) }, createAutosingStrategy: async e => { let t = e.contextName ?? "HSSettings"; await ne.open() }, editAutosingStrategy: async e => { let t = e.contextName ?? "HSSettings"; await C.editSelectedStrategy() }, deleteAutosingStrategy: async e => { let t = e.contextName ?? "HSSettings"; await C.deleteSelectedStrategy() }, exportAutosingStrategy: async e => { let t = e.contextName ?? "HSSettings"; await C.exportSelectedStrategy() }, importAutosingStrategy: async e => { let t = e.contextName ?? "HSSettings"; await C.importStrategy() } }; constructor() { } getAction(e) { let t = this; return e in this.#e ? a => { t.#e[e](a) } : null } }; var _ = class { constructor(e, t, a, n) { this.context = "HSSetting"; this.definition = e, this.settingAction = t, this.#e = a, this.#t = n, this.definition.defaultValue = this.definition.settingValue } #e; #t; getDefinition() { return this.definition } setDefinition(e) { this.definition = e } enable() { this.#a(!0) } disable() { this.#a(!1) } async handleToggle(e) { let t = !this.definition.enabled, a = this.definition.enabled !== t, n = C.getSetting("useGameData"); if (!b.HSSettings.gameDataCheckBlacklist.includes(this.definition.settingName) && n && this.definition.usesGameData && a && t && !n.isEnabled()) { c.warn(`Enable GDS before enabling ${this.definition.settingDescription}!`); return } if (this.definition.settingName === "useGameData" && a && !t) { let i = C.getSettings(); for (let [r, l] of Object.entries(i)) { let u = l.getDefinition(); b.HSSettings.gameDataCheckBlacklist.includes(r) || "usesGameData" in u && u.usesGameData === !0 && l.isEnabled() && l.definition.settingName !== "startAutosing" && l.disable() } } if (c.log(`${this.definition.settingName}: ${this.definition.enabled} -> ${!this.definition.enabled}`, this.context), !a) return; this.definition.enabled = t, this.definition.settingType === "boolean" && (this.definition.settingValue = t, this.definition.calculatedSettingValue = t); let o = e.target; t ? (o.innerText = this.#e, o.classList.remove("hs-disabled")) : (o.innerText = this.#t, o.classList.add("hs-disabled")), this.handleSettingAction("state", t) } #a(e) { let t = this.definition.enabled !== e; if (!t) return; if (this.definition.settingName === "useGameData" && t && !e) { let n = C.getSettings(); for (let [o, i] of Object.entries(n)) { let r = i.getDefinition(); b.HSSettings.gameDataCheckBlacklist.includes(o) || "usesGameData" in r && r.usesGameData === !0 && i.isEnabled() && i.definition.settingName !== "startAutosing" && i.disable() } } c.log(`${this.definition.settingName}: ${this.definition.enabled} -> ${e}`, this.context), this.definition.enabled = e; let a = document.querySelector(`#${this.definition.settingControl?.controlEnabledId}`); e && a ? (a.innerText = this.#e, a.classList.remove("hs-disabled")) : (a.innerText = this.#t, a.classList.add("hs-disabled")), this.handleSettingAction("state", e), C.saveSettingsToStorage() } async initialAction(e, t) { await this.handleSettingAction(e, t) } async handleSettingAction(e, t) { if (this.settingAction) { let a = this.settingAction, n = { contextName: this.context, value: this.definition.calculatedSettingValue ?? null }; this.definition.patchConfig && this.definition.patchConfig.patchName && (n.patchConfig = this.definition.patchConfig), a && a instanceof Function && (e === "state" ? t ? await a({ ...n, disable: !1 }) : await a({ ...n, disable: !0 }) : await a({ ...n, disable: !1 })) } } hasControls() { return "settingControl" in this.definition } isEnabled() { return this.definition.enabled } getCalculatedValue() { return this.definition.calculatedSettingValue } toString() { return JSON.stringify(this.definition) } }, ye = class extends _ { constructor(e, t, a, n) { super(e, t, a, n), this.definition.enabled = !0, this.definition.settingValue = null, this.definition.calculatedSettingValue = null } getValue() { return null } setValue(e) { } async handleChange(e) { c.log(`Button pressed: ${this.definition.settingName}`, this.context), await this.handleSettingAction("value") } async initialAction(e, t) { } enable() { } disable() { } }, ve = class extends _ { constructor(e, t, a, n) { super(e, t, a, n), this.definition.settingValueMultiplier && (this.definition.calculatedSettingValue = this.definition.settingValue * this.definition.settingValueMultiplier) } getValue() { return this.definition.settingValue } setValue(e) { return this.definition.settingValue = e } async handleChange(e) { let t = parseFloat(e.target.value); c.log(`${this.definition.settingName}: ${this.definition.settingValue} -> ${t}`, this.context), this.definition.settingValue = t, this.definition.calculatedSettingValue = t * this.definition.settingValueMultiplier, await super.handleSettingAction("value") } }, Me = class extends _ { constructor(e, t, a, n) { super(e, t, a, n) } getValue() { return this.definition.settingValue } setValue(e) { return this.definition.settingValue = e } async handleChange(e) { let t = e.target.value; c.log(`${this.definition.settingName}: ${this.definition.settingValue} -> ${t}`, this.context), this.definition.settingValue = t, this.definition.calculatedSettingValue = t, await super.handleSettingAction("value") } }, we = class extends _ { constructor(e, t, a, n) { super(e, t, a, n) } getValue() { return this.definition.enabled } setValue(e) { this.definition.settingValue = e, this.definition.calculatedSettingValue = e, this.definition.enabled = e } async handleChange(e) { } }, Ee = class extends _ { constructor(e, t, a, n) { super(e, t, a, n), this.definition.settingValueMultiplier && (this.definition.calculatedSettingValue = this.definition.settingValue * this.definition.settingValueMultiplier) } getValue() { return this.definition.settingValue } setValue(e) { } async handleChange(e) { let t = parseFloat(e.target.value); c.log(`${this.definition.settingName}: ${this.definition.settingValue} -> ${t}`, this.context), this.definition.settingValue = t, this.definition.calculatedSettingValue = t * this.definition.settingValueMultiplier, await super.handleSettingAction("value") } }, Ce = class extends _ { constructor(e, t, a, n) { super(e, t, a, n) } getValue() { return this.definition.settingValue } setValue(e) { } async handleChange(e) { let t = e.target.value; c.log(`${this.definition.settingName}: ${this.definition.settingValue} -> ${t}`, this.context), this.definition.settingValue = t, this.definition.calculatedSettingValue = t, await super.handleSettingAction("value") } }, Ie = class extends _ { constructor(e, t, a, n) { super(e, t, a, n) } getValue() { return p.removeColorTags(this.definition.settingValue) } getDisplayValue() { return p.parseColorTags(this.definition.settingValue) } setValue(e) { this.definition.settingValue = e, this.definition.calculatedSettingValue = e; let t = document.querySelector(`#${this.definition.settingControl?.controlId}`); t && (t.innerHTML = this.getDisplayValue()), C.saveSettingsToStorage() } async handleChange(e) { } }; var wt = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAE7mlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgOS4xLWMwMDIgNzkuYTZhNjM5NiwgMjAyNC8wMy8xMi0wNzo0ODoyMyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIDI1LjkgKFdpbmRvd3MpIiB4bXA6Q3JlYXRlRGF0ZT0iMjAyNS0wNS0wOVQxMzowODowNyswMzowMCIgeG1wOk1vZGlmeURhdGU9IjIwMjUtMDUtMDlUMTM6MDg6NDUrMDM6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMjUtMDUtMDlUMTM6MDg6NDUrMDM6MDAiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjA2N2JkMWIxLTJmMGMtMjk0Ni04ZTJmLTk5MGUyZmU2ZDgyNSIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDowNjdiZDFiMS0yZjBjLTI5NDYtOGUyZi05OTBlMmZlNmQ4MjUiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDowNjdiZDFiMS0yZjBjLTI5NDYtOGUyZi05OTBlMmZlNmQ4MjUiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjA2N2JkMWIxLTJmMGMtMjk0Ni04ZTJmLTk5MGUyZmU2ZDgyNSIgc3RFdnQ6d2hlbj0iMjAyNS0wNS0wOVQxMzowODowNyswMzowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDI1LjkgKFdpbmRvd3MpIi8+IDwvcmRmOlNlcT4gPC94bXBNTTpIaXN0b3J5PiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PiGXppUAAANKSURBVFiF7Zc/TBNRHMe/j1YcLqj1KglaQtKhroYm0BMcJY2pLKYknZycMQYHBhNddOngTNXBxDSxi0AnTaiEwgMSOjhJxYYK0Zi0aYQ0hkL7c7jr9d7d0SNqxIGXvPTev+/383733r1XRkQ4ztRxrO4nAP8DgNtcwRgTyraL9EWD8F17zqjtyz9WEFq5qg6+2yA87WBH0iMiIVvS+zU1N/s/rxMA28wHFonG1XYarxNdP7DImf2Y2bRcZHqF3EeMZbNY3w8DAAJbO8Ruu1Shx3UhAuydGEw+sIjQ2UGGty6LprGf5RXwlEc1C9YAMCr1aoNeNnRzPrCI9CmvKjSizQwHZIYoJ9yEIlAuSMivdQIAIhOin2URqsbA0vQeeMqDckECEgnBvBSNMPO49MgFJoR8dQjlggSe8mBpek/Qbgsg+6tQohV4fV06CLa29Pbe1SGLiABhKDeNvb4uKNEKZH/VGQAAk/uIKdEKAsGaCrKxoTf6AETuV2y/30q0Qvk5CRzAx3E3vL4uBII11Vx995bI2X4HykV1B8n+qm3YGIDI+i2KKGEdRIlWqPmujebarJmmadWy2QX6QjQKBxKjYMmkRYCyMQBAvjaD/FonStu7gjlPeZhBC3Kf6GddA6YO3p8TTPZXkb8zA3plM4PhJNhwEoHOUUSUsGA+eFEMuVnbFsCSTn+BtzGmQvRIthBGkIgS1mf+eXvMUd4ZwLULuHbBUx4dgj9CW5BP3wxj/xjAvYPZ18sAoEOcvyYh/dUDzgG7r7eiAN7hCsG98zcAxFk0IQLBGkpZD9Lxw0HMY23l7SqFreeq4ty9N9Q9f0NfUOWCxGR/lQJaWe4BGIMyOQn+5IlapyiAK/OBAkHJfv81k/l0MueF+jwBoIX6PJU2gWbu3gNKmyAto7QJAAi5Mq3T0ZUBOek7HsfP9qd0QXcVlg5X9sXyw9oDAcBpwo5rYJta58CBBJghzpgC7GO9TpLticwpliPr5WPW/i4/VSRx9nHu7HdkgDhvGrcgZoliOTUbzZuAdnq/DaD9AnF+6JWsXXQOA7DdhqbEYjmiZL9+u2SIc8LlkAp4qdUxObcM3GzdQmM5QrK//S60nIb/Oh37/4ITgGMH+AVvvVIGwD6zyAAAAABJRU5ErkJggg=="; var C = class s extends L {
        static #e = ""; static #t = {}; static #a; static #r; static #i = !1; static #n = !1; static #o = "\u2713"; static #s = "\u2717"; static #l = []; #u; constructor(e) { super(e), s.#e = this.context, this.#u = new Se, c.log("Parsing mod settings", this.context); try { c.log("Parsing control groups", this.context), s.#a = JSON.parse(st) } catch (t) { c.error(`Error parsing control groups ${t}`, this.context), s.#i = !1 } try { c.log("Parsing control pages", this.context), s.#r = JSON.parse(lt) } catch (t) { c.error(`Error parsing control pages ${t}`, this.context), s.#i = !1 } try { c.log("Parsing settings.json", this.context); let t = this.#c(), a; "useGameData" in t ? a = t.useGameData.enabled : a = !1; for (let [n, o] of Object.typedEntries(t)) { (o.settingType === "boolean" || p.isBoolean(o.settingValue)) && (o.settingValue = !1), o.usesGameData && o.enabled && !a && (b.HSSettings.gameDataCheckBlacklist.includes(n) || (c.info(`Disabled ${o.settingDescription} on load because GDS is not on`, this.context), o.enabled = !1)), this.#d(o, s.#a); let i = "settingAction" in o ? o.settingAction : void 0, r = i ? this.#u.getAction(i) : null; if (o.settingType === "numeric") "settingValueMultiplier" in o || (o.settingValueMultiplier = 1), s.#t[n] = new ve(o, r, s.#o, s.#s); else if (o.settingType === "string") s.#t[n] = new Me(o, r, s.#o, s.#s); else if (o.settingType === "boolean") s.#t[n] = new we(o, r, s.#o, s.#s); else if (o.settingType === "selectnumeric") "settingValueMultiplier" in o || (o.settingValueMultiplier = 1), s.#t[n] = new Ee(o, r, s.#o, s.#s); else if (o.settingType === "selectstring") s.#t[n] = new Ce(o, r, s.#o, s.#s); else if (o.settingType === "state") s.#t[n] = new Ie(o, r, s.#o, s.#s); else if (o.settingType === "button") s.#t[n] = new ye(o, r, s.#o, s.#s); else throw new Error(`Could not parse setting ${n.toString()} (settingType: ${o.settingType}, settingValue: ${o.settingValue})`) } s.saveSettingsToStorage(), s.#i = !0 } catch (t) { c.error(`Error parsing mod settings ${t}`, this.context), s.#i = !1 } } async init() { this.#h(s.#l), this.isInitialized = !0 } static async syncSettings() { if (c.log("Syncing mod settings", s.#e), !s.#i) { c.error("Could not sync settings - settings not parsed yet", s.#e); return } for (let [e, t] of Object.typedEntries(s.#t)) { c.debug(`Syncing ${e} settings`, s.#e); let a = t.getDefinition(), n = t.hasControls() ? a.settingControl : void 0; if (n) { let o = n.controlType, i = n.controlOptions; if (o === "text" || o === "number") { let r = document.querySelector(`#${n.controlId}`); r && (o === "number" && i ? ("min" in i && r.setAttribute("min", i.min.toString()), "max" in i && r.setAttribute("max", i.max.toString()), "step" in i && r.setAttribute("step", i.step.toString())) : o === "text" && i && "placeholder" in i && r.setAttribute("placeholder", i.placeholder), r.value = p.asString(a.settingValue), r.addEventListener("change", async l => { await this.#S(l, t) })) } else if (o === "select") { let r = p.asString(a.settingValue), l = document.querySelector(`#${n.controlId}`); l && (Array.from(l.options).some(d => d.value === r) ? l.value = r : (l.value = "", c.warn(`Setting value ${r} does not exist in select options for setting ${e}`, s.#e)), l.addEventListener("change", async d => { await this.#S(d, t) })) } else if (o === "state") { let r = p.parseColorTags(p.asString(a.settingValue)), l = document.querySelector(`#${n.controlId}`); l && (l.innerHTML = r) } else if (o === "button") { let r = document.querySelector(`#${n.controlId}`); r && r.addEventListener("click", async l => { await this.#S(l, t) }) } if (n.controlEnabledId) { let r = document.querySelector(`#${n.controlEnabledId}`); r && (a.enabled ? (r.innerText = s.#o, r.classList.remove("hs-disabled")) : (r.innerText = s.#s, r.classList.add("hs-disabled")), r.addEventListener("click", async l => { await this.#A(l, t) })) } await t.initialAction("state", a.enabled) } } c.log("Finished syncing mod settings", s.#e), this.#n = !0 } static autoBuildSettingsUI() { let e = this; if (!s.#i) return c.error("Could not sync settings - settings not parsed yet", s.#e), { didBuild: !1, navHTML: "", pagesHTML: "" }; let t = [], a = !0, n = Object.entries(s.#t).sort((g, m) => { let h = g[1].getDefinition().settingControl?.controlGroup, A = m[1].getDefinition().settingControl?.controlGroup; return h && A ? (s.#a[h].order || 0) - (s.#a[A].order || 0) : h ? -1 : A ? 1 : 0 }), o = Object.entries(s.#r).sort((g, m) => { let h = g[1].order, A = m[1].order; return h && A ? (h || 0) - (A || 0) : h ? -1 : A ? 1 : 0 }), i = []; for (let [g, m] of o) n.some(A => A[1].getDefinition().settingControl?.controlPage === g) && i.push(x.Div({ class: "hs-panel-subtab", id: `hs-panel-settings-subtab-${g}`, data: new Map([["subtab", g], ["color", m.pageColor || ""]]), styles: { border: m.pageColor ? `1px solid ${m.pageColor}` : "1px solid gray" }, html: m.pageName })); let r = x.Div({ class: "hs-panel-subtabs", html: i }), l = new Map, u = null; for (let [g, m] of n) { let h = m.getDefinition(), A = h.settingControl, M = h.settingBlockId || void 0, E = ""; if (h.usesGameData && (E = x.Image({ class: "hs-panel-setting-block-gamedata-icon", src: wt, width: 18, height: 18, props: { title: b.HSSettings.gameDataRequiredTooltip } })), A) { let f = l.get(A.controlPage) || [], v = []; if (!u || u !== A.controlGroup) { u = A.controlGroup; let w = s.#a[u]; f.push(x.Div({ html: w.groupName, styles: { borderBottom: "1px solid limegreen", gridColumn: "span 2", marginBottom: "15px" } })) } if (A.controlType === "switch") v = [x.Div({ class: "hs-panel-setting-block-text-wrapper", styles: { display: "flex", flexDirection: "row", alignItems: "center" }, html: [x.P({ class: "hs-panel-setting-block-text", props: { title: h.settingHelpText }, text: h.settingDescription, styles: { margin: "0" } }), E] })], A.controlEnabledId && v.push(x.Button({ class: "hs-panel-setting-block-btn hs-panel-settings-block-btn-standalone", id: A.controlEnabledId, text: "" })); else if (A.controlType === "button") v = [x.Button({ id: A.controlId, text: h.settingDescription || "Error: No button text" })]; else { let w = null; switch (A.controlType) { case "text": w = 4; break; case "number": w = 3; break; case "select": w = 5; break; case "state": w = 6; break; default: w = null }if (w) { if (v = [x.Div({ class: "hs-panel-setting-block-text-wrapper", styles: { display: "flex", flexDirection: "row", alignItems: "center" }, html: [x.P({ class: "hs-panel-setting-block-text", props: { title: h.settingHelpText }, text: h.settingDescription, styles: { margin: "0" } }), E] })], w === 3 || w === 4) v.push(x.Input({ class: "hs-panel-setting-block-num-input", id: A.controlId, type: w })); else if (w === 5) if (A.selectOptions) v.push(x.Select({ class: "hs-panel-setting-block-select-input", id: A.controlId, type: w }, A.selectOptions)); else { c.error(`Error autobuilding settings UI, ${h.settingName} does not have selectOptions defined`, e.#e), a = !1; break } else w === 6 && v.push(x.P({ class: "hs-panel-setting-block-state", id: A.controlId, text: "" })); A.controlEnabledId && v.push(x.Button({ class: "hs-panel-setting-block-btn", id: A.controlEnabledId, text: "" })) } else { c.error("Error autobuilding settings UI, control type resolution failed (how??)", e.#e), a = !1; break } } f.push(x.Div({ id: M, class: "hs-panel-setting-block", html: v })), l.set(A.controlPage, f) } else { c.error(`Error autobuilding settings UI, controls not defined for setting ${g}`, e.#e), a = !1; break } } for (let [g, m] of l.entries()) l.set(g, [x.Div({ class: "hs-panel-settings-grid", id: `settings-grid-${g}`, html: m })]); let d = []; for (let [g, m] of l.entries()) d.push(m.join("")); return { didBuild: a, navHTML: r, pagesHTML: d.join("") } } static validateStrategy(e) { if (!e) throw new Error("Strategy is undefined"); if (!("strategyName" in e)) throw new Error("Strategy is missing strategyName property"); if (!("strategy" in e)) throw new Error("Strategy is missing strategy property"); if (!Array.isArray(e.strategy)) throw new Error("Strategy.strategy must be an array"); let t = e.strategy; if (t.length === 0) throw new Error("Strategy has no components"); let a = [...q]; for (let n = 0; n < t.length; n++) { let o = t[n], { startPhase: i, endPhase: r, corruptions: l, strat: u } = o; if (!l) throw new Error(`Component ${n + 1} (${i} \u2192 ${r}) has no corruptions defined`); if (!Array.isArray(u) || u.length === 0) throw new Error(`Component ${n + 1} (${i} \u2192 ${r}) must have at least one challenge`); if (a[0] !== i) throw new Error(`Component ${n + 1} must start at "${a[0]}", got "${i}"`); let d = a.indexOf(r); if (d === -1) throw new Error(`Component ${n + 1} ends at "${r}", which is not valid or already consumed`); a = a.slice(d) } if (a.length > 1) throw new Error(`Uncovered phases: ${a.join(", ")}`) } #d(e, t) { if (!e) throw new Error("Setting is undefined (wtf)"); let a = ["text", "number", "switch", "select", "state", "button"], n = ["numeric", "string", "boolean", "selectnumeric", "selectstring", "state", "button"]; if (!("settingName" in e)) throw new Error("Setting is missing settingName property"); let o = e.settingName; if (!("enabled" in e)) throw new Error(`Setting '${o}' is missing enabled property`); if (!("settingDescription" in e)) throw new Error(`Setting '${o}' is missing settingDescription property`); if (!("settingValue" in e)) throw new Error(`Setting '${o}' is missing settingValue property`); if (!("settingType" in e)) throw new Error(`Setting '${o}' is missing settingType property`); if (!n.includes(e.settingType)) throw new Error(`Setting '${o}' has invalid settingType property`); let i = e.settingType; if (i === "numeric") { if (!p.isNumeric(e.settingValue)) throw new Error(`Setting '${o}' has invalid settingValue property for settingType ${i}`) } else if (i === "string") { if (!p.isString(e.settingValue)) throw new Error(`Setting '${o}' has invalid settingValue property for settingType ${i}`) } else if (i === "boolean") { if (!p.isBoolean(e.settingValue)) throw new Error(`Setting '${o}' has invalid settingValue property for settingType ${i}`) } else if (i === "selectnumeric") { if (!p.isString(e.settingValue) && !p.isNumeric(e.settingValue)) throw new Error(`Setting '${o}' has invalid settingValue property for settingType ${i}`) } else if (i === "selectstring" && !p.isString(e.settingValue) && !p.isNumeric(e.settingValue)) throw new Error(`Setting '${o}' has invalid settingValue property for settingType ${i}`); if ("settingControl" in e && e.settingControl) { let r = e.settingControl; if (r.controlType !== "switch" && !("controlId" in r)) throw new Error(`Setting '${o}' has settingControl defined and it is not type'switch', but it is missing controlId property`); if (!("controlType" in r)) throw new Error(`Setting '${o}' has settingControl defined, but it is missing controlType property`); if (!("controlGroup" in r)) throw new Error(`Setting '${o}' has settingControl defined, but it is missing controlGroup property`); if (!a.includes(r.controlType)) throw new Error(`Setting '${o}' has invalid controlType property`); if (!(r.controlGroup in t)) throw new Error(`Setting '${o}' has invalid controlGroup property`) } } static getSetting(e) { return this.#t[e] } static getSettings() { return this.#t } static getStrategies() { return this.#l } static #m() { let e = {}; for (let [t, a] of Object.typedEntries(this.#t)) { let n = { ...a.getDefinition() }, o = b.HSSettings.serializationBlackList; for (let i of o) n[i] && delete n[i]; e[t] = n } return JSON.stringify(e) } static saveStrategiesToStorage(e, t) { let a = D.getModule("HSStorage"); if (!a) throw new Error("Could not find Storage Module"); let n = a.getData(b.HSSettings.strategiesKey); if (Array.isArray(n) || (n = []), !e && t) { let o = n.filter(i => i.strategyName !== t); s.#l = s.#l.filter(i => i.strategyName !== t), a.setData(b.HSSettings.strategiesKey, o), this.#M(t), c.debug("<green>Strategy removed</green>", this.#e); return } if (e) { this.validateStrategy(e); let o = !!t; if (n.some(u => u.strategyName !== e.strategyName ? !1 : o ? u.strategyName !== t : !0)) throw new Error(`Strategy with name "${e.strategyName}" already exists.`); let r = n; o && (r = n.filter(u => u.strategyName !== t), this.#M(t), s.#l = s.#l.filter(u => u.strategyName !== t)), r = r.concat(e), s.#l.push(e); let l = a.setData(b.HSSettings.strategiesKey, r.filter(u => u.strategyName !== "default_strategy")); this.#p(e), l ? c.debug(`<green>Strategy ${o ? "updated" : "saved"} to localStorage</green>`, this.#e) : c.warn("Could not save Strategy to localStorage", this.#e) } } static async deleteSelectedStrategy() { let e = s.getSetting("autosingStrategy"), t = e.getValue(); if (!t || t === "") { S.Notify("Please select a strategy to delete", { notificationType: "warning" }); return } let a = e.getDefinition().settingControl; if (!a?.selectOptions) return; let n = a.selectOptions.find(i => i.value.toString() === t); if (!n) return; let o = n.text; if (o == "default_strategy") { S.Notify("cannot delete default strategy"); return } confirm(`Are you sure you want to delete strategy "${o}"?`) && (s.saveStrategiesToStorage(void 0, o), S.Notify(`Strategy "${o}" deleted`, { notificationType: "success" })) } static async exportSelectedStrategy() { let e = s.getSetting("autosingStrategy"), t = e.getValue(); if (!t || t === "") { S.Notify("Please select a strategy to export", { notificationType: "warning" }); return } let a = e.getDefinition().settingControl; if (!a?.selectOptions) return; let n = a.selectOptions.find(l => l.value.toString() === t); if (!n) return; let o = n.text, r = s.getStrategies().find(l => l.strategyName === o); if (!r) { S.Notify("Strategy not found", { notificationType: "error" }); return } try { let l = JSON.stringify(r, null, 2); await navigator.clipboard.writeText(l), S.Notify(`Strategy "${o}" copied to clipboard`, { notificationType: "success" }) } catch (l) { S.Notify("Failed to copy strategy to clipboard", { notificationType: "error" }), c.log(`Export failed: ${l}`, "HSAutosing") } } static async importStrategy() {
            let e = D.getModule("HSUI"); if (e) {
                let t = await e.Modal({
                    title: "Import Strategy", htmlContent: `
            <div style="display: flex; flex-direction: column; gap: 15px; padding: 10px;">
                <div>
                    <label for="import-strategy-name" style="display: block; margin-bottom: 5px; font-weight: bold;">Strategy Name:</label>
                    <input type="text" id="import-strategy-name" placeholder="Enter strategy name" style="width: 100%; padding: 8px; box-sizing: border-box;" />
                </div>
                <div>
                    <label for="import-strategy-json" style="display: block; margin-bottom: 5px; font-weight: bold;">Strategy JSON:</label>
                    <textarea id="import-strategy-json" placeholder="Paste strategy JSON here" rows="10" style="width: 100%; padding: 8px; box-sizing: border-box; font-family: monospace;"></textarea>
                </div>
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button id="import-strategy-cancel" data-close="modal-will-be-replaced" style="padding: 8px 16px; cursor: pointer;">Cancel</button>
                    <button id="import-strategy-submit" style="padding: 8px 16px; cursor: pointer; background-color: #4CAF50; color: white; border: none;">Import</button>
                </div>
            </div>
        `}), a = document.querySelector(`#${t} #import-strategy-cancel`); a && (a.dataset.close = t); let n = document.querySelector(`#${t} #import-strategy-submit`), o = document.querySelector(`#${t} #import-strategy-name`), i = document.querySelector(`#${t} #import-strategy-json`); if (!n || !o || !i) { S.Notify("Failed to create import modal", { notificationType: "error" }); return } n.addEventListener("click", async () => { let r = o.value.trim(), l = i.value.trim(); if (!r) { S.Notify("Please enter a strategy name", { notificationType: "warning" }); return } if (s.getStrategies().some(g => g.strategyName === r)) { S.Notify(`Strategy "${r}" already exists`, { notificationType: "warning" }); return } let d; try { d = JSON.parse(l) } catch { S.Notify("Invalid JSON format", { notificationType: "error" }); return } this.validateStrategy(d), d.strategyName = r; try { s.saveStrategiesToStorage(d), S.Notify(`Strategy "${r}" imported successfully`, { notificationType: "success" }); let g = document.querySelector(`#${t}`); g && (await g.transition({ opacity: 0 }), g.parentElement?.removeChild(g)) } catch (g) { S.Notify("Failed to save strategy", { notificationType: "error" }), c.log(`Import failed: ${g}`, "HSAutosing") } })
            } else S.Notify("Failed to find HSUI", { notificationType: "error" })
        } static async editSelectedStrategy() { let e = s.getSetting("autosingStrategy"), t = e.getValue(); if (!t || t === "") { S.Notify("Please select a strategy to edit", { notificationType: "warning" }); return } let a = e.getDefinition().settingControl; if (!a?.selectOptions) return; let n = a.selectOptions.find(r => r.value.toString() === t); if (!n) return; let i = s.getStrategies().find(r => r.strategyName === n.text); if (!i) { S.Notify("Cannot edit selected strategy", { notificationType: "error" }); return } if (i.strategyName == "default_strategy") { S.Notify("cannot edit default strategy"); return } await ne.open(i, t) } static saveSettingsToStorage() { let e = D.getModule("HSStorage"); if (e) { let t = this.#m(); e.setData(b.HSSettings.storageKey, t) ? c.debug("<green>Settings saved to localStorage</green>", this.#e) : c.warn("Could not save settings to localStorage", this.#e) } } #g() { let e = JSON.parse(ct); for (let t of e) t && s.validateStrategy(t); return e } #b() { let e = JSON.parse(rt); for (let [t, a] of Object.typedEntries(e)) if (a) { if ((a.settingType === "boolean" || p.isBoolean(a.settingValue)) && (a.settingValue = !1), (a.settingType === "selectnumeric" || a.settingType === "selectstring") && ("settingValue" in a || (a.settingValue = ""), "settingControl" in a && a.settingControl)) { let n = a.settingControl; "selectOptions" in n && n.selectOptions && (n.selectOptions.find(i => i.value === "") || n.selectOptions.unshift({ text: "None", value: "" })) } (a.settingType === "numeric" || a.settingType === "selectnumeric" || p.isNumeric(a.settingValue)) && ("settingValueMultiplier" in a || (a.settingValueMultiplier = 1)), a.settingType === "state" && ("settingValue" in a || (a.settingValue = "<red>null</red>")), this.#d(a, s.#a) } return e } #f() { let e = D.getModule("HSStorage"); if (!e) return c.warn("Could not find HSStorage module", this.context), null; let t = e.getData(b.HSSettings.strategiesKey); return t ? Array.isArray(t) ? t : [t] : null } #v() { let e = D.getModule("HSStorage"); if (e) { let t = e.getData(b.HSSettings.storageKey); return t ? JSON.parse(t) : (c.warn("Could not load settings from localStorage", this.context), null) } else return c.warn("Could not find HSStorage module", this.context), null } #h(e) { for (let t of e) if (t.strategyName === void 0) throw new Error("Strategy name is missing. Cannot add strategy to options."); for (let t of e) s.#p(t) } static #M(e) { let a = this.getSetting("autosingStrategy").getDefinition().settingControl; if (!a?.selectOptions) return; let n = a.selectOptions.findIndex(o => o.text === e); if (n !== -1) { let o = a.selectOptions[n].value; a.selectOptions.splice(n, 1); let i = document.querySelector(`#${a.controlId}`); if (i) { let r = i.querySelector(`option[value="${o}"]`); r && r.remove() } } } static #p(e) { let a = this.getSetting("autosingStrategy").getDefinition().settingControl; if (!a?.selectOptions) return; let n = a.selectOptions.length > 0 ? Math.max(...a.selectOptions.map(i => Number(i.value))) + 1 : 1; a.selectOptions.push({ text: e.strategyName, value: n }); let o = document.querySelector(`#${a.controlId}`); if (o) { let i = document.createElement("option"); i.value = String(n), i.textContent = e.strategyName, o.appendChild(i) } } #c() { let e = this.#b(), t = this.#g(); s.#l.push(...t); try { let a = this.#v(), n = this.#f(); n && s.#l.push(...n); let o = JSON.parse(JSON.stringify(e)); return a ? (c.log("<green>Found settings from localStorage!</green>", this.context), Object.keys(e).forEach(i => { i in a && Object.keys(a[i]).forEach(r => { if (r in e[i]) { let l = a[i][r]; if (l !== null && typeof l == "object" && !Array.isArray(l) && typeof e[i][r] == "object" && !Array.isArray(e[i][r])) { let u = { ...e[i][r] }; Object.keys(l).forEach(d => { d in u && (u[d] = l[d]) }), o[i][r] = u } else o[i][r] = l } }) }), o) : e } catch (a) { return c.error("Error while resolving settings", this.context), console.log(a), e } } static async#S(e, t) { await t.handleChange(e), this.saveSettingsToStorage() } static async#A(e, t) { await t.handleToggle(e), this.saveSettingsToStorage() } static dumpToConsole() { console.log("------------------ HYPERSYNERGISM CURRENT SETTINGS DUMP START ------------------"), this.#t ? console.log(this.#t) : console.log("NO SETTINGS FOUND (wtf)"), console.log("------------------ HYPERSYNERGISM CURRENT SETTINGS DUMP END ------------------") }
    }; var ke = class extends L {
        #e; #t; #a = ["chronos", "hyperrealism", "quark", "challenge", "abyss", "accelerator", "acceleratorBoost", "multiplier"]; #r = []; #i = []; #n = { chronosHepteract: 0, hyperrealismHepteract: 0, quarkHepteract: 0, challengeHepteract: 0, abyssHepteract: 0, acceleratorHepteract: 0, acceleratorBoostHepteract: 0, multiplierHepteract: 0 }; #o = { chronosHepteract: null, hyperrealismHepteract: null, quarkHepteract: 100, challengeHepteract: null, abyssHepteract: null, acceleratorHepteract: null, acceleratorBoostHepteract: null, multiplierHepteract: null }; #s = 0; #l = 0; #u = 0; #d = 0; #m = 0; #g = `
        <div id="hs-ratio-container">
            <div class="hs-ratio" id="hs-ratio-a">CHR/HYP/CHL: 1 / 123 / 123</div>
            <div class="hs-ratio" id="hs-ratio-b">ACC/BST/MLT: 1 / 123 / 123</div>
            <div class="hs-ratio" id="hs-ratio-c">CHR/ACC: 1 / 123</div>
        </div>`; #b = `
        #hs-ratio-container {
            width: 100%;
            display: grid;
            justify-items: center;
            grid-template-columns: repeat(3, 1fr);
            grid-template-rows: 1fr;
            grid-column-gap: 0px;
            grid-row-gap: 0px;
        }`; #f; #v; #h; #M; #p; #c; #S; #A = !1; #y = !1; constructor(e) { super(e), this.#r = this.#a.map(t => `${t}Hepteract`), this.#i = this.#a.map(t => `${t}ProgressBarText`) } async init() {
            let e = this; c.log("Initialising HSHepteracts module", this.context); let t = D.getModule("HSGameState"); t && (t.subscribeGameStateChange("MAIN_VIEW", (a, n) => { a.getId() === 8 && n.getId() !== 8 && t.getCurrentUIView("CUBE_VIEW").getId() === 7 && e.#S && (c.debug("Hepteract forge view closed, stopping watch", this.context), y.stopWatching(e.#S)) }), t.subscribeGameStateChange("CUBE_VIEW", async (a, n) => { n.getId() === 7 ? (c.debug("Hepteract forge view opened, starting watch", this.context), e.#p = await y.HookElement("#hepteractQuantity"), e.#S = y.watchElement(e.#p, o => { try { let i = parseFloat(p.unfuckNumericString(o)); e.#c = i } catch { c.error("Failed to parse owned hepteracts", e.context) } e.#y = !1 }, { greedy: !0, overrideThrottle: !0, valueParser: o => o.querySelector("span")?.innerText })) : a.getId() === 7 && e.#S && (c.debug("Hepteract forge view closed, stopping watch", this.context), y.stopWatching(e.#S)) })), this.#e = await y.HookElement("#heptGrid"), this.#t = await y.HookElement("#hepteractCraftTexts"), this.#e.childNodes.forEach(a => {
                if (a.nodeType === 1) {
                    let n = a, o = n.id; if (e.#r.includes(o)) {
                        let i = document.querySelector(`#${o}CraftMax`), r = document.querySelector(`#${o}Cap`), l = document.querySelector(`#${o}Image`); n.addEventListener("mouseenter", async u => { if (o in e.#o && o === "quarkHepteract") return; let d = document.querySelector("#hepteractCostText"); if (d) { let m = d.innerText.match(/you\s+(.*?)\s+Hepteracts/i); if (m) { let h = m[1]; try { if (o in e.#o) { let A = p.parseFloat2(h); e.#o[o] = A } } catch { c.warn(`Error while parsing hepteract cost for ${o}`, e.context) } } } }), i && r && l && (l.addEventListener("mouseenter", async u => { let m = u.target.id.toLowerCase().includes("quark"); if (e.#c !== null && e.#c !== void 0) { let h = e.#n[o], A = e.#o[o]; if (h === null || A === null) return; let M = C.getSetting("expandCostProtectionDoubleCap"), E = null; if (M.getValue(), E = h * 2 * A, e.#c === 0) e.#E(E, "\u221E", m); else { let f = e.#c > 0 ? E / e.#c : 1; e.#E(E, f, m) } } }), l.addEventListener("click", async u => {
                            let g = u.target.id, m = g.toLowerCase().includes("quark"); if (!g || m) return; if (e.#A || e.#y) { c.debug(`Quick expand cancelled, another expand was still pending (exp ${e.#A}, wtch: ${e.#y})`, e.context); return } e.#A = !0; let h = null, A = null; if (e.#c !== null && e.#c !== void 0) {
                                if (e.#c === 0) { c.info("Owned hepteracts is 0", this.context), e.#A = !1; return } let f = e.#n[o], v = e.#o[o]; (f === null || v === null) && c.warn(`Hepteract cost for ${o} not parsed yet`, e.context); let w = C.getSetting("expandCostProtectionDoubleCap"), U = null; w.getValue(), U = f * 2, h = f * 2 * v, A = e.#c > 0 ? h / e.#c : 1, c.debug(`
                                    Current max: ${f},
                                    Cube cost: ${p.N(v)},
                                    Next hepts: ${p.N(U)},
                                    Buy cost: ${p.N(h)},
                                    Percent owned: ${p.N(A)},
                                    Double Cap: ${w.getValue()}`, this.context); let P = C.getSetting("expandCostProtection"), V = C.getSetting("expandCostProtectionNotifications"), Q = !(V && V.getValue() === !0); if (P.isEnabled()) { let O = P.getCalculatedValue(); if (O && A >= O) { Q && c.info(`Hept. cost protection: Cost owned ${p.N(A * 100)}% >= ${O * 100}%`, this.context), e.#A = !1; return } }
                            } else { c.warn("Owned hepteracts not parsed yet", this.context), e.#y = !1, e.#A = !1; return } let M = await y.HookElement("#toggle35"); if (M && M.innerText.includes("ON") && (c.info("Turned hepteract notification toggle OFF", this.context), M.click()), await p.hiddenAction(async () => { r.click() }, "confirm", !1, 25), await p.wait(25), i.click(), h && A && e.#E(h, A), await p.wait(5), o !== "quarkHepteract") { let f = document.querySelector("#hepteractCostText"); if (f) { let w = f.innerText.match(/you\s+(.*?)\s+Hepteracts/i); if (w) { let U = w[1]; try { if (o in e.#o) { let P = p.parseFloat2(U); e.#o[o] = P } } catch { c.warn(`Error while parsing NEW hepteract cost for ${o}`, e.context) } } } } let E = e.#p ? e.#p : document.querySelector("#hepteractQuantity"); if (E) { let f = E.querySelector("span"); if (f) { let v = f.innerText, w = parseFloat(v); e.#c = w } } e.#A = !1
                        }))
                    }
                }
            }), document.querySelectorAll(".heptTypeImage").length > 0 && S.injectStyle(`
                .heptTypeImage:not(#quarkHepteractImage):not(#hepteractToQuarkImage):not(#overfluxPowderImage) {
                    transform: scale(1);
                    transform-origin: 50% 50%;
                }

                .heptTypeImage:not(#quarkHepteractImage):not(#hepteractToQuarkImage):not(#overfluxPowderImage):hover {
                    transform: scale(1.05);
                    cursor: pointer;
                }

                .heptTypeImage:not(#quarkHepteractImage):not(#hepteractToQuarkImage):not(#overfluxPowderImage):active {
                    transform: scale(0.98);
                }
            `), c.log("Hepteract images now serve as 'quick expand and max' buttons", this.context), c.log("Setting up hepteract ratio watch", this.context), S.injectStyle(this.#b), S.injectHTMLString(this.#g, a => { e.#e?.parentNode?.insertBefore(a, e.#e) }), this.#f = document.querySelector("#hs-ratio-a"), this.#v = document.querySelector("#hs-ratio-b"), this.#h = document.querySelector("#hs-ratio-c"), this.#i.forEach(a => { let n = document.querySelector(`#${a}`), o = a.substring(0, a.indexOf("ProgressBar")) + "Hepteract"; n && o ? y.watchElement(n, i => { o in e.#n ? (e.#n[o] = i, Object.values(e.#n).every(r => r > 0) && (e.#l = Math.round(e.#n.chronosHepteract / e.#n.challengeHepteract), e.#s = Math.round(e.#n.hyperrealismHepteract / e.#n.challengeHepteract), e.#d = Math.round(e.#n.acceleratorHepteract / e.#n.multiplierHepteract), e.#u = Math.round(e.#n.acceleratorBoostHepteract / e.#n.multiplierHepteract), e.#m = Math.round(e.#n.chronosHepteract / e.#n.acceleratorHepteract), this.#f && this.#v && this.#h && (this.#f.innerText = `CHR/HYP/CHL: ${p.N(e.#l, 0)} / ${p.N(e.#s, 0)} / 1`, this.#v.innerText = `ACC/BST/MLT: ${p.N(e.#d, 0)} / ${p.N(e.#u, 0)} / 1`, this.#h.innerText = `CHR/ACC: ${p.N(e.#m, 0)} / 1`))) : c.warn(`Key ${o} not found in #boxCounts`, e.context) }, { valueParser: i => { let r = i.innerText; if (typeof r == "string") { let l = r.split("/"); try { if (l && l[1]) return parseFloat(p.unfuckNumericString(l[1])) } catch { return c.warn(`Parsing failed for ${l}`, e.context), "" } } return "" } }) : c.warn("Invalid meter or boxName", e.context) }), this.isInitialized = !0
        } #w(e) { let t = { cost: 0, percentOwned: 0 }; if (this.#c !== null && this.#c !== void 0) { if (this.#c === 0) { c.info("Owned hepteracts is 0", this.context); return } let a = this.#n[e], n = this.#o[e]; if (a === null || n === null) { c.warn(`Hepteract cost for ${e} not parsed yet`, this.context); return } let o = C.getSetting("expandCostProtectionDoubleCap"), i = null; o.getValue() ? i = a * n : i = a * 2 * n; let r = this.#c > 0 ? i / this.#c : 1; return { cost: i, percentOwned: r } } else { c.warn("Owned hepteracts not parsed yet", this.context); return } } #E(e, t, a = !1) { if (this.#t) { let n = this.#t.querySelector("#hs-costText"), o; if (p.isNumeric(t) ? o = p.N(t * 100) : o = t, n) a ? n.innerText = `[${this.context}]: Total QUARK cost to max after next expand: ${p.N(e)} (ESTIMATE!)` : n.innerText = `[${this.context}]: Total HEPT cost to max after next expand: ${p.N(e)} (${o}% of owned)`; else { let i = document.createElement("div"); i.id = "hs-costText", a ? i.innerText = `[${this.context}]: Total QUARK cost to max after next expand: ${p.N(e)} (ESTIMATE!)` : i.innerText = `[${this.context}]: Total HEPT cost to max after next expand: ${p.N(e)} (${o}% of owned)`, this.#t.appendChild(i) } } }
    }; var Te = class extends L { #e = []; #t; #a = 3; #r = null; #i = 3e3; constructor(e) { super(e) } async init() { let e = this; c.log("Initialising HSTalismans module", this.context), this.#t = await y.HookElement("#buyTalismanAll"), this.#e = await y.HookElements(".fragmentBtn"); let t = this.#t.cloneNode(!0); this.#t.replaceWith(t), this.#t = await y.HookElement("#buyTalismanAll"), this.#t.addEventListener("click", a => { e.#r && clearTimeout(e.#r), e.#e.length !== 0 && (e.#e[e.#a].click(), e.#a++, e.#a > e.#e.length - 1 && (e.#a = 0), e.#r = setTimeout(() => { e.#a = 3 }, e.#i)) }), c.log("Talisman BUY ALL button is now more functional", this.context), this.isInitialized = !0 } }; var xe = class extends L { constructor(e) { super(e) } async init() { c.log("Extending native prototypes with extra functionality", this.context), Element.prototype.delegateEventListener = this.#t(), Document.prototype.delegateEventListener = this.#t(), Element.prototype.removeDelegateEventListener = this.#a(), Document.prototype.removeDelegateEventListener = this.#a(), HTMLElement.prototype.transition = this.#r(), HTMLElement.prototype.clearTransitions = this.#i(), Object.typedEntries = this.#n, String.prototype.colorTag = function (e) { return `<${e}>${this}</${e}>` }, HTMLElement.prototype.textNodes = function () { return Array.from(this.childNodes).filter(e => e.nodeType === Node.TEXT_NODE).map(e => e.textContent ?? null).filter(e => e !== null) }, this.isInitialized = !0 } #e(e, t) { return `${e}:${t}` } #t() { let e = this; return function (t, a, n, o) { let i = this; i._delegateListeners || (i._delegateListeners = new Map); let r = e.#e(t, a); if (o !== void 0 && o === !0 && i._delegateListeners.has(r) && i._delegateListeners.get(r).size > 0) return this; i._delegateListeners.has(r) || i._delegateListeners.set(r, new Map); let l = function (u) { let d = u.target; if (d.matches(a)) n.call(d, u); else { let g = i.querySelectorAll(a); for (let m of Array.from(g)) if (m.contains(d)) { n.call(m, u); break } } }; return i._delegateListeners.get(r).set(n, { delegateHandler: l }), this.addEventListener(t, l), this } } #a() { let e = this; return function (t, a, n, o) { let i = this; if (!i._delegateListeners) return this; let r = e.#e(t, a), l = i._delegateListeners.get(r); if (!l) return this; let u = l.get(n); return u && (i.removeEventListener(t, u.delegateHandler), l.delete(n), l.size === 0 && i._delegateListeners.delete(r), i._delegateListeners.size === 0 && delete i._delegateListeners), this } } #r() { return function (e, t, a = "linear") { let n = this, o = n.style; return t = t ?? b.HSPrototypes.defaultTransitionTiming, new Promise(i => { if (Object.keys(e).length === 0) { i(); return } let r = o.transition, l = Object.keys(e).join(", "); o.transition = `${l} ${t}ms ${a}`; let u = new Set(Object.keys(e)), d = !1, g = () => { d || (n.removeEventListener("transitionend", h), delete n._hsTransitionEndHandler, o.transition = r, d = !0, i()) }, m = () => { !d && u.size === 0 && g() }, h = f => { if (!(f instanceof TransitionEvent)) return; let v = p.kebabToCamel(f.propertyName); u.has(v) && (u.delete(v), u.size === 0 && g()) }; this._hsTransitionEndHandler = h, n.addEventListener("transitionend", h); let A = setTimeout(() => { d || g() }, t + 50); n.offsetHeight; let M = window.getComputedStyle(n), E = !1; if (Object.entries(e).forEach(([f, v]) => { let w = M.getPropertyValue(f.replace(/([A-Z])/g, "-$1").toLowerCase()), U = typeof v == "number" && f !== "zIndex" && f !== "opacity" ? `${v}px` : String(v); w && w !== "none" && w !== "auto" && w !== U ? E = !0 : u.delete(f), o[f] = v }), !E || u.size === 0) { clearTimeout(A), g(); return } u.size === 0 && g(), m() }) } } #i() { return function () { this.style.transition = "none", this._hsTransitionEndHandler && (this.removeEventListener("transitionend", this._hsTransitionEndHandler), delete this._hsTransitionEndHandler) } } #n(e) { return Object.entries(e) } }; var He = class extends L { #e; constructor(e) { super(e), this.#e = new Map } async init() { } createShadow(e, t, a = !1) { let n = t ?? p.domid(), o = this.#t(e); if (o) return o; let i = new De(e, n, this).create(a); return i && this.#e.set(n, i), i } getShadow(e) { return this.#e.get(e) } destroyShadow(e) { let t = e instanceof De ? e.name : e, a = this.getShadow(t); a && (a._destroy(), this.#e.delete(t)) } #t(e) { for (let [t, a] of this.#e.entries()) if (e === a.getElement()) return a; return null } }, De = class { #e = "HSShadow"; #t; #a; #r; #i; #n; #o; #s = { position: "absolute", width: "80vw", height: "80vh", left: "1vw", top: "1vh", overflowX: "auto", overflowY: "auto", zIndex: "1", backgroundColor: "rgba(125, 125, 125, 0.8)" }; constructor(e, t, a) { this.#a = e, this.name = t, this.#t = a, this.#o = document.createElement("div") } getElement() { return this.#a } getContainer() { return this.#o } hide() { this.#a.style.display = "none", this.#o.style.display = "none" } show() { this.#a.style.display = "block", this.#o.style.display = "block" } create(e = !1) { this.#n = this.#a.style.cssText; let t = this.#a.parentNode; if (this.#i = this.#a.nextSibling, !t) return c.warn("Could not create shadow, parent is null", this.#e), null; this.#r = t; for (let [a, n] of Object.entries(this.#s)) this.#o.style[a] = n; return e || this.hide(), document.body.appendChild(this.#o), this.#a.parentNode?.removeChild(this.#a), this.#o.appendChild(this.#a), this } destroySelf() { } _destroy() { this.#r && (this.#i ? this.#r.insertBefore(this.#a, this.#i) : this.#r.appendChild(this.#a), this.#n && (this.#a.style.cssText = this.#n), this.#o?.remove()) } }; var Be = class extends L { constructor(e) { super(e) } async init() { } setData(e, t) { try { let a = JSON.stringify(t); return localStorage.setItem(`${b.HSStorage.storagePrefix}${e}`, a), !0 } catch (a) { return a instanceof TypeError ? c.warn("Data serialization error", this.context) : a instanceof DOMException ? c.warn("localStorage quota exceeded", this.context) : c.warn(`Error saving to localStorage: ${a}`, this.context), !1 } } getData(e) { try { let t = localStorage.getItem(`${b.HSStorage.storagePrefix}${e}`); return t === null ? (c.warn(`localStorage[${e}] is null`, this.context), null) : JSON.parse(t) } catch (t) { return c.warn(`Error retrieving from localStorage: ${t}`, this.context), null } } clearData(e) { try { localStorage.removeItem(`${b.HSStorage.storagePrefix}${e}`) } catch (t) { c.warn(`Error clearing localStorage: ${t}`, this.context) } } }; var Et = `#hs-minibar-wrapper {
    width: 281px;
    display: flex;
    padding: 0px;
    gap: 4px;
    flex-direction: column;
    align-self: flex-end;
    margin-right: 4%;
    margin-bottom: 5px;
}

#hs-blue-progress-bar,
#hs-red-progress-bar {
    width: 100%;
    height: 4px;
    background-color: black;
    border: 1px solid white;
    border-radius: 0px;
    box-shadow: 0 1px 3px rgb(0 0 0 / 20%);
    position: relative;
}

#hs-blue-progress {
    height: 100%;
    background: linear-gradient(to right, navy, darkturquoise);
    border-radius: 0px;
    transition: width 0.4s ease;
}

#hs-red-progress {
    height: 100%;
    background: linear-gradient(to right, maroon, red);
    border-radius: 0px;
    transition: width 0.4s ease;
}

#hs-blue-progress-text,
#hs-red-progress-text {
    display: none;
}
`; var Le = class extends L {
        #e; #t; #a = null; #r = []; #i = null; #n = null; #o = new Map; #s; #l; #u; #d = new Map; #m = `
        #${b.HSAmbrosia.quickBarId} > .blueberryLoadoutSlot:hover {
            filter: brightness(150%);
        }
        
        .hs-ambrosia-active-slot {
            --angle: 0deg;
            border-image: conic-gradient(
                from var(--angle), 
                #ff5e00, 
                #ff9a00, 
                #ffcd00, 
                #e5ff00, 
                #a5ff00, 
                #00ffc8, 
                #00c8ff, 
                #00a5ff, 
                #9500ff, 
                #ff00e1, 
                #ff0095, 
                #ff5e00
            ) 1;
            
            animation: hue-rotate 6s linear infinite;
        }

        @keyframes hue-rotate {
            to {
                --angle: 360deg;
            }
        }

        @property --angle {
            syntax: '<angle>';
            initial-value: 0deg;
            inherits: false;
        }
    `; #g = "hs-ambrosia-quickbar-css"; #b = `
        #hs-ambrosia-loadout-idle-swap-indicator {
            margin-bottom: 10px;
            font-family: fantasy;
            letter-spacing: 3px;

            background: linear-gradient(to right, #774ed1 20%, #00affa 30%, #0190cd 70%, #774ed1 80%);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            background-size: 500% auto;
            animation: hs-loadout-ind-glow 3.5s ease-in-out infinite alternate;
        }

        @keyframes hs-loadout-ind-glow {
            0% {
                background-position: 0% 50%;
            }

            100% {
                background-position: 100% 50%;
            }
        }

        @-webkit-keyframes hs-loadout-ind-glow {
            0% {
                background-position: 0% 50%;
            }

            100% {
                background-position: 100% 50%;
            }
        }
    `; #f = "hs-ambrosia-idle-loadout-css"; #v = "hs-ambrosia-minibar-css"; #h = !1; #M; #p; #c; #S = !1; #A; #y; constructor(e) { super(e) } async init() { let e = this; c.log("Initializing HSAmbrosia module", this.context), this.#a = await y.HookElement("#blueberryUpgradeContainer"), this.#r = await y.HookElements(".blueberryLoadoutSlot"), this.#i = await y.HookElement("#bbLoadoutContainer"), this.#c = document.querySelector("#hs-panel-debug-gamedata-currentambrosia"), this.loadState(), await this.#x(), c.log("Hooking stuff", this.context); for (let [t, a] of b.HSAmbrosia.ambrosiaLoadoutIcons.entries()) { let n = document.querySelector(`#${a.draggableIconId}`); n && (n.draggable = !0, n.dataset.hsid = t, n.addEventListener("dragstart", o => { if (!o.dataTransfer) return; let i = o.currentTarget?.dataset.hsid; i && (c.log(`Drag start ${i}`, this.context), o.dataTransfer.effectAllowed = "move", o.dataTransfer.setData("hs-amb-drag", i)) })) } if (!this.#i) { c.warn("Could not find loadout container", this.context); return } this.#r.forEach(t => { let a = t.id; if (a) { let n = this.#T(a); if (n) { let o = this.#o.get(n); o && this.#k(n, o) } } }), this.#i.delegateEventListener("dragenter", ".blueberryLoadoutSlot", t => { t.dataTransfer && t.dataTransfer.types.includes("hs-amb-drag") && (t.preventDefault(), t.stopPropagation(), t.dataTransfer.effectAllowed = "move") }), this.#i?.delegateEventListener("dragover", ".blueberryLoadoutSlot", t => { t.dataTransfer && t.dataTransfer.types.includes("hs-amb-drag") && (t.preventDefault(), t.stopPropagation(), t.dataTransfer.effectAllowed = "move") }), this.#i?.delegateEventListener("drop", ".blueberryLoadoutSlot", async t => { if (t.dataTransfer && t.dataTransfer.types.includes("hs-amb-drag")) { t.preventDefault(), t.stopPropagation(); let a = this.#E(t.dataTransfer.getData("hs-amb-drag")), n = t.target, o = n.id; if (!a) { c.warn(`Invalid icon ID: ${a}`, this.context); return } if (!b.HSAmbrosia.ambrosiaLoadoutIcons.has(a)) { c.warn(`Could not find loadout slot entry for ${a}`, this.context); return } if (!n.classList.contains("blueberryLoadoutSlot") || !o) return; let i = this.#T(o); if (!i) { c.warn(`Invalid slot ID: ${o}`, this.context); return } let r = b.HSAmbrosia.ambrosiaLoadoutIcons.get(a); this.#k(i, a), this.#o.set(i, a), this.saveState(), await e.updateQuickBar() } }), this.#i?.delegateEventListener("contextmenu", ".blueberryLoadoutSlot", async t => { t.preventDefault(); let a = t.target, n = a.id, o = this.#T(n); if (!o) { c.warn(`Invalid slot ID: ${n}`, this.context); return } if (!this.#o.get(o)) { c.warn(`No icon found for slot ID: ${n}`, this.context); return } a.classList.remove("hs-ambrosia-slot"), a.style.backgroundImage = "", this.#o.delete(o), this.saveState(), await e.updateQuickBar() }), this.#i?.delegateEventListener("click", ".blueberryLoadoutSlot", async t => { let n = t.target.id, o = this.#T(n); if (!o) { c.warn(`Invalid slot ID: ${n}`, this.context); return } await e.#w(o) }), this.isInitialized = !0 } async#w(e) { this.#s = e; let t = C.getSetting("autoLoadoutState"); t && t.setValue(`<green>${e}</green>`), this.#n || (this.#n = await y.HookElement("header")); let a = this.#n.querySelector(`#${b.HSAmbrosia.quickBarId}`); if (a) { a.querySelectorAll(".blueberryLoadoutSlot").forEach(i => { i.classList.remove("hs-ambrosia-active-slot") }); let o = a.querySelector(`#${b.HSAmbrosia.quickBarLoadoutIdPrefix}-${e}`); o && o.classList.add("hs-ambrosia-active-slot") } else c.warn("Could not find quick bar element", this.context); let n = document.querySelector("#bbLoadoutContainer"); if (n) { n.querySelectorAll(".blueberryLoadoutSlot").forEach(i => { i.classList.remove("hs-ambrosia-active-slot") }); let o = n.querySelector(`#${e}`); o && o.classList.add("hs-ambrosia-active-slot") } } #E(e) { return Object.values(he).find(t => t === e) } #T(e) { return Object.values(me).find(t => t === e) } #k(e, t) { let a = document.querySelector(`#${e}`); if (!a) { c.warn(`Could not find slot element for ${e}`, this.context); return } let n = b.HSAmbrosia.ambrosiaLoadoutIcons.get(t); if (!n) { c.warn(`Could not find icon for ${t}`, this.context); return } a.classList.add("hs-ambrosia-slot"), a.style.backgroundImage = `url(${n.url})` } async saveState() { let e = D.getModule("HSStorage"); if (e) { let t = JSON.stringify(Array.from(this.#o.entries())); e.setData(b.HSAmbrosia.storageKey, t) } else c.warn("saveState - Could not find storage module", this.context) } async loadState() { let e = D.getModule("HSStorage"); if (e) { let a = e.getData(b.HSAmbrosia.storageKey); if (!a) { c.warn("loadState - No data found", this.context); return } try { let n = JSON.parse(a); this.#o = new Map(n) } catch { c.warn("loadState - Error parsing data", this.context); return } } else c.warn("loadState - Could not find storage module", this.context); let t = C.getSetting("autoLoadoutState"); t && !this.#s ? this.#s = p.removeColorTags(t.getValue()) : c.warn("loadState - Could not find autoLoadoutState setting", this.context) } async createQuickBar() { let e = this; if (this.#d.forEach((t, a) => { a.removeEventListener("click", t) }), this.#d.clear(), this.#i = await y.HookElement("#bbLoadoutContainer"), this.#n = await y.HookElement("header"), this.#i && this.#n) { let t = this.#n.querySelector("nav.navbar"), a = this.#i.cloneNode(!0); a.id = b.HSAmbrosia.quickBarId; let n = a.querySelector(".blueberryLoadoutSetting"); a.querySelectorAll(".blueberryLoadoutSlot").forEach(i => { let r = i.id; i.id = `${b.HSAmbrosia.quickBarLoadoutIdPrefix}-${r}`; let l = async function (u) { await e.#P(u, r) }; this.#d.set(i, l), i.addEventListener("click", l) }), n && n.remove(), this.#n.insertBefore(a, t), S.injectStyle(this.#m, this.#g), this.#s && await this.#w(this.#s) } } async destroyQuickBar() { this.#n || (this.#n = await y.HookElement("header")); let e = this.#n.querySelector(`#${b.HSAmbrosia.quickBarId}`); e ? (this.#d.forEach((a, n) => { n.removeEventListener("click", a) }), this.#d.clear(), e.remove(), S.removeInjectedStyle(this.#g)) : c.warn("Could not find quick bar element", this.context); let t = document.querySelector("#bbLoadoutContainer"); t && t.querySelectorAll(".blueberryLoadoutSlot").forEach(a => { a.classList.remove("hs-ambrosia-active-slot") }) } async#x() { let e = await y.HookElement("#importBlueberriesButton"); if (!e || document.getElementById("hs-ambrosia-extra-btn")) return; let t = document.createElement("button"); t.id = "hs-ambrosia-extra-btn", t.className = "ambrosiaLoadoutBtn", t.textContent = "Quick Import", e.parentElement?.insertBefore(t, e.nextSibling), t.addEventListener("click", () => this.#R()) } async updateQuickBar() { C.getSetting("ambrosiaQuickBar").isEnabled() && (await this.destroyQuickBar(), await this.createQuickBar(), this.#s && await this.#w(this.#s)) } async enableAutoLoadout() { let e = this, t = C.getSetting("autoLoadoutState"); if (t && t.getValue().includes("Unknown") || !this.#s) { let d = C.getSetting("autoLoadout"); d && d.isEnabled() && d.disable(), c.warn("Could not enable auto loadout - current loadout state is not known!", this.context); return } let a = [y.HookElement("#addCode"), y.HookElement("#addCodeAll"), y.HookElement("#addCodeOne"), y.HookElement("#timeCode")], o = (await Promise.allSettled(a)).map((d, g) => d.status === "fulfilled" ? d.value : null); if (o.some(d => d === null)) { c.warn("Problem with enabling auto loadout", this.context); return } let [i, r, l, u] = o; this.#l || (this.#l = async d => { await e.#B(d) }), this.#u || (this.#u = async d => { await e.#N(d) }), i.removeEventListener("click", this.#l, { capture: !0 }), i.addEventListener("click", this.#l, { capture: !0 }), r.removeEventListener("click", this.#l, { capture: !0 }), r.addEventListener("click", this.#l, { capture: !0 }), l.removeEventListener("click", this.#l, { capture: !0 }), l.addEventListener("click", this.#l, { capture: !0 }), u.removeEventListener("click", this.#u, { capture: !0 }), u.addEventListener("click", this.#u, { capture: !0 }), c.log("Enabled auto loadout", this.context) } async disableAutoLoadout() { let e = this, t = [y.HookElement("#addCode"), y.HookElement("#addCodeAll"), y.HookElement("#addCodeOne"), y.HookElement("#timeCode")], n = (await Promise.allSettled(t)).map((u, d) => u.status === "fulfilled" ? u.value : null); if (n.some(u => u === null)) { c.warn("Problem with disabling auto loadout", this.context); return } let [o, i, r, l] = n; this.#l && (o.removeEventListener("click", this.#l, { capture: !0 }), i.removeEventListener("click", this.#l, { capture: !0 }), r.removeEventListener("click", this.#l, { capture: !0 })), this.#u && l.removeEventListener("click", this.#u, { capture: !0 }), c.log("Disabled auto loadout", this.context) } async#B(e) { let t = this.#s, a = C.getSetting("autoLoadoutAdd"); if (t && a) { let n = this.#I(a.getValue()), o = await y.HookElement(`#${n}`); await this.#C(), await p.hiddenAction(async () => { o.click() }) } } async#N(e) { let t = this.#s, a = C.getSetting("autoLoadoutTime"); if (t && a) { let n = this.#I(a.getValue()), o = await y.HookElement(`#${n}`); await this.#C(), await p.hiddenAction(async () => { o.click() }) } } async#P(e, t) { let a = document.querySelector(`#${t}`); a ? (await this.#C(), await p.hiddenAction(async () => { a.click() })) : c.warn(`Could not find real button for ${t}`, this.context) } async#C() { let e = await y.HookElement("#blueberryToggleMode"); e && e.innerText.includes("SAVE") && e.click() } #I(e) { let t = Object.values(me).find(a => a === `blueberryLoadout${e}`); return t || c.warn(`Could not convert loadout ${e} to slot`, this.context), t } subscribeGameDataChanges() { let e = D.getModule("HSGameData"); e && !this.gameDataSubscriptionId && (this.gameDataSubscriptionId = e.subscribeGameDataChange(this.gameDataCallback.bind(this)), c.debug("Subscribed to game data changes", this.context)) } unsubscribeGameDataChanges() { let e = D.getModule("HSGameData"); e && this.gameDataSubscriptionId && !this.#h && !this.#S && (e.unsubscribeGameDataChange(this.gameDataSubscriptionId), this.gameDataSubscriptionId = void 0, c.debug("Unsubscribed from game data changes", this.context)) } async gameDataCallback() {
            let e = D.getModule("HSGameDataAPI"); if (!e) return; let t = e.getGameData(); if (t && t.blueberryTime && t.redAmbrosiaTime) {
                let a = t.blueberryTime, n = t.redAmbrosiaTime, o = e.R_calculateRequiredBlueberryTime(), i = e.R_calculateRequiredRedAmbrosiaTime(), r = a / o * 100, l = n / i * 100, u = e.calculateAmbrosiaSpeed(), d = e.calculateBlueBerries(), g = u * d, m = t.shopUpgrades.shopAmbrosiaAccelerator, h = e.calculateLuck(), A = t.singularityChallenges.noAmbrosiaUpgrades.completions > 0 ? 1 : 0, M = h.total / 100 + A, E = (h.total - 100 * Math.floor(h.total / 100)) / 100, f = 0, v = 0, w = 0, U = g / o * 100, P = U + .1, V = 1 / 2 + (3 / 5 - 1 / 2) * +(t.singularityChallenges.noAmbrosiaUpgrades.completions >= 15) + (2 / 3 - 3 / 5) * +(t.singularityChallenges.noAmbrosiaUpgrades.completions >= 19) + (3 / 4 - 2 / 3) * +(t.singularityChallenges.noAmbrosiaUpgrades.completions >= 20); if (m > 0 && g > 0) { let Q = o / g; f = Math.min(Q * V, M * .2 * m), v = f * g, w = v / o * 100 } if (this.#h && this.#M && this.#p) {
                    let Q = C.getSetting("ambrosiaIdleSwapNormalLoadout"), O = C.getSetting("ambrosiaIdleSwap100Loadout"); if (Q && O) { let J = Q.getValue(), F = O.getValue(); if (!Number.isInteger(parseInt(J, 10)) || !Number.isInteger(parseInt(F, 10))) { let j = C.getSetting("ambrosiaIdleSwap"); j && j.disable(), c.log("Idle swap was disabled due to unconfigured loadouts", this.context); return } let z = this.#I(Q.getValue()), Y = this.#I(O.getValue()), k = P + w, I = k + P, R = 100 - P, B = 100, H = b.HSAmbrosia.idleSwapMinRedTreshold, G = H + b.HSAmbrosia.idleSwapMinRedTreshold, Z = b.HSAmbrosia.idleSwapMaxRedTreshold; if (r >= R && r <= B || l >= Z && l <= 100) { if (this.#s !== Y) { let j = await y.HookElement(`#${Y}`); await this.#C(), await p.hiddenAction(async () => { j.click() }) } } else if ((r >= k && r <= I || l >= H && l <= G) && this.#s !== z) { let j = await y.HookElement(`#${z}`); await this.#C(), await p.hiddenAction(async () => { j.click() }) } } if (this.#c && S.isModPanelOpen()) {
                        let J = document.createElement("div"); for (J.innerHTML = `
                        BLUE - Value: ${a.toFixed(2)}, Max: ${o}, Percent: ${r.toFixed(2)}<br>
                        RED - Value: ${n.toFixed(2)}, Max: ${i}, Percent: ${l.toFixed(2)}<br>
                        BLUE SPD MLT: ${u.toFixed(2)}<br>
                        BLUE SPD %: ${U.toFixed(2)}<br>
                        BERRY: ${d}</br>
                        TOT BLU: ${(u * d).toFixed(2)}</br>
                        ------------------------</br>
                        ADD LUK: ${h.additive.toFixed(2)}</br>
                        RAW LUK: ${h.raw.toFixed(2)}</br>
                        TOT LUK: ${h.total.toFixed(2)}</br>
                        ------------------------</br>
                        ACC CNT: ${m}</br>
                        ACCEL AMOUNT: ${v.toFixed(2)}</br>
                        ACCEL %: ${w.toFixed(2)}</br>
                        `, this.#c.innerHTML = ""; J.firstChild;)this.#c.appendChild(J.firstChild)
                    }
                } this.#S ? this.#A && this.#y ? (this.#A.style.width = `${r}%`, this.#y.style.width = `${l}%`) : c.warnOnce(`
                        HSAmbrosia.gameDataCallback() - minibar element(s) undefined. 
                        blue: ${this.#A}, 
                        red: ${this.#y}`, "hs-minibars-undefined") : c.logOnce("HSAmbrosia.gameDataCallback() - berryMinibarsEnabled was false", "hs-minibars-false")
            }
        } async enableIdleSwap() { let e = this, t = D.getModule("HSGameState"); t ? (this.#e = t.subscribeGameStateChange("MAIN_VIEW", this.#L.bind(this)), this.#t = t.subscribeGameStateChange("SINGULARITY_VIEW", async (a, n) => { n.getId() === 5 ? (this.#M = await y.HookElement("#ambrosiaProgressBar"), this.#p = await y.HookElement("#pixelProgressBar"), this.#h = !0, this.#H(), this.subscribeGameDataChanges()) : (this.#h = !1, this.#D(), this.unsubscribeGameDataChanges()) }), t.getCurrentUIView("SINGULARITY_VIEW").getId() === 5 && t.getCurrentUIView("MAIN_VIEW").getId() === 13 && (this.#M = await y.HookElement("#ambrosiaProgressBar"), this.#p = await y.HookElement("#pixelProgressBar"), this.#h = !0, this.#H(), this.subscribeGameDataChanges())) : c.warn("HSAmbrosia.enableIdleSwap() - gameStateMod==undefined", "hs-enable-idleswap-gamestate"), this.#c || (this.#c = document.querySelector("#hs-panel-debug-gamedata-currentambrosia")) } disableIdleSwap() { this.#h = !1, this.unsubscribeGameDataChanges(); let e = D.getModule("HSGameState"); e ? (this.#e && (e.unsubscribeGameStateChange("MAIN_VIEW", this.#e), this.#e = void 0), this.#t && (e.unsubscribeGameStateChange("SINGULARITY_VIEW", this.#t), this.#t = void 0)) : c.warnOnce("HSAmbrosia.disableIdleSwap() - gameStateMod==undefined", "hs-disable-idleswap-gamestate"), this.#D() } #L(e, t) { let a = D.getModule("HSGameState"); a ? e.getId() === 13 && t.getId() !== 13 && a.getCurrentUIView("SINGULARITY_VIEW").getId() === 5 && (this.#h = !1) : c.warnOnce("HSAmbrosia.gameStateCallbackMain() - gameStateMod==undefined", "hs-amb-gamestate-cb") } #H() { if (document.querySelector(`#${b.HSAmbrosia.idleSwapIndicatorId}`)) return; let t = document.createElement("div"); t.id = b.HSAmbrosia.idleSwapIndicatorId, t.innerText = "IDLE SWAP ENABLED WHILE IN THIS VIEW", S.injectHTMLElement(t, a => { let n = document.querySelector("#singularityAmbrosia"), o = document.querySelector("#ambrosiaProgressBar"); n?.insertBefore(a, o) }), S.injectStyle(this.#b, this.#f) } #D() { let e = document.querySelector(`#${b.HSAmbrosia.idleSwapIndicatorId}`); e && e.remove(), S.removeInjectedStyle(this.#f) } async enableBerryMinibars() { if (this.#n || (this.#n = await y.HookElement("header")), !this.#n) return; let t = (await y.HookElement("#ambrosiaProgressBar")).cloneNode(!0), a = t.querySelector("#ambrosiaProgress"), n = t.querySelector("#ambrosiaProgressText"); t.id = b.HSAmbrosia.blueBarId, a.id = b.HSAmbrosia.blueBarProgressId, n.id = b.HSAmbrosia.blueBarProgressTextId; let i = (await y.HookElement("#pixelProgressBar")).cloneNode(!0), r = i.querySelector("#pixelProgress"), l = i.querySelector("#pixelProgressText"); i.id = b.HSAmbrosia.redBarId, r.id = b.HSAmbrosia.redBarProgressId, l.id = b.HSAmbrosia.redBarProgressTextId; let u = document.createElement("div"); u.id = b.HSAmbrosia.barWrapperId, u.appendChild(t), u.appendChild(i); let d = C.getSetting("ambrosiaQuickBar"), g; d && d.isEnabled() ? g = this.#n.querySelector("#hs-ambrosia-quick-loadout-container") : g = this.#n.querySelector("nav.navbar"), this.#n.insertBefore(u, g), S.injectStyle(Et, this.#v), this.#A = a, this.#y = r, this.subscribeGameDataChanges(), this.#S = !0 } async disableBerryMinibars() { this.#n || (this.#n = await y.HookElement("header")); let e = this.#n.querySelector(`#${b.HSAmbrosia.barWrapperId}`); e ? e.remove() : c.warn("Could not find bar wrapper element", this.context), S.removeInjectedStyle(this.#v), this.#S = !1, this.unsubscribeGameDataChanges() } async#R() {
            let e = null; try {
                e = document.querySelector(".blueberryLoadoutSlot.hs-ambrosia-active-slot"); let t = await navigator.clipboard.readText(); if (!t || typeof t != "string") { S.Notify("Clipboard does not contain valid loadout data", { notificationType: "warning" }); return } let a = t.split(`
`).map(u => u.trim()); if (a.length === 0 || a.length > 16) { S.Notify(`Invalid number of loadouts: ${a.length}. Expected 1-16.`, { notificationType: "warning" }); return } let n = document.getElementById("importBlueberries"), o = await y.HookElement("#blueberryToggleMode"); if (!n) throw new Error("Import input element not found"); if (!o) throw new Error("Mode toggle button not found"); o.innerText.includes("LOAD ") && o.click(); let r = 0, l = 0; p.startDialogWatcher(); for (let u = 0; u < a.length; u++) { let d = a[u], g = u + 1; if (!d) { l++; continue } let m = document.getElementById(`blueberryLoadout${g}`); if (!m) { console.warn(`Loadout button ${g} not found`); continue } let h = new Blob([d], { type: "application/json" }), A = new File([h], "quick-import.json", { type: "application/json" }), M = new DataTransfer; M.items.add(A), n.files = M.files; let E = new Event("change", { bubbles: !0 }); n.dispatchEvent(E), await p.sleep(50), m.click(), await p.sleep(50), r++ } o.click(), S.Notify(`Imported ${r} loadout(s), skipped ${l} empty slot(s)`, { notificationType: "success" })
            } catch (t) { let a = t instanceof Error ? t.message : typeof t == "string" ? t : "Unknown error"; console.error("Quick Import error:", t), c.error(`Quick Import failed: ${a}`, this.context, !0), S.Notify("Quick Import failed", { notificationType: "error" }) } finally { await p.stopDialogWatcher(), e && e.click() }
        }
    }; var Re = class extends L { constructor(e) { super(e) } async init() { c.log("Initializing HSStats module", this.context), this.isInitialized = !0 } }; var Ge = class extends L { #e = -1; #t = { CubeView: le, SingularityView: ce }; #a = { MAIN_VIEW: { currentView: new se("unknown"), previousView: new se("unknown"), viewChangeSubscribers: new Map }, CUBE_VIEW: { currentView: new le("unknown"), previousView: new le("unknown"), viewChangeSubscribers: new Map }, SINGULARITY_VIEW: { currentView: new ce("unknown"), previousView: new ce("unknown"), viewChangeSubscribers: new Map } }; #r = ["buildings", "upgrades", "statistics", "runes", "challenges", "research", "ants", "cubes", "campaigns", "traits", "settings", "shop", "singularity", "event", "pseudoCoins"]; constructor(e) { super(e) } async init() { let e = this; c.log("Initializing HSGameState module", this.context); for (let t of this.#r) { let a = document.querySelector(`#${t}`); y.watchElement(a, async n => { let { view: o, state: i } = n; if (i !== "none") { let r = new se(o); if (r.getId() !== -1) e.#a.MAIN_VIEW.previousView = e.#a.MAIN_VIEW.currentView, e.#a.MAIN_VIEW.currentView = r, c.debug(`Main UI view changed ${e.#a.MAIN_VIEW.previousView.getName()} -> ${e.#a.MAIN_VIEW.currentView.getName()}`, e.context); else { c.warn(`Main UI view ${o} not found`, e.context); return } e.#a.MAIN_VIEW.viewChangeSubscribers.forEach(l => { try { l(e.#a.MAIN_VIEW.previousView, e.#a.MAIN_VIEW.currentView) } catch (u) { c.error(`Error when trying to call MAIN VIEW change subscriber callback: ${u}`, e.context) } }), this.#i(r.getId()) } }, { characterData: !1, childList: !1, subtree: !1, attributes: !0, attributeOldValue: !1, attributeFilter: ["style"], valueParser: (n, o) => { for (let i of o) if (i.type === "attributes" && i.attributeName === "style") { let r = i.target, l = r.style.getPropertyValue("display"); return { view: r.id, state: l } } } }) } b.HSGameState.viewProperties.forEach(async (t, a) => { for (let n of t.subViewIds) { let o = document.querySelector(`#${n}`); y.watchElement(o, async i => { let { view: r, state: l } = i; if (l !== "none") { let u; try { let g = this.#t[t.viewClassName]; if (!g) throw new Error(`Class "${t.viewClassName}" not found in viewClasses for mainViewId ${a}`); u = new g(n) } catch (g) { c.warn(`Failed to instantiate sub-view ${t.viewClassName}: ${g}`, e.context); return } let d = u.getViewKey(); if (u.getId() !== e.#e) { e.#a[d].previousView = e.#a[d].currentView, e.#a[d].currentView = u; let g = e.#a[d].previousView, m = e.#a[d].currentView; e.#a[d].viewChangeSubscribers.forEach(h => { try { h(g, m) } catch (A) { c.error(`Error when trying to call CUBE VIEW change subscriber callback: ${A}`, e.context) } }), c.debug(`Subview changed ${g.getName()} -> ${m.getName()}`, e.context) } else { c.warn(`Subview ${r} not found`, e.context); return } } }, { characterData: !1, childList: !1, subtree: !1, attributes: !0, attributeOldValue: !1, attributeFilter: ["style"], valueParser: (i, r) => { for (let l of r) if (l.type === "attributes" && l.attributeName === "style") { let u = l.target, d = u.style.getPropertyValue("display"); return { view: u.id, state: d } } } }) } }), this.isInitialized = !0 } subscribeGameStateChange(e, t) { let a = p.uuidv4(); return this.#a[e].viewChangeSubscribers.set(a, t), a } unsubscribeGameStateChange(e, t) { this.#a[e].viewChangeSubscribers.has(t) ? this.#a[e].viewChangeSubscribers.delete(t) : c.warn(`Subscription ID ${t} not found for view key ${e}`, this.context) } async#i(e) { let t = this, a = b.HSGameState.viewProperties.get(e); if (!a) { c.debug(`No view properties found for main view ID ${e}`, this.context); return } (await y.HookElements(a.subViewsSelector)).forEach(async o => { let i = o.id; if (o.style.getPropertyValue("display") !== "none") { let l; try { let d = this.#t[a.viewClassName]; if (!d) throw new Error(`Class "${a.viewClassName}" not found in viewClasses for mainViewId ${e}`); l = new d(i) } catch (d) { c.warn(`Failed to instantiate sub-view ${a.viewClassName} for tab ${i}: ${d}`, t.context); return } let u = l.getViewKey(); if (l && l.getId() !== this.#e) { t.#a[u].previousView = t.#a[u].currentView, t.#a[u].currentView = l; let d = t.#a[u].previousView, g = t.#a[u].currentView; t.#a[u].viewChangeSubscribers.forEach(m => { try { m(d, g) } catch (h) { c.error(`Error when trying to call VIEW change subscriber callback: ${h}`, t.context) } }) } else c.warn(`Sub-view tab ${i} (for ${a.viewClassName}) resolved to UNKNOWN or failed to initialize.`, t.context) } }) } getCurrentUIView(e) { return this.#a[e].currentView } }, ue = class { #e; #t; constructor(e, t) { this.#e = e, this.#t = t } getName() { return this.#e } getViewKey() { return this.#t } }, se = class extends ue { #e; constructor(e) { super(e, "MAIN_VIEW"), this.#e = this.getViewEnum(e) } getViewEnum(e) { switch (e) { case "buildings": return 1; case "upgrades": return 2; case "statistics": return 3; case "runes": return 4; case "challenges": return 5; case "research": return 6; case "ants": return 7; case "cubes": return 8; case "campaigns": return 9; case "traits": return 10; case "settings": return 11; case "shop": return 12; case "singularity": return 13; case "event": return 14; case "pseudoCoins": return 15 }return -1 } getId() { return this.#e } }, le = class extends ue { #e; constructor(e) { super(e, "CUBE_VIEW"), this.#e = this.getViewEnum(e) } getViewEnum(e) { switch (e) { case "cubeTab1": return 1; case "cubeTab2": return 2; case "cubeTab3": return 3; case "cubeTab4": return 4; case "cubeTab5": return 5; case "cubeTab6": return 6; case "cubeTab7": return 7 }return -1 } getId() { return this.#e } }, ce = class extends ue { #e; constructor(e) { super(e, "SINGULARITY_VIEW"), this.#e = this.getViewEnum(e) } getViewEnum(e) { switch (e) { case "singularitycontainer1": return 1; case "singularityContainer2": return 2; case "singularityContainer3": return 3; case "singularityContainer4": return 4; case "singularityContainer5": return 5 }return -1 } getId() { return this.#e } }; var K = class { #e; constructor(e) { this.#e = e } get patchName() { return this.#e } }; var Ne = class extends K {
        #e = `
        #ambrosiaUpgradeValues {
            overflow-y: auto;
            height: 25vh;
        }

        #ambrosiaUpgradeValues::-webkit-scrollbar {
            width: 5px;
            height: 5px;
        }

        #ambrosiaUpgradeValues::-webkit-scrollbar-track {
            background: #1c1b22;
            border-radius: 3px;
        }

        #ambrosiaUpgradeValues::-webkit-scrollbar-thumb {
            background: #a22a2a;
            border-radius: 3px;
        }

        #ambrosiaUpgradeValues::-webkit-scrollbar-corner {
            background: #1c1b22;
        }

        @supports not selector(::-webkit-scrollbar) {
            #ambrosiaUpgradeValues::-webkit-scrollbar {
                scrollbar-color: #a22a2a #1c1b22;
            }
        }`; #t = "ambrosiaViewOverflowPatch"; async applyPatch() { S.injectStyle(this.#e, this.#t) } async revertPatch() { S.removeInjectedStyle(this.#t) }
    }; var Pe = class extends K { async applyPatch() { } async revertPatch() { } }; var Ct = `{
    "offeringPotion": "Offering Potion",
    "obtainiumPotion": "Obtainium Potion",
    "offeringEX": "Offering EX",
    "offeringAuto": "Offering Auto",
    "obtainiumEX": "Obtainium EX",
    "obtainiumAuto": "Obtainium Auto",
    "instantChallenge": "Instant Challenge Completions",
    "antSpeed": "Ant Speed",
    "cashGrab": "Cash Grab",
    "shopTalisman": "the Plastic talisman",
    "seasonPass": "Season Pass",
    "challengeExtension": "Reincarnation Challenge EX",
    "challengeTome": "Challenge 10 Requirement Reduce",
    "cubeToQuark": "Cube Quarks +50%",
    "tesseractToQuark": "Tesseract Quarks +50%",
    "hypercubeToQuark": "Hypercube Quarks +50%",
    "seasonPass2": "Season Pass 2",
    "seasonPass3": "Season Pass 3",
    "chronometer": "Chronometer 1",
    "infiniteAscent": "Infinite Ascent",
    "calculator": "PL-AT calculator",
    "calculator2": "PL-AT X calculator",
    "calculator3": "PL-AT \\u03A9 calculator",
    "calculator4": "PL-AT \\u03B4 calculator",
    "calculator5": "PL-AT \\u0393 calculator",
    "calculator6": "QUAAA-T calculator",
    "calculator7": "PL-AT \\u03A9\\u03A9 calculator",
    "constantEX": "Constant EX",
    "powderEX": "Powder EX",
    "chronometer2": "Chronometer 2",
    "chronometer3": "Chronometer 3",
    "seasonPassY": "Season Pass Y",
    "seasonPassZ": "Season Pass Z",
    "challengeTome2": "Challenge 10 Requirement Reduction 2",
    "instantChallenge2": "Instant Challenge Completions 2",
    "cubeToQuarkAll": "Quark Gain Cube Improvement 2",
    "cashGrab2": "Cash Grab 2",
    "chronometerZ": "Chronometer Z",
    "obtainiumEX2": "Obtainium EX 2",
    "offeringEX2": "Offering EX 2",
    "powderAuto": "Automated Powder",
    "seasonPassLost": "Season Pass LOST",
    "challenge15Auto": "Challenge 15 Automation",
    "extraWarp": "Extra Warp",
    "autoWarp": "a quack powered Warps?",
    "improveQuarkHept": "Quark Hepteract 1",
    "improveQuarkHept2": "Quark Hepteract 2",
    "improveQuarkHept3": "Quark Hepteract 3",
    "improveQuarkHept4": "Quack Hepteract 4",
    "shopImprovedDaily": "Improved Daily Code 1",
    "shopImprovedDaily2": "Improved Daily Code 2",
    "shopImprovedDaily3": "Improved Daily Code 3",
    "shopImprovedDaily4": "Improved Daily Code 4",
    "offeringEX3": "The final Offering Upgrade",
    "obtainiumEX3": "The final Obtainium Upgrade",
    "improveQuarkHept5": "The final Quark Hepteract Improver",
    "chronometerInfinity": "The final Chronometer",
    "seasonPassInfinity": "The final Season pass",
    "shopSingularityPenaltyDebuff": "A Singularity Tenderizer",
    "shopAmbrosiaLuckMultiplier4": "The Fourth Multiplicative Ambrosia Luck Multiplier",
    "shopOcteractAmbrosiaLuck": "Octeract-Based Ambrosia Luck Amplifier",
    "shopAmbrosiaGeneration1": "Ambrosia Generation Speedup",
    "shopAmbrosiaGeneration2": "Another Ambrosia Generation Speedup",
    "shopAmbrosiaGeneration3": "A better Ambrosia Generation Speedup",
    "shopAmbrosiaGeneration4": "A FINAL Ambrosia Generation Speedup",
    "shopAmbrosiaLuck1": "Ambrosia Luck Increaser",
    "shopAmbrosiaLuck2": "Another Ambrosia Luck Increaser",
    "shopAmbrosiaLuck3": "A better Ambrosia Generation Speedup",
    "shopAmbrosiaLuck4": "A FINAL Ambrosia Luck Increaser",
    "shopRedLuck1": "Low Class Dice of Asmodeus",
    "shopRedLuck2": "Dice of Asmodeus",
    "shopRedLuck3": "High Class Dice of Asmodeus",
    "shopCashGrabUltra": "It's the FINAL CASHGRAB!",
    "shopAmbrosiaAccelerator": "An Ambrosial Accelerator!",
    "shopEXUltra": "It's the FINAL E X!",
    "shopChronometerS": "The FINAL Chronometer",
    "shopAmbrosiaUltra": "The FINAL Ambrosia Exaltation... I don't flippin know!",
    "shopSingularitySpeedup": "Singularity Timed-Perks Speedup",
    "shopSingularityPotency": "Singularity Passives Potency",
    "shopSadisticRune": "Sadistic Rune Unlock! Or does it?",
    "shopInfiniteShopUpgrades": "Blue Infinity Shop Voucher"
}`; var Ue = class extends K { #e; #t; async applyPatch() { let e = this; try { this.#e = JSON.parse(Ct); let t = await y.HookElement("#actualShop"); t && (this.#t || (this.#t = a => { e.#a(a) }), t.removeDelegateEventListener("mouseover", "div", this.#t), t.delegateEventListener("mouseover", "div", this.#t)) } catch { c.error("Failed to parse shop item map"), this.#e = void 0 } } #a(e) { let t; if (e.target instanceof HTMLDivElement) t = e.target; else if (e.target instanceof HTMLImageElement || e.target instanceof HTMLParagraphElement || e.target instanceof HTMLButtonElement) t = e.target.parentElement; else return; if (t.id === "actualShop") return; let a = t.querySelector("img"); if (a) { let n = a.id, o = this.#e?.[n], i = document.querySelector("#shopHovers"), r = i.querySelector("#hs-shopHoverName"); if (r) r.innerText = o || ""; else { let l = document.createElement("div"); l.id = "hs-shopHoverName", l.innerText = o || "", i.insertBefore(l, i.querySelector("p:nth-child(2)")) } } } async revertPatch() { if (this.#t) { let t = await y.HookElement("#actualShop"); t && t.removeDelegateEventListener("mouseover", "div", this.#t) } let e = document.querySelector("#hs-shopHoverName"); e && e.remove() } }; var Qe = class extends K { async applyPatch() { let e = await y.HookElement("#buildingstab"); e.style.color = "red" } async revertPatch() { let e = await y.HookElement("#buildingstab"); e.style.color = "" } }; var Oe = class extends L { #e = { AmbrosiaViewOverflow: Ne, TestPatch: Qe, ShopItemNameMapping: Ue, IconSetCaching: Pe }; #t = {}; constructor(e) { super(e) } async init() { c.log("Initializing HSPatches module", this.context), this.isInitialized = !0 } async applyPatch(e) { let t = this.#e[e]; if (!t) { c.warn(`Patch "${e}" not found`, this.context); return } let a; this.#t[e] ? (c.debug(`Patch "${e}" is already instantiated`, this.context), a = this.#t[e]) : (a = new t(e), this.#t[e] = a), await a.applyPatch() } async revertPatch(e) { let t = this.#e[e]; if (!t) { c.warn(`Patch "${e}" not found`, this.context); return } let a; this.#t[e] ? a = this.#t[e] : (a = new t(e), this.#t[e] = a), await a.revertPatch() } }; var Ve = class extends L {
        #e = "Synergysave2"; #t; #a; #r = !1; #i; #n; #o = `
        #savegame {
            display: none !important;
        }

        #saveinfo {
            display: none !important;
        }
    `; #s; #l; #u = new Map; #d; #m; #g; #b; #f; #v = !1; #h; #M; #p; #c; #S; #A; #y; #w = { tokens: 0, maxTokens: 0, isAtMaxTokens: !1 }; #E = { HAPPY_HOUR_BELL: { amount: 0, ends: [], displayName: "Happy Hour Bell" } }; #T = !1; #k; #x; #B = 0; #N = 5e3; constructor(e) { super(e), this.#A = document.querySelector("#campaignTokenCount"), this.#x = new Event("click") } async init() { let e = this; c.log("Initializing HSGameData module", this.context), this.#d = document.querySelector("#singularitybtn"), this.#g = Array.from(document.querySelectorAll("#singularityChallenges > div.singularityChallenges > div")), this.#m = document.querySelector("#importFileButton"); try { let a = await (await fetch(b.Common.pseudoAPIurl)).json(); this.#h = a, this.#Q() } catch { c.error("Could not fetch pseudo data", this.context) } try { let a = await (await fetch(b.Common.meAPIurl)).json(); this.#M = a, this.#O() } catch { c.error("Could not fetch me data", this.context) } this.#p = D.getModule("HSGameDataAPI"), this.#P(), this.isInitialized = !0 } async forceUpdateAllData() { let e = Date.now(); if (e - this.#B < this.#N) { c.warn("Forced data refresh on cooldown", this.context); return } this.#B = e, await this.#I(), await this.#V(), await this.#I(), this.#R(); let t = await y.HookElement("#savegame"); t && t.dispatchEvent(this.#x), this.#k && (this.#a = JSON.parse(this.#k)), this.#Q(), this.#O(), this.#Y(), this.#U() } #P() { let e = this, t = D.getModule("HSWebSocket"); t && t.registerWebSocket("consumable-event-socket", { url: b.Common.eventAPIUrl, onMessage: async a => { if (a?.type === "info-all") if (e.#C(), a.active && a.active.length > 0) { c.debug(`Caught WS event: ${a.type} - event count: ${a.active.length}}`, "WebSocket"); for (let { internalName: n, endsAt: o, name: i } of a.active) { let r = e.#E[n]; r.ends.push(o), r.amount++, r.displayName = i } e.#G() } else c.debug("Caught INFO_ALL, but no active events", this.context); else if (a?.type === "error") c.debug("Caught ERROR", this.context), e.#C(); else if (a?.type === "consumable-ended") { c.debug("Caught EVENT_ENDED", this.context); let n = e.#E[a?.consumable]; n.ends.shift(), n.amount--, e.#G() } else a?.type === "join" && c.debug("Caught JOIN (connection established)", this.context) }, onRetriesFailed: async () => { e.#C(), e.#G() } }) } #C() { for (let e of Object.keys(this.#E)) this.#E[e] = { amount: 0, ends: [], displayName: "" }; this.#G() } async#I() { c.debug("Refreshing fetched data", this.context); try { let t = await (await fetch("https://synergism.cc/stripe/upgrades")).json(); this.#h = t, this.#Q() } catch { c.error("Could not fetch pseudo data", this.context) } try { let t = await (await fetch("https://synergism.cc/api/v1/users/me")).json(); this.#M = t, this.#O() } catch { c.error("Could not fetch me data", this.context) } } #L() { if (!this.#r) return; let e = localStorage.getItem(this.#e); if (e && e !== this.#S) { this.#S = e; try { this.#a = JSON.parse(atob(e)), this.#U() } catch (t) { c.debug(`<red>Error processing save data:</red> ${t}`, this.context), this.#D() } } requestAnimationFrame(this.#L.bind(this)) } #H() { if (this.#r) { if (this.#k) try { this.#a = JSON.parse(this.#k), this.#U() } catch (e) { c.debug(`<red>Error processing save data:</red> ${e}`, this.context), this.#D() } requestAnimationFrame(this.#H.bind(this)) } } #D() { if (!this.#t) return; let e = C.getSetting("useGameData"), t = C.getSetting("stopSniffOnError"); e && t ? t.isEnabled() && (c.debug("Stopped game data sniffing on error", this.context), e.disable()) : c.debug(`maybeStopSniffOnError() - Issue with fetching settings: ${e}, ${t}`, this.context) } async enableGDS() { let e = this; this.#r || (S.injectStyle(this.#o, b.HSGameData.turboCSSId), this.#s && clearInterval(this.#s), await this.#I(), this.#c && clearInterval(this.#c), this.#c = setInterval(() => { e.#I() }, b.HSGameData.fetchedDataRefreshInterval), this.#V(), this.#y && clearInterval(this.#y), this.#w.isAtMaxTokens || (this.#y = setInterval(() => { e.#V() }, b.HSGameData.campaignTokenRefreshInterval)), this.#i || (this.#i = await y.HookElement("#savegame")), this.#n || (this.#n = await y.HookElement("#saveinfo")), this.#s = setInterval(() => { this.#i && this.#n && this.#x && this.#i.dispatchEvent(this.#x) }, b.HSGameData.turboModeSpeedMs), this.#d || (this.#d = await y.HookElement("#singularitybtn")), this.#g || (this.#g = Array.from(document.querySelectorAll("#singularityChallenges > div.singularityChallenges > div"))), this.#m || (this.#m = await y.HookElement("#importFileButton")), this.#b || (this.#b = async t => { e.#F(t) }), this.#f || (this.#f = async t => { e.#J(t) }), this.#d.addEventListener("click", this.#b, { capture: !0 }), this.#g.forEach(t => { t.addEventListener("click", e.#b, { capture: !0 }) }), this.#m.addEventListener("click", this.#f, { capture: !0 }), c.info("GDS = ON", this.context), this.#r = !0, b.Common.experimentalGDS ? (this.#R(), this.#H()) : this.#L()) } #R() { if (this.#T) return; let e = this, t = window.btoa; window.btoa = function (a) { return a && a.length > 0 && a[0] === "{" && (e.#k = a), t(a) }, this.#T = !0 } async#J(e) { let t = C.getSetting("useGameData"); t && t.isEnabled() && (t.disable(), await S.Notify("GDS has been disabled for save file import", { position: "top", notificationType: "warning" })) } async#F(e) { let t = e.target, a = ["noSingularityUpgrades", "oneChallengeCap", "limitedAscensions", "noOcteracts", "noAmbrosiaUpgrades", "limitedTime", "sadisticPrequel", "taxmanLastStand"]; if (t) { let n, o = t.getAttribute("style"); if (t.id && a.includes(t.id) ? o?.includes("orchid") ? n = !0 : a.map(r => document.querySelector(`#${r}`)?.getAttribute("style")?.includes("orchid")).some((r => r === !0)) ? n = !1 : n = !0 : o?.toLowerCase().includes("grayscale") ? n = !1 : n = !0, n) { let i = C.getSetting("useGameData"); if (i && i.isEnabled()) { this.#v = !0, i.disable(), await p.wait(4e3); let r = C.getSetting("useGameData"); r && this.#v && !r.isEnabled() ? (c.debug("Re-enabled GDS", this.context), r.enable()) : c.debug("GDS was already enabled (WoW fast!)", this.context), this.#v = !1 } } } } async disableGDS() { let e = this; this.#s && (clearInterval(this.#s), this.#s = void 0), this.#c && clearInterval(this.#c), this.#y && clearInterval(this.#y), S.removeInjectedStyle(b.HSGameData.turboCSSId), this.#d || (this.#d = await y.HookElement("#singularitybtn")), this.#g || (this.#g = await y.HookElements("#singularityChallenges > div.singularityChallenges > div")), this.#m || (this.#m = await y.HookElement("#importFileButton")), this.#b && (this.#d.removeEventListener("click", this.#b, { capture: !0 }), this.#g.forEach(t => { t.removeEventListener("click", e.#b, { capture: !0 }) }), this.#b = void 0), this.#f && (this.#m.removeEventListener("click", this.#f, { capture: !0 }), this.#f = void 0), c.info("GDS turbo = OFF", this.context), this.#r = !1 } subscribeGameDataChange(e) { let t = p.uuidv4(); return this.#u.set(t, e), t } unsubscribeGameDataChange(e) { this.#u.has(e) ? this.#u.delete(e) : c.warn(`Could not unsubscribe from game data change. ID ${e} not found`, this.context) } #U() { this.#p && this.#a && this.#p._updateGameData(this.#a), this.#u.forEach(e => { this.#a ? e(this.#a) : c.debug("Could not call game data change callback. No save data found", this.context) }) } #Q() { this.#p && this.#h && this.#p._updatePseudoData(this.#h) } #O() { this.#p && this.#M && this.#p._updateMeData(this.#M) } #Y() { this.#p && this.#w && this.#p._updateCampaignData(this.#w) } #G() { this.#p && this.#E && this.#p._updateEventData(this.#E) } #V() { if (c.debug("Refreshing campaign data", this.context), !this.#A) { let t = document.querySelector("#campaignTokenCount"); if (t) this.#A = t; else return } let e = this.#A; if (e) { let t = e.innerText.match(/^You have (\d+) \/ (\d+) .+$/); if (t && t[1] && t[2]) { let a = parseInt(t[1], 10), n = parseInt(t[2], 10); this.#w.tokens = a, this.#w.maxTokens = n, this.#w.isAtMaxTokens = a > 0 && n > 0 && a === n, this.#Y() } } this.#w.isAtMaxTokens && this.#y && (c.debug("Dynamic clear of campaign token refresh interval, player is at max", this.context), clearInterval(this.#y)) }
    }; var It = [{ calculationName: "Consumable Event Buff", fnName: "R_calculateConsumableEventBuff", fnParams: [{ paramName: "buff", paramType: "EventBuffType" }], supportsReduce: !1, toolingSupport: !1 }, { calculationName: "Ambrosia Generation Shop Upgrade", fnName: "R_calculateAmbrosiaGenerationShopUpgrade", fnParams: [{ paramName: "reduce_vals", paramType: "boolean", defaultValue: !0 }], supportsReduce: !0, toolingSupport: !0 }, { calculationName: "Ambrosia Generation Singularity Upgrade", fnName: "R_calculateAmbrosiaGenerationSingularityUpgrade", fnParams: [{ paramName: "reduce_vals", paramType: "boolean", defaultValue: !0 }], supportsReduce: !0, toolingSupport: !0 }, { calculationName: "Ambrosia Generation Octeract Upgrade", fnName: "R_calculateAmbrosiaGenerationOcteractUpgrade", fnParams: [{ paramName: "reduce_vals", paramType: "boolean", defaultValue: !0 }], supportsReduce: !0, toolingSupport: !0 }, { calculationName: "Singularity Milestone Blueberries", fnName: "R_calculateSingularityMilestoneBlueberries", fnParams: [], supportsReduce: !1, toolingSupport: !0 }, { calculationName: "Dilated Five Leaf Bonus", fnName: "R_calculateDilatedFiveLeafBonus", fnParams: [], supportsReduce: !1, toolingSupport: !0 }, { calculationName: "Singularity Ambrosia Luck Milestone Bonus", fnName: "R_calculateSingularityAmbrosiaLuckMilestoneBonus", fnParams: [], supportsReduce: !1, toolingSupport: !0 }, { calculationName: "Ambrosia Luck Shop Upgrade", fnName: "R_calculateAmbrosiaLuckShopUpgrade", fnParams: [{ paramName: "reduce_vals", paramType: "boolean", defaultValue: !0 }], supportsReduce: !0, toolingSupport: !0 }, { calculationName: "Ambrosia Luck Singularity Upgrade", fnName: "R_calculateAmbrosiaLuckSingularityUpgrade", fnParams: [{ paramName: "reduce_vals", paramType: "boolean", defaultValue: !0 }], supportsReduce: !0, toolingSupport: !0 }, { calculationName: "Ambrosia Luck Octeract Upgrade", fnName: "R_calculateAmbrosiaLuckOcteractUpgrade", fnParams: [{ paramName: "reduce_vals", paramType: "boolean", defaultValue: !0 }], supportsReduce: !0, toolingSupport: !0 }, { calculationName: "Total Cubes", fnName: "R_calculateTotalCubes", fnParams: [], supportsReduce: !1, toolingSupport: !0 }, { calculationName: "Red Ambrosia Upgrade Value", fnName: "R_calculateRedAmbrosiaUpgradeValue", fnParams: [{ paramName: "upgradeName", paramType: "keyof RedAmbrosiaUpgrades" }], supportsReduce: !1, toolingSupport: !1 }, { calculationName: "Campaign Ambrosia Speed Bonus", fnName: "R_calculateCampaignAmbrosiaSpeedBonus", fnParams: [], supportsReduce: !1, toolingSupport: !0 }, { calculationName: "Campaign Luck Bonus", fnName: "R_calculateCampaignLuckBonus", fnParams: [], supportsReduce: !1, toolingSupport: !0 }, { calculationName: "Cookie Upgrade 29 Luck", fnName: "R_calculateCookieUpgrade29Luck", fnParams: [], supportsReduce: !1, toolingSupport: !0 }, { calculationName: "Sum Of Exalt Completions", fnName: "R_calculateSumOfExaltCompletions", fnParams: [], supportsReduce: !1, toolingSupport: !0 }, { calculationName: "Number Of Thresholds", fnName: "R_calculateNumberOfThresholds", fnParams: [], supportsReduce: !1, toolingSupport: !0 }, { calculationName: "To Next Threshold", fnName: "R_calculateToNextThreshold", fnParams: [], supportsReduce: !1, toolingSupport: !0 }, { calculationName: "Required Blueberry Time", fnName: "R_calculateRequiredBlueberryTime", fnParams: [], supportsReduce: !1, toolingSupport: !0 }, { calculationName: "Required Red Ambrosia Time", fnName: "R_calculateRequiredRedAmbrosiaTime", fnParams: [], supportsReduce: !1, toolingSupport: !0 }, { calculationName: "Corruption Total Level", fnName: "getCorruptionTotalLevel", fnParams: [], supportsReduce: !1, toolingSupport: !0 }, { calculationName: "Hepteract Effective", fnName: "R_calculateHepteractEffective", fnParams: [{ paramName: "heptType", paramType: "HepteractType" }], supportsReduce: !1, toolingSupport: !1 }, { calculationName: "Free Shop Infinity Upgrades", fnName: "R_calculateFreeShopInfinityUpgrades", fnParams: [{ paramName: "reduce_vals", paramType: "boolean", defaultValue: !0 }], supportsReduce: !0, toolingSupport: !0 }, { calculationName: "All Shop Tablets", fnName: "R_calculateAllShopTablets", fnParams: [{ paramName: "reduce_vals", paramType: "boolean", defaultValue: !0 }], supportsReduce: !0, toolingSupport: !0 }, { calculationName: "Limited Ascensions Debuff", fnName: "R_calculateLimitedAscensionsDebuff", fnParams: [], supportsReduce: !1, toolingSupport: !0 }, { calculationName: "Singularity Reductions", fnName: "R_calculateSingularityReductions", fnParams: [{ paramName: "reduce_vals", paramType: "boolean", defaultValue: !0 }], supportsReduce: !0, toolingSupport: !0 }, { calculationName: "Effective Singularities", fnName: "R_calculateEffectiveSingularities", fnParams: [{ paramName: "singularityCount", paramType: "number", defaultValue: -1 }], supportsReduce: !1, toolingSupport: !0 }, { calculationName: "Singularity Debuff", fnName: "R_calculateSingularityDebuff", fnParams: [{ paramName: "debuff", paramType: "SingularityDebuffs" }, { paramName: "singularityCount", paramType: "number", defaultValue: -1 }], supportsReduce: !1, toolingSupport: !1 }, { calculationName: "Ascension Speed Exponent Spread", fnName: "R_calculateAscensionSpeedExponentSpread", fnParams: [{ paramName: "reduce_vals", paramType: "boolean", defaultValue: !0 }], supportsReduce: !0, toolingSupport: !0 }, { calculationName: "Challenge 15 Reward", fnName: "calculateChallenge15Reward", fnParams: [{ paramName: "rewardName", paramType: "keyof typeof challenge15Rewards" }], supportsReduce: !1, toolingSupport: !1 }, { calculationName: "Raw Ascension Speed Mult", fnName: "R_calculateRawAscensionSpeedMult", fnParams: [{ paramName: "reduce_vals", paramType: "boolean", defaultValue: !0 }], supportsReduce: !0, toolingSupport: !0 }, { calculationName: "Ascension Speed Mult", fnName: "R_calculateAscensionSpeedMult", fnParams: [], supportsReduce: !1, toolingSupport: !0 }, { calculationName: "Ambrosia Speed", fnName: "calculateAmbrosiaSpeed", fnParams: [{ paramName: "reduce_vals", paramType: "boolean", defaultValue: !0 }], supportsReduce: !0, toolingSupport: !0 }, { calculationName: "Blueberries", fnName: "calculateBlueBerries", fnParams: [{ paramName: "reduce_vals", paramType: "boolean", defaultValue: !0 }], supportsReduce: !0, toolingSupport: !0 }, { calculationName: "Luck", fnName: "calculateLuck", fnParams: [{ paramName: "reduce_vals", paramType: "boolean", defaultValue: !0 }, { paramName: "true_base", paramType: "boolean", defaultValue: !1 }], supportsReduce: !0, toolingSupport: !0 }, { calculationName: "Luck Conversion", fnName: "R_calculateLuckConversion", fnParams: [{ paramName: "reduce_vals", paramType: "boolean", defaultValue: !0 }], supportsReduce: !0, toolingSupport: !0 }, { calculationName: "Red Ambrosia Luck", fnName: "R_calculateRedAmbrosiaLuck", fnParams: [{ paramName: "reduce_vals", paramType: "boolean", defaultValue: !0 }], supportsReduce: !0, toolingSupport: !0 }, { calculationName: "Golden Revolution", fnName: "calculateGoldenRevolution", fnParams: [], supportsReduce: !1, toolingSupport: !0 }, { calculationName: "Dump Data For Heater", fnName: "dumpDataForHeater", fnParams: [], supportsReduce: !1, toolingSupport: !1 }]; var Ye = class extends L { constructor(t) { super(t); this.isEvent = !1 } static { this.Calculations = It } async init() { let t = this; c.log("Initializing HSGameDataAPI module", this.context), this.isInitialized = !0 } _updateGameData(t) { this.gameData = t } _updateMeData(t) { this.meData = t } _updatePseudoData(t) { this.pseudoData = t } _updateCampaignData(t) { this.campaignData = t } _updateEventData(t) { this.eventData = t, this.eventData && "HAPPY_HOUR_BELL" in this.eventData && (this.isEvent = this.eventData.HAPPY_HOUR_BELL.amount > 0) } getCampaignData() { return this.campaignData } getGameData() { return this.gameData } getMeData() { return this.meData ? this.meData : { bonus: { quarkBonus: 0 }, globalBonus: 0, personalBonus: 0 } } getPseudoData() { return this.pseudoData } getEventData() { return this.eventData } static getCalculationDefinitions(t) { let a = r => { if (r) switch (r) { case "true": return l => l; case "false": return l => !l; case "both": return (...l) => !0 }return (...l) => !0 }, n = a(t?.supportsReduce), o = a(t?.toolingSupport); return this.Calculations.filter(r => n(r.supportsReduce) && o(r.toolingSupport)) } }; var kt = .15; var Tt = { ambrosiaTutorial: { costPerLevel: 1, maxLevel: 10, costFunction: (s, e) => e * ((s + 1) ** 2 - s ** 2), levelFunction: s => s }, ambrosiaQuarks1: { costPerLevel: 1, maxLevel: 100, costFunction: (s, e) => e * ((s + 1) ** 3 - s ** 3), levelFunction: s => s }, ambrosiaCubes1: { costPerLevel: 1, maxLevel: 100, costFunction: (s, e) => e * ((s + 1) ** 3 - s ** 3), levelFunction: s => s }, ambrosiaLuck1: { costPerLevel: 1, maxLevel: 100, costFunction: (s, e) => e * ((s + 1) ** 3 - s ** 3), levelFunction: s => s }, ambrosiaQuarkCube1: { costPerLevel: 250, maxLevel: 25, costFunction: (s, e) => e * ((s + 1) ** 3 - s ** 3), levelFunction: s => s }, ambrosiaLuckCube1: { costPerLevel: 250, maxLevel: 25, costFunction: (s, e) => e * ((s + 1) ** 3 - s ** 3), levelFunction: s => s }, ambrosiaCubeQuark1: { costPerLevel: 500, maxLevel: 25, costFunction: (s, e) => e * ((s + 1) ** 3 - s ** 3), levelFunction: s => s }, ambrosiaLuckQuark1: { costPerLevel: 500, maxLevel: 25, costFunction: (s, e) => e * ((s + 1) ** 3 - s ** 3), levelFunction: s => s }, ambrosiaCubeLuck1: { costPerLevel: 100, maxLevel: 25, costFunction: (s, e) => e * ((s + 1) ** 3 - s ** 3), levelFunction: s => s }, ambrosiaQuarkLuck1: { costPerLevel: 100, maxLevel: 25, costFunction: (s, e) => e * ((s + 1) ** 3 - s ** 3), levelFunction: s => s }, ambrosiaQuarks2: { costPerLevel: 500, maxLevel: 100, costFunction: (s, e) => e * ((s + 1) ** 2 - s ** 2), levelFunction: s => s }, ambrosiaCubes2: { costPerLevel: 500, maxLevel: 100, costFunction: (s, e) => e * ((s + 1) ** 2 - s ** 2), levelFunction: s => s }, ambrosiaLuck2: { costPerLevel: 250, maxLevel: 100, costFunction: (s, e) => e * ((s + 1) ** 2 - s ** 2), levelFunction: s => s }, ambrosiaQuarks3: { costPerLevel: 75e4, maxLevel: 10, costFunction: (s, e) => e + 5e4 * s, levelFunction: s => s }, ambrosiaCubes3: { costPerLevel: 75e3, maxLevel: 100, costFunction: (s, e) => e + 5e3 * s, levelFunction: s => s }, ambrosiaLuck3: { costPerLevel: 5e4, maxLevel: 100, costFunction: (s, e) => e, levelFunction: s => s }, ambrosiaLuck4: { costPerLevel: 25e4, maxLevel: 50, costFunction: (s, e) => e + 2e4 * s, levelFunction: s => s }, ambrosiaPatreon: { costPerLevel: 1, maxLevel: 1, costFunction: (s, e) => e * ((s + 1) ** 2 - s ** 2), levelFunction: s => s }, ambrosiaObtainium1: { costPerLevel: 5e4, maxLevel: 2, costFunction: (s, e) => e * 25 ** s, levelFunction: s => s }, ambrosiaOffering1: { costPerLevel: 5e4, maxLevel: 2, costFunction: (s, e) => e * 25 ** s, levelFunction: s => s }, ambrosiaHyperflux: { costPerLevel: 33333, maxLevel: 7, costFunction: (s, e) => (e + 33333 * Math.min(4, s)) * Math.max(1, 3 ** (s - 4)), levelFunction: s => s }, ambrosiaBaseOffering1: { costPerLevel: 5, maxLevel: 40, costFunction: (s, e) => e * ((s + 1) ** 3 - s ** 3), levelFunction: s => s }, ambrosiaBaseObtainium1: { costPerLevel: 40, maxLevel: 20, costFunction: (s, e) => e * ((s + 1) ** 3 - s ** 3), levelFunction: s => s }, ambrosiaBaseOffering2: { costPerLevel: 20, maxLevel: 60, costFunction: (s, e) => e * ((s + 1) ** 3 - s ** 3), levelFunction: s => s }, ambrosiaBaseObtainium2: { costPerLevel: 160, maxLevel: 30, costFunction: (s, e) => e * ((s + 1) ** 3 - s ** 3), levelFunction: s => s }, ambrosiaSingReduction1: { costPerLevel: 1e5, maxLevel: 2, costFunction: (s, e) => e * 99 ** s, levelFunction: s => s }, ambrosiaInfiniteShopUpgrades1: { costPerLevel: 25e3, maxLevel: 20, costFunction: (s, e) => e, levelFunction: s => s }, ambrosiaInfiniteShopUpgrades2: { costPerLevel: 75e3, maxLevel: 20, costFunction: (s, e) => e, levelFunction: s => s }, ambrosiaSingReduction2: { costPerLevel: 125e5, maxLevel: 2, costFunction: (s, e) => e * 3 ** s, levelFunction: s => s }, ambrosiaTalismanBonusRuneLevel: { costPerLevel: 100, maxLevel: 100, costFunction: (s, e) => e * ((s + 1) ** 2 - s ** 2), levelFunction: s => s }, ambrosiaRuneOOMBonus: { costPerLevel: 2500, maxLevel: 100, costFunction: (s, e) => Math.ceil(e * ((s + 1) ** 1.5 - s ** 1.5)), levelFunction: s => s } }, xt = { blueberryGenerationSpeed: { costPerLevel: 1, maxLevel: 100, costFunction: (s, e) => e * (s + 1), levelFunction: s => 1 + s / 500 }, blueberryGenerationSpeed2: { costPerLevel: 2e3, maxLevel: 500, costFunction: (s, e) => e + 0 * s, levelFunction: s => 1 + s / 1e3 }, freeLevelsRow2: { costPerLevel: 10, maxLevel: 5, costFunction: (s, e) => e * Math.pow(2, s), levelFunction: s => s }, freeLevelsRow3: { costPerLevel: 250, maxLevel: 5, costFunction: (s, e) => e * Math.pow(2, s), levelFunction: s => s }, freeLevelsRow4: { costPerLevel: 5e3, maxLevel: 5, costFunction: (s, e) => e * Math.pow(2, s), levelFunction: s => s }, freeLevelsRow5: { costPerLevel: 5e4, maxLevel: 5, costFunction: (s, e) => e * Math.pow(2, s), levelFunction: s => s }, regularLuck: { costPerLevel: 1, maxLevel: 100, costFunction: (s, e) => e * (s + 1), levelFunction: s => 2 * s }, regularLuck2: { costPerLevel: 2e3, maxLevel: 500, costFunction: (s, e) => e + 0 * s, levelFunction: s => 2 * s }, viscount: { costPerLevel: 99999, maxLevel: 1, costFunction: (s, e) => e * (s + 1), levelFunction: s => 125 * s }, tutorial: { costFunction: (s, e) => e + 0 * s, levelFunction: s => Math.pow(1.01, s), maxLevel: 100, costPerLevel: 1 }, conversionImprovement1: { costFunction: (s, e) => e * Math.pow(2, s), levelFunction: s => -s, maxLevel: 5, costPerLevel: 5 }, conversionImprovement2: { costFunction: (s, e) => e * Math.pow(4, s), levelFunction: s => -s, maxLevel: 3, costPerLevel: 200 }, conversionImprovement3: { costFunction: (s, e) => e * Math.pow(10, s), levelFunction: s => -s, maxLevel: 2, costPerLevel: 1e4 }, freeTutorialLevels: { costFunction: (s, e) => e + s, levelFunction: s => s, maxLevel: 5, costPerLevel: 1 }, redGenerationSpeed: { costFunction: (s, e) => e * (s + 1), levelFunction: s => 1 + 3 * s / 1e3, maxLevel: 100, costPerLevel: 12 }, redLuck: { costFunction: (s, e) => e * (s + 1), levelFunction: s => s, maxLevel: 100, costPerLevel: 4 }, redAmbrosiaCube: { costFunction: (s, e) => e * (s + 1), levelFunction: s => s, maxLevel: 1, costPerLevel: 500 }, redAmbrosiaObtainium: { costFunction: (s, e) => e * (s + 1), levelFunction: s => s, maxLevel: 1, costPerLevel: 1250 }, redAmbrosiaOffering: { costFunction: (s, e) => e * (s + 1), levelFunction: s => s, maxLevel: 1, costPerLevel: 4e3 }, redAmbrosiaCubeImprover: { costFunction: (s, e) => e * (s + 1), levelFunction: s => .01 * s, maxLevel: 20, costPerLevel: 100 }, infiniteShopUpgrades: { costFunction: (s, e) => e + 100 * s, levelFunction: s => s, maxLevel: 40, costPerLevel: 200 }, redAmbrosiaAccelerator: { costFunction: (s, e) => e + s * 0, levelFunction: s => .02 * s + (s > 0 ? 1 : 0), maxLevel: 100, costPerLevel: 1e3 } }, Ht = { chronos: { LIMIT: 1e3, DR: 1 / 6 }, hyperrealism: { LIMIT: 1e3, DR: .33 }, quark: { LIMIT: 1e3, DR: .5 }, challenge: { LIMIT: 1e3, DR: 1 / 6 }, abyss: { LIMIT: 1, DR: 0 }, accelerator: { LIMIT: 1e3, DR: .2 }, acceleratorBoost: { LIMIT: 1e3, DR: .2 }, multiplier: { LIMIT: 1e3, DR: .2 } }; var sa = (s, e, t) => 1 + (s - 1) * (1 - Math.pow(2, -e / t)), Dt = { cube1: s => 1 + 1 / 50 * Math.log2(s / 175), ascensions: s => 1 + 1 / 20 * Math.log2(s / 375), coinExponent: s => 1 + 1 / 150 * Math.log2(s / 750), taxes: s => Math.pow(.98, Math.log(s / 1250) / Math.log(2)), obtainium: s => 1 + 1 / 4 * Math.pow(s / 7500, .6), offering: s => 1 + 1 / 4 * Math.pow(s / 7500, .8), accelerator: s => 1 + 1 / 20 * Math.log(s / 2500) / Math.log(2), multiplier: s => 1 + 1 / 20 * Math.log(s / 2500) / Math.log(2), runeExp: s => 1 + Math.pow(s / 2e4, 1.5), runeBonus: s => 1 + 1 / 33 * Math.log(s / 1e4) / Math.log(2), cube2: s => 1 + 1 / 100 * Math.log(s / 15e3) / Math.log(2), transcendChallengeReduction: s => Math.pow(.98, Math.log(s / 25e3) / Math.log(2)), reincarnationChallengeReduction: s => Math.pow(.98, Math.log(s / 25e3) / Math.log(2)), antSpeed: s => Math.pow(1 + Math.log(s / 2e5) / Math.log(2), 4), bonusAntLevel: s => 1 + 1 / 20 * Math.log(s / 15e4) / Math.log(2), cube3: s => 1 + 1 / 150 * Math.log(s / 25e4) / Math.log(2), talismanBonus: s => 1 + 1 / 20 * Math.log(s / 75e4) / Math.log(2), globalSpeed: s => 1 + 1 / 20 * Math.log(s / 25e5) / Math.log(2), blessingBonus: s => 1 + 1 / 5 * Math.pow(s / 3e7, 1 / 4), constantBonus: s => 1 + 1 / 5 * Math.pow(s / 1e8, 2 / 3), cube4: s => 1 + 1 / 200 * Math.log(s / 125e6) / Math.log(2), spiritBonus: s => 1 + 1 / 5 * Math.pow(s / 2e9, 1 / 4), score: s => s >= 1e20 ? 1 + 1 / 4 * Math.pow(s / 1e10, 1 / 8) * Math.pow(1e10, 1 / 8) : 1 + 1 / 4 * Math.pow(s / 1e10, 1 / 4), quarks: s => 1 + 3 / 400 * Math.log2(s * 32 / 1e11), hepteractsUnlocked: s => s >= 1e15 ? 1 : 0, challengeHepteractUnlocked: s => s >= 2e15 ? 1 : 0, cube5: s => 1 + 1 / 300 * Math.log2(s / (4e15 / 1024)), powder: s => 1 + 1 / 50 * Math.log2(s / (7e15 / 32)), abyssHepteractUnlocked: s => s >= 1e16 ? 1 : 0, exponent: s => sa(1.05, s, 1e18), acceleratorHepteractUnlocked: s => s >= 333e14 ? 1 : 0, acceleratorBoostHepteractUnlocked: s => s >= 333e14 ? 1 : 0, multiplierHepteractUnlocked: s => s >= 333e14 ? 1 : 0, freeOrbs: s => Math.floor(200 * Math.pow(s / 2e17, .5)), ascensionSpeed: s => 1 + 5 / 100 + 2 * Math.log2(s / 15e17) / 100 }; var _e = [{ pointValue: 5, group: "ungrouped" }, { pointValue: 5, group: "firstOwnedCoin" }, { pointValue: 10, group: "firstOwnedCoin" }, { pointValue: 15, group: "firstOwnedCoin", reward: "{ acceleratorPower: () => 0.001 }" }, { pointValue: 20, group: "firstOwnedCoin" }, { pointValue: 25, group: "firstOwnedCoin", reward: "{ accelerators: () => Math.floor(player.firstOwnedCoin / 500) }" }, { pointValue: 30, group: "firstOwnedCoin", reward: "{ multipliers: () => Math.floor(player.firstOwnedCoin / 1000) }" }, { pointValue: 35, group: "firstOwnedCoin", reward: "{ accelBoosts: () => Math.floor(player.firstOwnedCoin / 2000) }" }, { pointValue: 5, group: "secondOwnedCoin" }, { pointValue: 10, group: "secondOwnedCoin" }, { pointValue: 15, group: "secondOwnedCoin", reward: "{ acceleratorPower: () => 0.0015 }" }, { pointValue: 20, group: "secondOwnedCoin" }, { pointValue: 25, group: "secondOwnedCoin", reward: "{ accelerators: () => Math.floor(player.secondOwnedCoin / 500) }" }, { pointValue: 30, group: "secondOwnedCoin", reward: "{ multipliers: () => Math.floor(player.secondOwnedCoin / 1000) }" }, { pointValue: 35, group: "secondOwnedCoin", reward: "{ accelBoosts: () => Math.floor(player.secondOwnedCoin / 2000) }" }, { pointValue: 5, group: "thirdOwnedCoin" }, { pointValue: 10, group: "thirdOwnedCoin" }, { pointValue: 15, group: "thirdOwnedCoin", reward: "{ acceleratorPower: () => 0.002 }" }, { pointValue: 20, group: "thirdOwnedCoin" }, { pointValue: 25, group: "thirdOwnedCoin", reward: "{ accelerators: () => Math.floor(player.thirdOwnedCoin / 500) }" }, { pointValue: 30, group: "thirdOwnedCoin", reward: "{ multipliers: () => Math.floor(player.thirdOwnedCoin / 1000) }" }, { pointValue: 35, group: "thirdOwnedCoin", reward: "{ accelBoosts: () => Math.floor(player.thirdOwnedCoin / 2000) }" }, { pointValue: 5, group: "fourthOwnedCoin" }, { pointValue: 10, group: "fourthOwnedCoin" }, { pointValue: 15, group: "fourthOwnedCoin", reward: "{ acceleratorPower: () => 0.002 }" }, { pointValue: 20, group: "fourthOwnedCoin" }, { pointValue: 25, group: "fourthOwnedCoin", reward: "{ accelerators: () => Math.floor(player.thirdOwnedCoin / 500) }" }, { pointValue: 30, group: "fourthOwnedCoin", reward: "{ multipliers: () => Math.floor(player.thirdOwnedCoin / 1000) }" }, { pointValue: 35, group: "fourthOwnedCoin", reward: "{ accelBoosts: () => Math.floor(player.thirdOwnedCoin / 2000) }" }, { pointValue: 5, group: "fifthOwnedCoin" }, { pointValue: 10, group: "fifthOwnedCoin" }, { pointValue: 15, group: "fifthOwnedCoin", reward: "{ acceleratorPower: () => 0.003 }" }, { pointValue: 20, group: "fifthOwnedCoin" }, { pointValue: 25, group: "fifthOwnedCoin", reward: "{ accelerators: () => Math.floor(player.fifthOwnedCoin / 500) }" }, { pointValue: 30, group: "fifthOwnedCoin", reward: "{ multipliers: () => Math.floor(player.fifthOwnedCoin / 1000) }" }, { pointValue: 35, group: "fifthOwnedCoin", reward: "{ accelBoosts: () => Math.floor(player.fifthOwnedCoin / 2000) }" }, { pointValue: 5, group: "prestigePointGain" }, { pointValue: 10, group: "prestigePointGain", reward: "{ crystalMultiplier: () => Math.max(1, Decimal.log(player.prestigePoints, Math.E)) }" }, { pointValue: 15, group: "prestigePointGain" }, { pointValue: 20, group: "prestigePointGain" }, { pointValue: 25, group: "prestigePointGain" }, { pointValue: 30, group: "prestigePointGain" }, { pointValue: 35, group: "prestigePointGain" }, { pointValue: 5, group: "transcendPointGain" }, { pointValue: 10, group: "transcendPointGain" }, { pointValue: 15, group: "transcendPointGain", reward: "{ taxReduction: () => 0.95 }" }, { pointValue: 20, group: "transcendPointGain", reward: "{ taxReduction: () => 0.95 }" }, { pointValue: 25, group: "transcendPointGain", reward: "{ taxReduction: () => 0.9 }" }, { pointValue: 30, group: "transcendPointGain" }, { pointValue: 35, group: "transcendPointGain" }, { pointValue: 5, group: "reincarnationPointGain", reward: "{ particleGain: () => 2 }" }, { pointValue: 10, group: "reincarnationPointGain" }, { pointValue: 15, group: "reincarnationPointGain" }, { pointValue: 20, group: "reincarnationPointGain" }, { pointValue: 25, group: "reincarnationPointGain" }, { pointValue: 30, group: "reincarnationPointGain" }, { pointValue: 35, group: "reincarnationPointGain" }, { pointValue: 5, group: "ungrouped", reward: "{ multipliers: () => 1 }" }, { pointValue: 10, group: "ungrouped", reward: "{ multipliers: () => 2 }" }, { pointValue: 15, group: "ungrouped", reward: "{ multipliers: () => 4 }" }, { pointValue: 20, group: "ungrouped", reward: "{ accelerators: () => 2 }" }, { pointValue: 25, group: "ungrouped", reward: "{ accelerators: () => 4 }" }, { pointValue: 30, group: "ungrouped", reward: "{ accelerators: () => 8 }" }, { pointValue: 35, group: "ungrouped" }, { pointValue: 5, group: "ungrouped" }, { pointValue: 10, group: "ungrouped" }, { pointValue: 15, group: "ungrouped" }, { pointValue: 15, group: "ungrouped" }, { pointValue: 20, group: "ungrouped" }, { pointValue: 30, group: "ungrouped" }, { pointValue: 40, group: "ungrouped" }, { pointValue: 10, group: "ungrouped", reward: "{ conversionExponent: () => 0.01 }" }, { pointValue: 10, group: "ungrouped", reward: "{ conversionExponent: () => 0.01 }" }, { pointValue: 15, group: "ungrouped", reward: "{ conversionExponent: () => 0.01 }" }, { pointValue: 20, group: "ungrouped", reward: "{ conversionExponent: () => 0.01 }" }, { pointValue: 25, group: "ungrouped", reward: "{ conversionExponent: () => 0.01 }" }, { pointValue: 25, group: "ungrouped", reward: "{ conversionExponent: () => 0.01 }" }, { pointValue: 50, group: "ungrouped", reward: "{ conversionExponent: () => 0.01 }" }, { pointValue: 5, group: "challenge1" }, { pointValue: 10, group: "challenge1" }, { pointValue: 15, group: "challenge1" }, { pointValue: 20, group: "challenge1" }, { pointValue: 25, group: "challenge1", reward: "{ taxReduction: () => 0.96 }" }, { pointValue: 30, group: "challenge1" }, { pointValue: 35, group: "challenge1" }, { pointValue: 5, group: "challenge2" }, { pointValue: 10, group: "challenge2" }, { pointValue: 15, group: "challenge2" }, { pointValue: 20, group: "challenge2" }, { pointValue: 25, group: "challenge2", reward: "{ taxReduction: () => 0.96 }" }, { pointValue: 30, group: "challenge2" }, { pointValue: 35, group: "challenge2" }, { pointValue: 5, group: "challenge3" }, { pointValue: 10, group: "challenge3" }, { pointValue: 15, group: "challenge3" }, { pointValue: 20, group: "challenge3" }, { pointValue: 25, group: "challenge3", reward: "{ taxReduction: () => 0.96 }" }, { pointValue: 30, group: "challenge3" }, { pointValue: 35, group: "challenge3" }, { pointValue: 5, group: "challenge4" }, { pointValue: 10, group: "challenge4" }, { pointValue: 15, group: "challenge4" }, { pointValue: 20, group: "challenge4" }, { pointValue: 25, group: "challenge4", reward: "{ taxReduction: () => 0.96 }" }, { pointValue: 30, group: "challenge4" }, { pointValue: 35, group: "challenge4" }, { pointValue: 5, group: "challenge5" }, { pointValue: 10, group: "challenge5" }, { pointValue: 15, group: "challenge5" }, { pointValue: 20, group: "challenge5" }, { pointValue: 25, group: "challenge5", reward: "{ taxReduction: () => 0.96 }" }, { pointValue: 30, group: "challenge5" }, { pointValue: 35, group: "challenge5" }, { pointValue: 5, group: "challenge6" }, { pointValue: 10, group: "challenge6" }, { pointValue: 15, group: "challenge6" }, { pointValue: 20, group: "challenge6" }, { pointValue: 25, group: "challenge6", reward: "{ taxReduction: () => 0.95 }" }, {
        pointValue: 30, group: "challenge6", reward: `{
      taxReduction: () =>
        Math.pow(
          0.9925,
          player.challengecompletions[6] + player.challengecompletions[7] + player.challengecompletions[8]
            + player.challengecompletions[9] + player.challengecompletions[10]
        )
    }`}, { pointValue: 35, group: "challenge6" }, { pointValue: 5, group: "challenge7", reward: "{ diamondUpgrade18: () => 0 }" }, { pointValue: 10, group: "challenge7" }, { pointValue: 15, group: "challenge7" }, { pointValue: 20, group: "challenge7" }, { pointValue: 25, group: "challenge7", reward: "{ taxReduction: () => 0.95 }" }, { pointValue: 30, group: "challenge7" }, { pointValue: 35, group: "challenge7", reward: "{ chronosTalisman: () => 1 }" }, { pointValue: 5, group: "challenge8", reward: "{ diamondUpgrade19: () => 1 }" }, { pointValue: 10, group: "challenge8" }, { pointValue: 15, group: "challenge8" }, { pointValue: 20, group: "challenge8" }, { pointValue: 25, group: "challenge8", reward: "{ taxReduction: () => 0.95 }" }, { pointValue: 30, group: "challenge8" }, { pointValue: 35, group: "challenge8", reward: "{ midasTalisman: () => 1 }" }, { pointValue: 5, group: "challenge9", reward: "{ diamondUpgrade20: () => 1 }" }, { pointValue: 10, group: "challenge9", reward: "{ talismanPower: () => 0.02 }" }, { pointValue: 15, group: "challenge9", reward: "{ talismanPower: () => 0.02 }" }, { pointValue: 20, group: "challenge9", reward: "{ sacrificeMult: () => 1.25, experientiaAutobuy: () => 1 }" }, { pointValue: 25, group: "challenge9" }, { pointValue: 30, group: "challenge9" }, { pointValue: 35, group: "challenge9", reward: "{ metaphysicsTalisman: () => 1 }" }, { pointValue: 5, group: "challenge10" }, { pointValue: 10, group: "challenge10" }, { pointValue: 15, group: "challenge10" }, { pointValue: 20, group: "challenge10", reward: "{ talismanPower: () => 0.025 }" }, { pointValue: 25, group: "challenge10", reward: "{ talismanPower: () => 0.025 }" }, { pointValue: 30, group: "challenge10" }, { pointValue: 35, group: "challenge10", reward: "{ polymathTalisman: () => 1 }" }, { pointValue: 5, group: "accelerators" }, { pointValue: 10, group: "accelerators", reward: "{ acceleratorPower: () => 0.01 }" }, { pointValue: 15, group: "accelerators" }, { pointValue: 20, group: "accelerators", reward: "{ accelerators: () => 5 }" }, { pointValue: 25, group: "accelerators", reward: "{ accelerators: () => 12 }" }, { pointValue: 30, group: "accelerators", reward: "{ accelerators: () => 25 }" }, { pointValue: 35, group: "accelerators", reward: "{ accelerators: () => 50 }" }, { pointValue: 5, group: "multipliers" }, { pointValue: 10, group: "multipliers", reward: "{ multipliers: () => 1 }" }, { pointValue: 15, group: "multipliers" }, { pointValue: 20, group: "multipliers", reward: "{ multipliers: () => 1 }" }, { pointValue: 25, group: "multipliers", reward: "{ multipliers: () => 3 }" }, { pointValue: 30, group: "multipliers", reward: "{ multipliers: () => 6 }" }, { pointValue: 35, group: "multipliers", reward: "{ multipliers: () => 10 }" }, { pointValue: 5, group: "acceleratorBoosts" }, { pointValue: 10, group: "acceleratorBoosts" }, { pointValue: 15, group: "acceleratorBoosts" }, { pointValue: 20, group: "acceleratorBoosts" }, { pointValue: 25, group: "acceleratorBoosts" }, { pointValue: 30, group: "acceleratorBoosts" }, { pointValue: 35, group: "acceleratorBoosts" }, { pointValue: 5, group: "antCrumbs", reward: "{ antSpeed: () => Decimal.log(player.ants.crumbs.plus(10), 10) }" }, { pointValue: 10, group: "antCrumbs" }, { pointValue: 15, group: "antCrumbs", reward: "{ antSpeed: () => 1.2 }" }, { pointValue: 20, group: "antCrumbs", reward: "{ antSpeed: () => 1.25 }" }, { pointValue: 25, group: "antCrumbs", reward: "{ antSpeed: () => 1.4, antSacrificeUnlock: () => 1, antAutobuyers: () => 1 }" }, { pointValue: 30, group: "antCrumbs", reward: "{ antSpeed: () => 1 + player.ants.immortalELO / 1000, scientiaAutobuy: () => 1 }" }, { pointValue: 35, group: "antCrumbs" }, { pointValue: 5, group: "sacMult", reward: "{ antAutobuyers: () => 1, inceptusAutobuy: () => 1, fortunaeAutobuy: () => 1 }" }, { pointValue: 10, group: "sacMult", reward: "{ antAutobuyers: () => 1, tributumAutobuy: () => 1 }" }, { pointValue: 15, group: "sacMult", reward: "{ antAutobuyers: () => 1, celeritasAutobuy: () => 1, exploratoremAutobuy: () => 1 }" }, { pointValue: 20, group: "sacMult", reward: "{ antAutobuyers: () => 1, sacrificiumAutobuy: () => 1 }" }, { pointValue: 25, group: "sacMult", reward: "{ antAutobuyers: () => 1 }" }, { pointValue: 30, group: "sacMult", reward: "{ antAutobuyers: () => 1 }" }, { pointValue: 35, group: "sacMult", reward: "{ antAutobuyers: () => 1 }" }, { pointValue: 5, group: "ascensionCount", reward: "{ freeAntUpgrades: () => 2 }" }, { pointValue: 10, group: "ascensionCount", reward: "{ preserveAnthillCount: () => 1, antSacrificeCountMultiplier: () => 2 }" }, { pointValue: 15, group: "ascensionCount" }, { pointValue: 20, group: "ascensionCount", reward: "{ wowSquareTalisman: () => 1 }" }, {
        pointValue: 25, group: "ascensionCount", reward: `{
      ascensionCountMultiplier: () => Math.log10(calculateAscensionScore().effectiveScore + 100) - 1
    }`}, {
        pointValue: 30, group: "ascensionCount", reward: `{
      ascensionCountAdditive: () => (player.ascensionCounter > 10) ? 100 : 0
    }`}, {
        pointValue: 35, group: "ascensionCount", reward: `{
      ascensionCountAdditive: () => (player.ascensionCounter > 10) ? player.ascensionCounterReal * 2 : 0,
      wowCubeGain: () => 1 + 2 * Math.min(1, player.ascensionCount / 5e8)
    }`}, { pointValue: 5, group: "constant" }, { pointValue: 10, group: "constant" }, { pointValue: 15, group: "constant" }, { pointValue: 20, group: "constant", reward: "{ wowCubeGain: () => 1 + Decimal.log(player.ascendShards.add(1), 10) / 400 }" }, { pointValue: 25, group: "constant" }, {
        pointValue: 30, group: "constant", reward: `{
      wowCubeGain: () => 1 + 249 * Math.min(1, Decimal.log(player.ascendShards.plus(1), 10) / 100000),
      wowTesseractGain: () => 1 + 249 * Math.min(1, Decimal.log(player.ascendShards.plus(1), 10) / 100000)
    }`}, { pointValue: 35, group: "constant", reward: "{ wowPlatonicGain: () => 1 + 19 * Math.min(1, Decimal.log(player.ascendShards.plus(1), 10) / 100000) }" }, { pointValue: 10, group: "challenge11", reward: "{ statTracker: () => 1 }" }, { pointValue: 20, group: "challenge11" }, { pointValue: 30, group: "challenge11" }, { pointValue: 40, group: "challenge11" }, { pointValue: 50, group: "challenge11" }, { pointValue: 60, group: "challenge11", reward: "{ ascensionCountAdditive: () => player.ascensionCounter * 2 }" }, { pointValue: 70, group: "challenge11", reward: "{ talismanPower: () => 0.01 }" }, { pointValue: 10, group: "challenge12", reward: "{ ascensionRewardScaling: () => 1 }" }, { pointValue: 20, group: "challenge12" }, { pointValue: 30, group: "challenge12" }, { pointValue: 40, group: "challenge12" }, { pointValue: 50, group: "challenge12" }, { pointValue: 60, group: "challenge12", reward: "{ ascensionCountAdditive: () => player.ascensionCounter * 2 }" }, { pointValue: 70, group: "challenge12", reward: "{ talismanPower: () => 0.01 }" }, { pointValue: 10, group: "challenge13" }, { pointValue: 20, group: "challenge13" }, { pointValue: 30, group: "challenge13" }, { pointValue: 40, group: "challenge13" }, { pointValue: 50, group: "challenge13" }, { pointValue: 60, group: "challenge13", reward: "{ ascensionCountAdditive: () => player.ascensionCounter * 2 }" }, { pointValue: 70, group: "challenge13", reward: "{ talismanPower: () => 0.01 }" }, { pointValue: 10, group: "challenge14" }, { pointValue: 20, group: "challenge14" }, { pointValue: 30, group: "challenge14" }, { pointValue: 40, group: "challenge14" }, { pointValue: 50, group: "challenge14" }, {
        pointValue: 60, group: "challenge14", reward: `{
      ascensionCountAdditive: () => player.ascensionCounter * 2,
      wowPlatonicGain: () => 1 + 2 * Math.min(1, player.ascensionCount / 2.674e9)
    }`}, { pointValue: 70, group: "challenge14" }, { pointValue: 5, group: "ascensionScore" }, { pointValue: 10, group: "ascensionScore" }, { pointValue: 15, group: "ascensionScore" }, { pointValue: 20, group: "ascensionScore" }, { pointValue: 25, group: "ascensionScore" }, { pointValue: 30, group: "ascensionScore" }, { pointValue: 35, group: "ascensionScore" }, { pointValue: 10, group: "speedBlessing" }, { pointValue: 20, group: "speedBlessing" }, { pointValue: 30, group: "speedBlessing" }, { pointValue: 10, group: "speedSpirit" }, { pointValue: 20, group: "speedSpirit" }, { pointValue: 30, group: "speedSpirit" }, { pointValue: 50, group: "ungrouped" }, { pointValue: 50, group: "ungrouped" }, { pointValue: 50, group: "ungrouped" }, { pointValue: 50, group: "ungrouped" }, { pointValue: 50, group: "ungrouped" }, { pointValue: 50, group: "ungrouped" }, { pointValue: 50, group: "ungrouped" }, { pointValue: 50, group: "ungrouped" }, { pointValue: 50, group: "ungrouped" }, { pointValue: 50, group: "ungrouped" }, { pointValue: 50, group: "ungrouped" }, { pointValue: 50, group: "ungrouped" }, {
        pointValue: 100, group: "ungrouped", reward: `{
      quarkGain: () => 1.05
    }`}, {
        pointValue: 150, group: "ungrouped", reward: `{
      quarkGain: () => 1.05
    }`}, { pointValue: 50, group: "ungrouped" }, { pointValue: 40, group: "ascensionScore", reward: "{ wowHypercubeGain: () => 1.1 }" }, { pointValue: 45, group: "ascensionScore", reward: "{ wowCubeGain: () => 1.1 }" }, { pointValue: 50, group: "ascensionScore", reward: "{ wowTesseractGain: () => 1.1 }" }, { pointValue: 55, group: "ascensionScore", reward: "{ wowPlatonicGain: () => 1.1, overfluxConversionRate: () => 1.05 }" }, { pointValue: 60, group: "ascensionScore", reward: "{ overfluxConversionRate: () => 1.05 }" }, { pointValue: 65, group: "ascensionScore", reward: "{ wowHepteractGain: () => 1.1 }" }, { pointValue: 70, group: "ascensionScore", reward: "{ ascensionScore: () => Math.pow(1.01, hepteracts.abyss.TIMES_CAP_EXTENDED) }" }, { pointValue: 40, group: "ascensionCount", reward: "{ ascensionCountMultiplier: () => 1.1 }" }, { pointValue: 45, group: "ascensionCount", reward: "{ ascensionCountMultiplier: () => 1.1 }" }, { pointValue: 50, group: "ascensionCount" }, { pointValue: 55, group: "ascensionCount" }, { pointValue: 60, group: "ascensionCount" }, { pointValue: 65, group: "ascensionCount" }, { pointValue: 70, group: "ascensionCount", reward: "{ quarkGain: () => 1 + 0.1 * Math.min(player.ascensionCount / 1e15, 1) }" }, { pointValue: 40, group: "constant", reward: "{ ascensionScore: () => 1 + Math.min(Decimal.log(player.ascendShards.add(1), 10) / 1e5, 1) }" }, { pointValue: 45, group: "constant" }, { pointValue: 50, group: "constant" }, {
        pointValue: 55, group: "constant", reward: `{
      wowHepteractGain: () => 1 + Math.min(Decimal.log(player.ascendShards.add(1), 10) / 1e6, 1),
      constUpgrade1Buff: () => 0.01,
      constUpgrade2Buff: () => 0.01
    }`}, { pointValue: 60, group: "constant", reward: "{ platonicToHypercubes: () => Math.min(1, Decimal.log(player.ascendShards.add(1), 10) / 1e6) }" }, { pointValue: 65, group: "constant" }, { pointValue: 70, group: "constant" }, { pointValue: 10, group: "singularityCount" }, { pointValue: 20, group: "singularityCount" }, { pointValue: 30, group: "singularityCount" }, { pointValue: 40, group: "singularityCount" }, { pointValue: 50, group: "singularityCount" }, { pointValue: 60, group: "singularityCount" }, { pointValue: 70, group: "singularityCount" }, { pointValue: 40, group: "firstOwnedCoin" }, { pointValue: 45, group: "firstOwnedCoin" }, { pointValue: 50, group: "firstOwnedCoin" }, { pointValue: 40, group: "secondOwnedCoin" }, { pointValue: 45, group: "secondOwnedCoin" }, { pointValue: 50, group: "secondOwnedCoin" }, { pointValue: 40, group: "thirdOwnedCoin" }, { pointValue: 45, group: "thirdOwnedCoin" }, { pointValue: 50, group: "thirdOwnedCoin" }, { pointValue: 40, group: "fourthOwnedCoin" }, { pointValue: 45, group: "fourthOwnedCoin" }, { pointValue: 50, group: "fourthOwnedCoin" }, { pointValue: 40, group: "fifthOwnedCoin" }, { pointValue: 45, group: "fifthOwnedCoin" }, { pointValue: 50, group: "fifthOwnedCoin" }, { pointValue: 40, group: "prestigePointGain" }, { pointValue: 45, group: "prestigePointGain" }, { pointValue: 50, group: "prestigePointGain" }, { pointValue: 40, group: "transcendPointGain" }, { pointValue: 45, group: "transcendPointGain" }, { pointValue: 50, group: "transcendPointGain" }, { pointValue: 40, group: "reincarnationPointGain" }, { pointValue: 45, group: "reincarnationPointGain" }, { pointValue: 50, group: "reincarnationPointGain" }, { pointValue: 40, group: "challenge1" }, { pointValue: 45, group: "challenge1" }, { pointValue: 50, group: "challenge1" }, { pointValue: 40, group: "challenge2" }, { pointValue: 45, group: "challenge2" }, { pointValue: 50, group: "challenge2" }, { pointValue: 40, group: "challenge3" }, { pointValue: 45, group: "challenge3" }, { pointValue: 50, group: "challenge3" }, { pointValue: 40, group: "challenge4" }, { pointValue: 45, group: "challenge4" }, { pointValue: 50, group: "challenge4" }, { pointValue: 40, group: "challenge5" }, { pointValue: 45, group: "challenge5" }, { pointValue: 50, group: "challenge5" }, { pointValue: 40, group: "challenge6" }, { pointValue: 45, group: "challenge6" }, { pointValue: 50, group: "challenge6" }, { pointValue: 40, group: "challenge7" }, { pointValue: 45, group: "challenge7" }, { pointValue: 50, group: "challenge7" }, { pointValue: 40, group: "challenge8" }, { pointValue: 45, group: "challenge8" }, { pointValue: 50, group: "challenge8" }, { pointValue: 40, group: "challenge9" }, { pointValue: 45, group: "challenge9" }, { pointValue: 50, group: "challenge9" }, { pointValue: 40, group: "challenge10" }, { pointValue: 45, group: "challenge10" }, { pointValue: 50, group: "challenge10" }, { pointValue: 40, group: "accelerators" }, { pointValue: 45, group: "accelerators" }, { pointValue: 50, group: "accelerators" }, { pointValue: 40, group: "multipliers" }, { pointValue: 45, group: "multipliers" }, { pointValue: 50, group: "multipliers" }, { pointValue: 40, group: "acceleratorBoosts" }, { pointValue: 45, group: "acceleratorBoosts" }, { pointValue: 50, group: "acceleratorBoosts" }, { pointValue: 40, group: "antCrumbs" }, { pointValue: 45, group: "antCrumbs" }, { pointValue: 50, group: "antCrumbs" }, { pointValue: 40, group: "sacMult" }, { pointValue: 45, group: "sacMult" }, { pointValue: 50, group: "sacMult", reward: "{ antAutobuyers: () => 1 }" }, { pointValue: 75, group: "ascensionCount" }, { pointValue: 80, group: "ascensionCount" }, { pointValue: 85, group: "ascensionCount" }, { pointValue: 90, group: "ascensionCount" }, { pointValue: 95, group: "ascensionCount" }, { pointValue: 100, group: "ascensionCount" }, { pointValue: 75, group: "constant" }, { pointValue: 80, group: "constant" }, { pointValue: 85, group: "constant" }, { pointValue: 90, group: "constant" }, { pointValue: 95, group: "constant" }, { pointValue: 100, group: "constant" }, { pointValue: 80, group: "challenge11" }, { pointValue: 90, group: "challenge11" }, { pointValue: 100, group: "challenge11" }, { pointValue: 110, group: "challenge11" }, { pointValue: 120, group: "challenge11" }, { pointValue: 80, group: "challenge12" }, { pointValue: 90, group: "challenge12" }, { pointValue: 100, group: "challenge12" }, { pointValue: 110, group: "challenge12" }, { pointValue: 120, group: "challenge12" }, { pointValue: 80, group: "challenge13" }, { pointValue: 90, group: "challenge13" }, { pointValue: 100, group: "challenge13" }, { pointValue: 110, group: "challenge13" }, { pointValue: 120, group: "challenge13" }, { pointValue: 80, group: "challenge14" }, { pointValue: 90, group: "challenge14" }, { pointValue: 100, group: "challenge14" }, { pointValue: 110, group: "challenge14" }, { pointValue: 120, group: "challenge14" }, { pointValue: 40, group: "speedBlessing" }, { pointValue: 50, group: "speedBlessing" }, { pointValue: 60, group: "speedBlessing" }, { pointValue: 70, group: "speedBlessing" }, { pointValue: 80, group: "speedBlessing" }, { pointValue: 90, group: "speedBlessing" }, { pointValue: 100, group: "speedBlessing" }, { pointValue: 40, group: "speedSpirit" }, { pointValue: 50, group: "speedSpirit" }, { pointValue: 60, group: "speedSpirit" }, { pointValue: 70, group: "speedSpirit" }, { pointValue: 80, group: "speedSpirit" }, { pointValue: 90, group: "speedSpirit" }, { pointValue: 100, group: "speedSpirit" }, { pointValue: 2, group: "runeLevel" }, { pointValue: 4, group: "runeLevel" }, { pointValue: 6, group: "runeLevel" }, { pointValue: 8, group: "runeLevel" }, { pointValue: 10, group: "runeLevel" }, { pointValue: 12, group: "runeLevel" }, { pointValue: 14, group: "runeLevel" }, { pointValue: 16, group: "runeLevel" }, { pointValue: 18, group: "runeLevel" }, { pointValue: 20, group: "runeLevel" }, { pointValue: 22, group: "runeLevel" }, { pointValue: 24, group: "runeLevel" }, { pointValue: 26, group: "runeLevel" }, { pointValue: 28, group: "runeLevel" }, { pointValue: 30, group: "runeLevel" }, { pointValue: 2, group: "runeFreeLevel" }, { pointValue: 4, group: "runeFreeLevel" }, { pointValue: 6, group: "runeFreeLevel" }, { pointValue: 8, group: "runeFreeLevel" }, { pointValue: 10, group: "runeFreeLevel" }, { pointValue: 12, group: "runeFreeLevel" }, { pointValue: 14, group: "runeFreeLevel" }, { pointValue: 16, group: "runeFreeLevel" }, { pointValue: 18, group: "runeFreeLevel" }, { pointValue: 20, group: "runeFreeLevel" }, { pointValue: 22, group: "runeFreeLevel" }, { pointValue: 24, group: "runeFreeLevel" }, { pointValue: 26, group: "runeFreeLevel" }, { pointValue: 28, group: "runeFreeLevel" }, { pointValue: 30, group: "runeFreeLevel" }, { pointValue: 5, group: "campaignTokens" }, { pointValue: 10, group: "campaignTokens" }, { pointValue: 15, group: "campaignTokens" }, { pointValue: 20, group: "campaignTokens" }, { pointValue: 25, group: "campaignTokens" }, { pointValue: 30, group: "campaignTokens" }, { pointValue: 35, group: "campaignTokens" }, { pointValue: 40, group: "campaignTokens" }, { pointValue: 45, group: "campaignTokens" }, { pointValue: 50, group: "campaignTokens" }, { pointValue: 2, group: "prestigeCount" }, { pointValue: 4, group: "prestigeCount", reward: "{ prestigeCountMultiplier: () => Math.max(1, 1 + Math.floor(Math.log10(player.prestigeCount))) }" }, { pointValue: 6, group: "prestigeCount", reward: "{ duplicationRuneUnlock: () => 1 }" }, { pointValue: 8, group: "prestigeCount", reward: "{ offeringBonus: () => 1 + 0.02 * Math.max(1, 1 + Math.floor(Math.log10(player.prestigeCount))) }" }, { pointValue: 10, group: "prestigeCount" }, { pointValue: 12, group: "prestigeCount" }, { pointValue: 14, group: "prestigeCount", reward: "{ transcendToPrestige: () => 1 }" }, { pointValue: 16, group: "prestigeCount" }, { pointValue: 18, group: "prestigeCount", reward: "{ transcensionCountMultiplier: () => Math.min(4, 1.25 + 2.75 * Math.floor(player.prestigecounter / 10)) }" }, { pointValue: 20, group: "prestigeCount" }, { pointValue: 22, group: "prestigeCount" }, { pointValue: 24, group: "prestigeCount" }, { pointValue: 26, group: "prestigeCount" }, { pointValue: 28, group: "prestigeCount" }, { pointValue: 30, group: "prestigeCount" }, { pointValue: 3, group: "transcensionCount" }, { pointValue: 6, group: "transcensionCount", reward: "{ transcensionCountMultiplier: () => Math.max(1, 1 + Math.floor(Math.log10(player.transcendCount))) }" }, { pointValue: 9, group: "transcensionCount", reward: "{ salvage: () => 2 * Math.max(1, 1 + Math.floor(Math.log10(player.transcendCount))) }" }, { pointValue: 12, group: "transcensionCount", reward: "{ prismRuneUnlock: () => 1 }" }, { pointValue: 15, group: "transcensionCount" }, { pointValue: 18, group: "transcensionCount" }, { pointValue: 21, group: "transcensionCount", reward: "{ reincarnationToTranscend: () => 1 }" }, { pointValue: 24, group: "transcensionCount" }, { pointValue: 27, group: "transcensionCount", reward: "{ reincarnationCountMultiplier: () => Math.min(4, 1.25 + 2.75 * Math.floor(player.prestigecounter / 1000)) }" }, { pointValue: 30, group: "transcensionCount" }, { pointValue: 33, group: "transcensionCount" }, { pointValue: 36, group: "transcensionCount" }, { pointValue: 39, group: "transcensionCount" }, { pointValue: 42, group: "transcensionCount" }, { pointValue: 45, group: "transcensionCount" }, { pointValue: 4, group: "reincarnationCount" }, { pointValue: 8, group: "reincarnationCount", reward: "{ reincarnationCountMultiplier: () => Math.max(1, 1 + Math.floor(Math.log10(player.reincarnationCount))) }" }, { pointValue: 12, group: "reincarnationCount", reward: "{ obtainiumBonus: () => 1 + 0.02 * Math.max(1, 1 + Math.floor(Math.log10(player.reincarnationCount))) }" }, { pointValue: 16, group: "reincarnationCount" }, { pointValue: 20, group: "reincarnationCount", reward: "{ thriftRuneUnlock: () => 1 }" }, { pointValue: 24, group: "reincarnationCount" }, { pointValue: 28, group: "reincarnationCount" }, { pointValue: 32, group: "reincarnationCount" }, {
        pointValue: 36, group: "reincarnationCount", reward: `{
      prestigeCountMultiplier: () => Math.min(4, 1.25 + 2.75 * Math.floor(player.prestigecounter / 1e6)),
      ascensionCountMultiplier: () => Math.min(1.25, 1 + 0.25 * Math.floor(player.ascensionCounter / 1e6))
    }`}, { pointValue: 40, group: "reincarnationCount" }, { pointValue: 44, group: "reincarnationCount" }, { pointValue: 48, group: "reincarnationCount" }, { pointValue: 52, group: "reincarnationCount" }, { pointValue: 56, group: "reincarnationCount" }, { pointValue: 60, group: "reincarnationCount" }, { pointValue: 3, group: "sacCount", reward: "{ freeAntUpgrades: () => 1 }" }, { pointValue: 6, group: "sacCount", reward: "{ antSacrificeCountMultiplier: () => 2, hicAutobuy: () => 1 }" }, { pointValue: 9, group: "sacCount", reward: "{ autoAntSacrifice: () => 1 }" }, { pointValue: 12, group: "sacCount", reward: "{ antELOAdditiveMultiplier: () => 0.01, praemoenioAutobuy: () => 1 }" }, { pointValue: 15, group: "sacCount", reward: "{ antELOAdditive: () => 25 }" }, { pointValue: 17, group: "sacCount", reward: "{ antSpeed2UpgradeImprover: () => achievementLevel, phylacteriumAutobuy: () => 1 }" }, { pointValue: 19, group: "sacCount" }, { pointValue: 21, group: "sacCount" }, { pointValue: 23, group: "sacCount" }, { pointValue: 25, group: "sacCount", reward: "{ preserveAnthillCountSingularity: () => 1 }" }, { pointValue: 40, group: "sacCount" }]; var oe = class extends Ye {
        constructor(t) { super(t); this.#e = { R_AmbrosiaGenerationShopUpgrade: { value: void 0, cachedBy: [] }, R_AmbrosiaGenerationSingularityUpgrade: { value: void 0, cachedBy: [] }, R_AmbrosiaGenerationOcteractUpgrade: { value: void 0, cachedBy: [] }, R_SingularityMilestoneBlueberries: { value: void 0, cachedBy: [] }, R_DilatedFiveLeafBonus: { value: void 0, cachedBy: [] }, R_SingularityAmbrosiaLuckMilestoneBonus: { value: void 0, cachedBy: [] }, R_AmbrosiaLuckShopUpgrade: { value: void 0, cachedBy: [] }, R_AmbrosiaLuckSingularityUpgrade: { value: void 0, cachedBy: [] }, R_AmbrosiaLuckOcteractUpgrade: { value: void 0, cachedBy: [] }, R_TotalCubes: { value: void 0, cachedBy: [] }, AMB_ambrosiaTutorial: { value: void 0, cachedBy: [] }, AMB_ambrosiaQuarks1: { value: void 0, cachedBy: [] }, AMB_ambrosiaCubes1: { value: void 0, cachedBy: [] }, AMB_ambrosiaLuck1: { value: void 0, cachedBy: [] }, AMB_ambrosiaQuarkCube1: { value: void 0, cachedBy: [] }, AMB_ambrosiaLuckCube1: { value: void 0, cachedBy: [] }, AMB_ambrosiaCubeQuark1: { value: void 0, cachedBy: [] }, AMB_ambrosiaLuckQuark1: { value: void 0, cachedBy: [] }, AMB_ambrosiaCubeLuck1: { value: void 0, cachedBy: [] }, AMB_ambrosiaQuarkLuck1: { value: void 0, cachedBy: [] }, AMB_ambrosiaQuarks2: { value: void 0, cachedBy: [] }, AMB_ambrosiaCubes2: { value: void 0, cachedBy: [] }, AMB_ambrosiaLuck2: { value: void 0, cachedBy: [] }, AMB_ambrosiaQuarks3: { value: void 0, cachedBy: [] }, AMB_ambrosiaCubes3: { value: void 0, cachedBy: [] }, AMB_ambrosiaLuck3: { value: void 0, cachedBy: [] }, AMB_ambrosiaLuck4: { value: void 0, cachedBy: [] }, AMB_ambrosiaPatreon: { value: void 0, cachedBy: [] }, AMB_ambrosiaObtainium1: { value: void 0, cachedBy: [] }, AMB_ambrosiaOffering1: { value: void 0, cachedBy: [] }, AMB_ambrosiaHyperflux: { value: void 0, cachedBy: [] }, AMB_ambrosiaBaseOffering1: { value: void 0, cachedBy: [] }, AMB_ambrosiaBaseObtainium1: { value: void 0, cachedBy: [] }, AMB_ambrosiaBaseOffering2: { value: void 0, cachedBy: [] }, AMB_ambrosiaBaseObtainium2: { value: void 0, cachedBy: [] }, AMB_ambrosiaSingReduction1: { value: void 0, cachedBy: [] }, AMB_ambrosiaSingReduction2: { value: void 0, cachedBy: [] }, AMB_ambrosiaInfiniteShopUpgrades1: { value: void 0, cachedBy: [] }, AMB_ambrosiaInfiniteShopUpgrades2: { value: void 0, cachedBy: [] }, AMB_ambrosiaTalismanBonusRuneLevel: { value: void 0, cachedBy: [] }, AMB_ambrosiaRuneOOMBonus: { value: void 0, cachedBy: [] }, REDAMB_blueberryGenerationSpeed: { value: void 0, cachedBy: [] }, REDAMB_blueberryGenerationSpeed2: { value: void 0, cachedBy: [] }, REDAMB_freeLevelsRow2: { value: void 0, cachedBy: [] }, REDAMB_freeLevelsRow3: { value: void 0, cachedBy: [] }, REDAMB_freeLevelsRow4: { value: void 0, cachedBy: [] }, REDAMB_freeLevelsRow5: { value: void 0, cachedBy: [] }, REDAMB_regularLuck: { value: void 0, cachedBy: [] }, REDAMB_regularLuck2: { value: void 0, cachedBy: [] }, REDAMB_viscount: { value: void 0, cachedBy: [] }, R_CampaignAmbrosiaSpeedBonus: { value: void 0, cachedBy: [] }, R_CampaignLuckBonus: { value: void 0, cachedBy: [] }, R_CookieUpgrade29Luck: { value: void 0, cachedBy: [] }, R_SumOfExaltCompletions: { value: void 0, cachedBy: [] }, R_NumberOfThresholds: { value: void 0, cachedBy: [] }, R_ToNextThreshold: { value: void 0, cachedBy: [] }, R_RequiredBlueberryTime: { value: void 0, cachedBy: [] }, R_RequiredRedAmbrosiaTime: { value: void 0, cachedBy: [] }, EVENTBUFF_Quark: { value: void 0, cachedBy: [] }, EVENTBUFF_GoldenQuark: { value: void 0, cachedBy: [] }, EVENTBUFF_Cubes: { value: void 0, cachedBy: [] }, EVENTBUFF_PowderConversion: { value: void 0, cachedBy: [] }, EVENTBUFF_AscensionSpeed: { value: void 0, cachedBy: [] }, EVENTBUFF_GlobalSpeed: { value: void 0, cachedBy: [] }, EVENTBUFF_AscensionScore: { value: void 0, cachedBy: [] }, EVENTBUFF_AntSacrifice: { value: void 0, cachedBy: [] }, EVENTBUFF_Offering: { value: void 0, cachedBy: [] }, EVENTBUFF_Obtainium: { value: void 0, cachedBy: [] }, EVENTBUFF_Octeract: { value: void 0, cachedBy: [] }, EVENTBUFF_BlueberryTime: { value: void 0, cachedBy: [] }, EVENTBUFF_AmbrosiaLuck: { value: void 0, cachedBy: [] }, EVENTBUFF_OneMind: { value: void 0, cachedBy: [] }, R_RawAscensionSpeedMult: { value: void 0, cachedBy: [] }, R_HepteractEffective: { value: void 0, cachedBy: [] }, R_AllShopTablets: { value: void 0, cachedBy: [] }, R_LimitedAscensionsDebuff: { value: void 0, cachedBy: [] }, R_SingularityDebuff: { value: void 0, cachedBy: [] }, R_SingularityReductions: { value: void 0, cachedBy: [] }, R_EffectiveSingularities: { value: void 0, cachedBy: [] }, R_AscensionSpeedExponentSpread: { value: void 0, cachedBy: [] }, R_RedAmbrosiaLuck: { value: void 0, cachedBy: [] }, R_LuckConversion: { value: void 0, cachedBy: [] } }; this.#a = xt; this.#r = Tt; this.#i = Ht; this.R_calculateNumberOfThresholds = () => { if (!this.gameData) return 0; let t = this.gameData, a = "R_NumberOfThresholds", n = b.HSAmbrosia.R_digitReduction, o = [t.lifetimeAmbrosia], i = this.#n(a, o); if (i) return i; let r = t.lifetimeAmbrosia > 0 ? 1 + Math.floor(Math.log10(t.lifetimeAmbrosia)) : 0, u = Math.floor(t.lifetimeAmbrosia / Math.pow(10, r - 1)) >= 3 ? 1 : 0, d = Math.max(0, 2 * (r - n) - 1 + u); return this.#o(a, { value: d, cachedBy: o }), d }; this.R_calculateToNextThreshold = () => { if (!this.gameData) return 0; let t = this.gameData, a = "R_ToNextThreshold", n = b.HSAmbrosia.R_digitReduction, o = [t.lifetimeAmbrosia], i = this.#n(a, o); if (i) return i; let r = this.R_calculateNumberOfThresholds(), l; r === 0 ? l = 1e4 - t.lifetimeAmbrosia : r % 2 === 0 ? l = Math.pow(10, r / 2 + n) - t.lifetimeAmbrosia : l = 3 * Math.pow(10, (r - 1) / 2 + n) - t.lifetimeAmbrosia; let u = l; return this.#o(a, { value: u, cachedBy: o }), u }; this.R_calculateRequiredBlueberryTime = () => { if (!this.gameData) return 0; let t = this.gameData, a = "R_RequiredBlueberryTime", n = b.HSAmbrosia.R_TIME_PER_AMBROSIA, o = [t.lifetimeAmbrosia], i = this.#n(a, o); if (i) return i; let r = n; r += Math.floor(t.lifetimeAmbrosia / 500); let l = this.R_calculateNumberOfThresholds(), d = Math.pow(2, l) * r; return this.#o(a, { value: d, cachedBy: o }), d }; this.R_calculateRequiredRedAmbrosiaTime = () => { if (!this.gameData) return 0; let t = this.gameData, a = "R_RequiredRedAmbrosiaTime", n = b.HSAmbrosia.R_TIME_PER_RED_AMBROSIA, o = [t.lifetimeRedAmbrosia, t.singularityChallenges.limitedTime.completions], i = this.#n(a, o); if (i) return i; let r = 1 - .01 * t.singularityChallenges.limitedTime.completions, l = n; l += 200 * t.lifetimeRedAmbrosia; let u = 1e6 * +r; l *= +r; let d = Math.min(u, l); return this.#o(a, { value: d, cachedBy: o }), d }; this.R_calculateHepteractEffective = t => { if (!this.gameData) return 0; let a = this.gameData, n = "R_HepteractEffective", o = [a.hepteracts[t].BAL, a.platonicUpgrades[19], a.goldenQuarkUpgrades.singQuarkHepteract.level, a.goldenQuarkUpgrades.singQuarkHepteract2.level, a.goldenQuarkUpgrades.singQuarkHepteract3.level, a.shopUpgrades.improveQuarkHept, a.shopUpgrades.improveQuarkHept2, a.shopUpgrades.improveQuarkHept3, a.shopUpgrades.improveQuarkHept4, a.shopUpgrades.improveQuarkHept5], i = this.#n(n, o); if (i) return i; let r = Math.min(a.hepteracts[t].BAL, this.#i[t].LIMIT), l = 0; if (t === "chronos" && (l += 1 / 750 * a.platonicUpgrades[19]), t === "quark") { l += +a.goldenQuarkUpgrades.singQuarkHepteract.level / 100, l += +a.goldenQuarkUpgrades.singQuarkHepteract2.level / 100, l += +a.goldenQuarkUpgrades.singQuarkHepteract3.level / 100, l += +a.octUpgrades.octeractImprovedQuarkHept.level / 100, l += a.shopUpgrades.improveQuarkHept / 100, l += a.shopUpgrades.improveQuarkHept2 / 100, l += a.shopUpgrades.improveQuarkHept3 / 100, l += a.shopUpgrades.improveQuarkHept4 / 100, l += a.shopUpgrades.improveQuarkHept5 / 5e3; let u = a.hepteracts[t].BAL, d; return 1e3 < u && u <= 1e3 * Math.pow(2, 10) ? d = r * Math.pow(u / 1e3, 1 / 2 + l) : 1e3 * Math.pow(2, 10) < u && u <= 1e3 * Math.pow(2, 18) ? d = r * Math.pow(Math.pow(2, 10), 1 / 2 + l) * Math.pow(u / (1e3 * Math.pow(2, 10)), 1 / 4 + l / 2) : 1e3 * Math.pow(2, 18) < u && u <= 1e3 * Math.pow(2, 44) ? d = r * Math.pow(Math.pow(2, 10), 1 / 2 + l) * Math.pow(Math.pow(2, 8), 1 / 4 + l / 2) * Math.pow(u / (1e3 * Math.pow(2, 18)), 1 / 6 + l / 3) : 1e3 * Math.pow(2, 44) < u ? d = r * Math.pow(Math.pow(2, 10), 1 / 2 + l) * Math.pow(Math.pow(2, 8), 1 / 4 + l / 2) * Math.pow(Math.pow(2, 26), 1 / 6 + l / 3) * Math.pow(u / (1e3 * Math.pow(2, 44)), 1 / 12 + l / 6) : d = 0, this.#o(n, { value: d, cachedBy: o }), d } return a.hepteracts[t].BAL > this.#i[t].LIMIT && (r *= Math.pow(a.hepteracts[t].BAL / this.#i[t].LIMIT, this.#i[t].DR + l)), this.#o(n, { value: r, cachedBy: o }), r }; this.#t = { ...this.#e } } #e; #t; #a; #r; #i; #n(t, a) { if (!(t in this.#e)) return c.debug(`Could not find cache for '${t}'`), !1; let n = this.#e[t]; if (n.value === void 0 || n.cachedBy.length === 0) return b.Debug.calculationCacheDebugMode && console.log(`Cache missed (reason: null value or empty cache) for ${t} with value ${n.value}`), !1; if (n.cachedBy.length !== a.length) return b.Debug.calculationCacheDebugMode && console.warn(`Cache missed (reason: cache length mismatch) for ${t} with value ${n.value}`), !1; for (let o = 0; o < n.cachedBy.length; o++)if (!a.includes(n.cachedBy[o])) return b.Debug.calculationCacheDebugMode && console.log(`Cache missed (reason: calc var mismatch) for ${t} (${n.cachedBy[o]})`), !1; return b.Debug.calculationCacheDebugMode && console.log(`Hit cache for ${t} with value ${n.value}`), n.value } #o(t, a) { if (a.cachedBy.length === 0 || a.value === null || a.value === void 0) { b.Debug.calculationCacheDebugMode && console.warn(`Rejected cache update for ${t} (value: ${a.value}, cachedBy: ${a.cachedBy.length})`); return } this.#e[t] = a } clearCache() { this.#e = { ...this.#t } } dumpCache() { console.table(this.#e) } #s(t, a, n, o, i) { let r = 0, l = o(r, a); for (; t >= l && (t -= l, r += 1, l = o(r, a), !(r >= n));); return i(r) } #l(t, a, n, o, i) { let r = 0, l = o(r, a); for (; t >= l && (t -= l, r += 1, l = o(r, a), !(r >= n));); return i(r) } R_calculateConsumableEventBuff(t) { if (!this.eventData) return 0; let a = this.eventData, n = `EVENTBUFF_${p.eventBuffNumToName(t)}`, o = [a.HAPPY_HOUR_BELL.amount, t], i = this.#n(n, o); if (i) return i; let { HAPPY_HOUR_BELL: r } = this.eventData, l = r.amount - 1; if (r.amount === 0) return this.#o(n, { value: 0, cachedBy: o }), 0; let u = 0; switch (t) { case 0: u = r ? .25 + .025 * l : 0; break; case 1: u = 0; break; case 2: u = r ? .5 + .05 * l : 0; break; case 3: u = 0; break; case 4: u = 0; break; case 5: u = 0; break; case 6: u = 0; break; case 7: u = 0; break; case 8: u = r ? .5 + .05 * l : 0; break; case 9: u = r ? .5 + .05 * l : 0; break; case 10: u = 0; break; case 13: u = 0; break; case 11: u = r ? .1 + .01 * l : 0; break; case 12: u = r ? .1 + .01 * l : 0; break }return this.#o(n, { value: u, cachedBy: o }), u } R_calculateAmbrosiaGenerationShopUpgrade(t = !0) { if (!this.gameData) return 0; let a = this.gameData, n = "R_AmbrosiaGenerationShopUpgrade", o = [a.shopUpgrades.shopAmbrosiaGeneration1, a.shopUpgrades.shopAmbrosiaGeneration2, a.shopUpgrades.shopAmbrosiaGeneration3, a.shopUpgrades.shopAmbrosiaGeneration4], i = this.#n(n, o); if (i) return i; let r = [1 + a.shopUpgrades.shopAmbrosiaGeneration1 / 100, 1 + a.shopUpgrades.shopAmbrosiaGeneration2 / 100, 1 + a.shopUpgrades.shopAmbrosiaGeneration3 / 100, 1 + a.shopUpgrades.shopAmbrosiaGeneration4 / 1e3], l = r.reduce((u, d) => u * d); return this.#o(n, { value: l, cachedBy: o }), t ? l : r } R_calculateAmbrosiaGenerationSingularityUpgrade(t = !0) { if (!this.gameData) return 0; let a = this.gameData, n = "R_AmbrosiaGenerationSingularityUpgrade", o = [a.goldenQuarkUpgrades.singAmbrosiaGeneration.level, a.goldenQuarkUpgrades.singAmbrosiaGeneration2.level, a.goldenQuarkUpgrades.singAmbrosiaGeneration3.level, a.goldenQuarkUpgrades.singAmbrosiaGeneration4.level], i = this.#n(n, o); if (i) return i; let r = [1 + a.goldenQuarkUpgrades.singAmbrosiaGeneration.level / 100, 1 + a.goldenQuarkUpgrades.singAmbrosiaGeneration2.level / 100, 1 + a.goldenQuarkUpgrades.singAmbrosiaGeneration3.level / 100, 1 + 2 * a.goldenQuarkUpgrades.singAmbrosiaGeneration4.level / 100], l = r.reduce((u, d) => u * d); return this.#o(n, { value: l, cachedBy: o }), t ? l : r } R_calculateAmbrosiaGenerationOcteractUpgrade(t = !0) { if (!this.gameData) return 0; let a = this.gameData, n = "R_AmbrosiaGenerationOcteractUpgrade", o = [a.octUpgrades.octeractAmbrosiaGeneration.level, a.octUpgrades.octeractAmbrosiaGeneration2.level, a.octUpgrades.octeractAmbrosiaGeneration3.level, a.octUpgrades.octeractAmbrosiaGeneration4.level], i = this.#n(n, o); if (i) return i; let r = [1 + a.octUpgrades.octeractAmbrosiaGeneration.level / 100, 1 + a.octUpgrades.octeractAmbrosiaGeneration2.level / 100, 1 + a.octUpgrades.octeractAmbrosiaGeneration3.level / 100, 1 + 2 * a.octUpgrades.octeractAmbrosiaGeneration4.level / 100], l = r.reduce((u, d) => u * d); return this.#o(n, { value: l, cachedBy: o }), t ? l : r } R_calculateSingularityMilestoneBlueberries() { if (!this.gameData) return 0; let t = this.gameData, a = "R_SingularityMilestoneBlueberries", n = [t.highestSingularityCount], o = this.#n(a, n); if (o) return o; let i = 0; t.highestSingularityCount >= 270 ? i = 5 : t.highestSingularityCount >= 256 ? i = 4 : t.highestSingularityCount >= 192 ? i = 3 : t.highestSingularityCount >= 128 ? i = 2 : t.highestSingularityCount >= 64 && (i = 1); let r = i; return this.#o(a, { value: r, cachedBy: n }), r } R_calculateDilatedFiveLeafBonus() { if (!this.gameData) return 0; let t = this.gameData, a = "R_DilatedFiveLeafBonus", n = [t.highestSingularityCount], o = this.#n(a, n); if (o) return o; let i = [100, 150, 200, 225, 250, 255, 260, 265, 269, 272], r = i.length / 100; for (let u = 0; u < i.length; u++)if (t.highestSingularityCount < i[u]) { r = u / 100; break } let l = r; return this.#o(a, { value: l, cachedBy: n }), l } R_calculateSingularityAmbrosiaLuckMilestoneBonus() { if (!this.gameData) return 0; let t = this.gameData, a = "R_SingularityAmbrosiaLuckMilestoneBonus", n = [t.highestSingularityCount], o = this.#n(a, n); if (o) return o; let i = 0, r = [35, 42, 49, 56, 63, 70, 77], l = [135, 142, 149, 156, 163, 170, 177]; for (let d of r) t.highestSingularityCount >= d && (i += 5); for (let d of l) t.highestSingularityCount >= d && (i += 6); let u = i; return this.#o(a, { value: u, cachedBy: n }), u } R_calculateAmbrosiaLuckShopUpgrade(t = !0) { if (!this.gameData) return 0; let a = this.gameData, n = "R_AmbrosiaLuckShopUpgrade", o = [a.shopUpgrades.shopAmbrosiaLuck1, a.shopUpgrades.shopAmbrosiaLuck2, a.shopUpgrades.shopAmbrosiaLuck3, a.shopUpgrades.shopAmbrosiaLuck4], i = this.#n(n, o); if (i) return i; let r = [2 * a.shopUpgrades.shopAmbrosiaLuck1, 2 * a.shopUpgrades.shopAmbrosiaLuck2, 2 * a.shopUpgrades.shopAmbrosiaLuck3, .6 * a.shopUpgrades.shopAmbrosiaLuck4], l = r.reduce((u, d) => u + d, 0); return this.#o(n, { value: l, cachedBy: o }), t ? l : r } R_calculateAmbrosiaLuckSingularityUpgrade(t = !0) { if (!this.gameData) return 0; let a = this.gameData, n = "R_AmbrosiaLuckSingularityUpgrade", o = [a.goldenQuarkUpgrades.singAmbrosiaLuck.level, a.goldenQuarkUpgrades.singAmbrosiaLuck2.level, a.goldenQuarkUpgrades.singAmbrosiaLuck3.level, a.goldenQuarkUpgrades.singAmbrosiaLuck4.level], i = this.#n(n, o); if (i) return i; let r = [+a.goldenQuarkUpgrades.singAmbrosiaLuck.level * 4, +a.goldenQuarkUpgrades.singAmbrosiaLuck2.level * 2, +a.goldenQuarkUpgrades.singAmbrosiaLuck3.level * 3, +a.goldenQuarkUpgrades.singAmbrosiaLuck4.level * 5], l = r.reduce((u, d) => u + d, 0); return this.#o(n, { value: l, cachedBy: o }), t ? l : r } R_calculateAmbrosiaLuckOcteractUpgrade(t = !0) { if (!this.gameData) return 0; let a = this.gameData, n = "R_AmbrosiaLuckOcteractUpgrade", o = [a.octUpgrades.octeractAmbrosiaLuck.level, a.octUpgrades.octeractAmbrosiaLuck2.level, a.octUpgrades.octeractAmbrosiaLuck3.level, a.octUpgrades.octeractAmbrosiaLuck4.level], i = this.#n(n, o); if (i) return i; let r = [+a.octUpgrades.octeractAmbrosiaLuck.level * 4, +a.octUpgrades.octeractAmbrosiaLuck2.level * 2, +a.octUpgrades.octeractAmbrosiaLuck3.level * 3, +a.octUpgrades.octeractAmbrosiaLuck4.level * 5], l = r.reduce((u, d) => u + d, 0); return this.#o(n, { value: l, cachedBy: o }), t ? l : r } R_calculateTotalCubes() { if (!this.gameData) return 0; let t = this.gameData, a = "R_TotalCubes", n = [t.wowCubes, t.wowTesseracts, t.wowHypercubes, t.wowPlatonicCubes, t.wowAbyssals, t.wowOcteracts], o = this.#n(a, n); if (o) return o; let i = Math.floor(Math.log10(Number(t.wowCubes) + 1)) + Math.floor(Math.log10(Number(t.wowTesseracts) + 1)) + Math.floor(Math.log10(Number(t.wowHypercubes) + 1)) + Math.floor(Math.log10(Number(t.wowPlatonicCubes) + 1)) + Math.floor(Math.log10(t.wowAbyssals + 1)) + Math.floor(Math.log10(t.wowOcteracts + 1)) + 6; return this.#o(a, { value: i, cachedBy: n }), i } R_calculateAmbrosiaUpgradeValue(t) { if (!this.gameData) return 0; let a = this.gameData, n = `REDAMB_${t}`; if (!(t in a.ambrosiaUpgrades) || !(t in this.#r)) return 0; let o = [a.ambrosiaUpgrades[t].ambrosiaInvested], i = this.#n(n, o); if (i) return i; let r = this.#r[t], u = this.#s(a.ambrosiaUpgrades[t].ambrosiaInvested, r.costPerLevel, r.maxLevel, r.costFunction, r.levelFunction); return this.#o(n, { value: u, cachedBy: o }), u } R_calculateSynergismLevel() { if (!this.gameData) return 0; let t = this.gameData, a = 0; a += _e.reduce((n, o, i) => n + (t.achievements[i] ? o.pointValue : 0), 0) } R_calculateRedAmbrosiaUpgradeValue(t) { if (!this.gameData) return 0; let a = this.gameData, n = `REDAMB_${t}`; if (!(t in a.redAmbrosiaUpgrades) || !(t in this.#a)) return 0; let o = [a.redAmbrosiaUpgrades[t]], i = this.#n(n, o); if (i) return i; let r = this.#a[t], u = this.#l(a.redAmbrosiaUpgrades[t], r.costPerLevel, r.maxLevel, r.costFunction, r.levelFunction); return this.#o(n, { value: u, cachedBy: o }), u } R_calculateCampaignAmbrosiaSpeedBonus() { let t = "R_CampaignAmbrosiaSpeedBonus", a = this.campaignData?.tokens ?? 0, n = [a], o = this.#n(t, n); if (o) return o; let i; a < 2e3 ? i = 1 : i = 1 + .05 * 1 / 2e3 * Math.min(a - 2e3, 2e3) + .05 * (1 - Math.exp(-Math.max(a - 4e3, 0) / 2e3)); let r = i; return this.#o(t, { value: r, cachedBy: n }), r } R_calculateCampaignLuckBonus() { let t = "R_CampaignLuckBonus", a = this.campaignData?.tokens ?? 0, n = [a], o = this.#n(t, n); if (o) return o; let i; a < 2e3 ? i = 0 : i = 10 + 40 / 2e3 * Math.min(a - 2e3, 2e3) + 50 * (1 - Math.exp(-Math.max(a - 4e3, 0) / 2500)); let r = i; return this.#o(t, { value: r, cachedBy: n }), r } R_calculateCookieUpgrade29Luck() { if (!this.gameData) return 0; let t = this.gameData, a = "R_CookieUpgrade29Luck", o = [t.cubeUpgrades[79] ?? 0, t.lifetimeRedAmbrosia], i = this.#n(a, o); if (i) return i; let r; t.cubeUpgrades[79] === 0 || t.lifetimeRedAmbrosia === 0 ? r = 0 : r = 10 * Math.pow(Math.log10(t.lifetimeRedAmbrosia), 2); let l = r; return this.#o(a, { value: l, cachedBy: o }), l } R_calculateSumOfExaltCompletions() { if (!this.gameData) return 0; let t = this.gameData, a = "R_SumOfExaltCompletions", n = [...Object.values(t.singularityChallenges).map(l => l.completions)], o = this.#n(a, n); if (o) return o; let i = 0; for (let l of Object.values(t.singularityChallenges)) i += l.completions; let r = i; return this.#o(a, { value: r, cachedBy: n }), r } getCorruptionTotalLevel() { if (!this.gameData) return 0; let a = this.gameData.corruptions.used; return Object.values(a).reduce((o, i) => o + i, 0) } R_calculateFreeShopInfinityUpgrades(t = !0) { return this.R_calculateAllShopTablets(t) } R_calculateAllShopTablets(t = !0) { if (!this.gameData) return 0; let a = this.gameData, n = "R_AllShopTablets", o = [a.highestSingularityCount, a.goldenQuarkUpgrades.singInfiniteShopUpgrades.level, a.octUpgrades.octeractInfiniteShopUpgrades.level, a.shopUpgrades.shopInfiniteShopUpgrades, ...a.singularityChallenges.noAmbrosiaUpgrades.enabled ? [] : [this.R_calculateRedAmbrosiaUpgradeValue("freeLevelsRow4"), this.R_calculateRedAmbrosiaUpgradeValue("freeLevelsRow5")]], i = this.#n(n, o); if (i) return i; let r = () => a.highestSingularityCount >= 280 ? Math.floor(.8 * (a.highestSingularityCount - 200)) : a.highestSingularityCount >= 250 ? Math.floor(.5 * (a.highestSingularityCount - 200)) : 0, l = [this.R_calculateRedAmbrosiaUpgradeValue("infiniteShopUpgrades"), r(), +a.goldenQuarkUpgrades.singInfiniteShopUpgrades.level, +a.octUpgrades.octeractInfiniteShopUpgrades.level, Math.floor(.005 * a.shopUpgrades.shopInfiniteShopUpgrades * this.R_calculateSumOfExaltCompletions()), ...a.singularityChallenges.noAmbrosiaUpgrades.enabled ? [] : [+this.R_calculateRedAmbrosiaUpgradeValue("freeLevelsRow4"), +this.R_calculateRedAmbrosiaUpgradeValue("freeLevelsRow5")]], u = l.reduce((d, g) => d + g, 0); return this.#o(n, { value: u, cachedBy: o }), t ? u : l } R_calculateLimitedAscensionsDebuff() { if (!this.gameData) return 0; let t = this.gameData, a = "R_LimitedAscensionsDebuff"; if (!t.singularityChallenges.limitedAscensions.enabled) return 1; let n = [t.ascensionCount, t.singularityChallenges.limitedAscensions.completions], o = this.#n(a, n); if (o) return o; let i = t.ascensionCount - Math.max(0, 20 - t.singularityChallenges.limitedAscensions.completions); i = Math.max(0, i); let r = Math.pow(2, i); return this.#o(a, { value: r, cachedBy: n }), r } R_calculateSingularityReductions(t = !0) { if (!this.gameData) return 0; let a = this.gameData, n = "R_SingularityReductions", o = [a.insideSingularityChallenge ? 1 : 0, this.R_calculateAmbrosiaUpgradeValue("ambrosiaSingReduction2"), this.R_calculateAmbrosiaUpgradeValue("ambrosiaSingReduction1"), a.shopUpgrades.shopSingularityPenaltyDebuff], i = this.#n(n, o); if (i) return i; let r; a.insideSingularityChallenge ? r = this.R_calculateAmbrosiaUpgradeValue("ambrosiaSingReduction2") : r = this.R_calculateAmbrosiaUpgradeValue("ambrosiaSingReduction1"); let l = [a.shopUpgrades.shopSingularityPenaltyDebuff, r], u = l.reduce((d, g) => d + g, 0); return this.#o(n, { value: u, cachedBy: o }), t ? u : l } R_calculateEffectiveSingularities(t = -1) { if (!this.gameData) return 0; let a = this.gameData, n = "R_EffectiveSingularities", o = [t, a.insideSingularityChallenge ? 1 : 0, a.singularityChallenges.noOcteracts.completions], i = this.#n(n, o); if (i) return i; let r = t === -1 ? a.singularityCount : t; return r *= Math.min(4.75, .75 * t / 10 + 1), a.insideSingularityChallenge && a.singularityChallenges.noOcteracts.enabled && (r *= Math.pow(a.singularityChallenges.noOcteracts.completions + 1, 3)), t > 10 && (r *= 1.5, r *= Math.min(4, 1.25 * t / 10 - .25)), t > 25 && (r *= 2.5, r *= Math.min(6, 1.5 * t / 25 - .5)), t > 36 && (r *= 4, r *= Math.min(5, t / 18 - 1), r *= Math.pow(1.1, Math.min(t - 36, 64))), t > 50 && (r *= 5, r *= Math.min(8, 2 * t / 50 - 1), r *= Math.pow(1.1, Math.min(t - 50, 50))), t > 100 && (r *= 2, r *= t / 25, r *= Math.pow(1.1, t - 100)), t > 150 && (r *= 2, r *= Math.pow(1.05, t - 150)), t > 200 && (r *= 1.5, r *= Math.pow(1.275, t - 200)), t > 215 && (r *= 1.25, r *= Math.pow(1.2, t - 215)), t > 230 && (r *= 2), t > 269 && (r *= 3, r *= Math.pow(3, t - 269)), this.#o(n, { value: r, cachedBy: o }), r } R_calculateSingularityDebuff(t, a = -1) { if (!this.gameData) return 1; let n = this.gameData; if (a === -1 && (a = n.singularityCount), a === 0 || n.runes.antiquities > 0) return 1; let o = a - this.R_calculateSingularityReductions(); if (o < 1) return 1; let i = this.R_calculateEffectiveSingularities(o), r = 1; r *= 1 - Math.min(300, n.shopUpgrades.shopHorseShoe * this.R_calculateHorseShoeLevel()) / 1e3; let l; if (t === "Offering") l = o < 150 ? Math.sqrt(i) + 1 : Math.pow(i, 2 / 3) / 400; else if (t === "Global Speed") l = 1 + Math.sqrt(i) / 4; else if (t === "Obtainium") l = o < 150 ? Math.sqrt(i) + 1 : Math.pow(i, 2 / 3) / 400; else if (t === "Researches") l = 1 + Math.sqrt(i) / 2; else if (t === "Ascension Speed") l = r * (o < 150 ? 1 + Math.sqrt(i) / 5 : 1 + Math.pow(i, .75) / 1e4); else if (t === "Cubes") { let u = o > 100 ? Math.pow(1.02, o - 100) : 1; l = o < 150 ? 1 + Math.sqrt(i) * u / 4 : 1 + Math.pow(i, .75) * u / 1e3 } else t === "Platonic Costs" ? l = o > 36 ? 1 + Math.pow(i, 3 / 10) / 12 : 1 : t === "Hepteract Costs" ? l = o > 50 ? 1 + Math.pow(i, 11 / 50) / 25 : 1 : l = Math.cbrt(i + 1); return l } R_calculateAscensionSpeedExponentSpread(t = !0) { if (!this.gameData) return 0; let a = this.gameData, n = "R_AscensionSpeedExponentSpread", o = [a.goldenQuarkUpgrades.singAscensionSpeed.level, a.goldenQuarkUpgrades.singAscensionSpeed2.level, a.shopUpgrades.chronometerInfinity], i = this.#n(n, o); if (i) return i; let r = [a.goldenQuarkUpgrades.singAscensionSpeed.level > 0 ? .03 : 0, a.goldenQuarkUpgrades.singAscensionSpeed2.level * .001, .001 * Math.floor((a.shopUpgrades.chronometerInfinity + this.R_calculateFreeShopInfinityUpgrades()) / 40)], l = r.reduce((u, d) => u + d, 0); return this.#o(n, { value: l, cachedBy: o }), t ? l : r } calculateChallenge15Reward(t) { if (!this.gameData) return c.errorOnce("<red>calculateChallenge15Reward() GAMEDATA WAS NULL</red>", this.context), 0; let a = this.gameData, n = a.challenge15Exponent ? a.challenge15Exponent : a.highestChallenge15Exponent ? a.highestChallenge15Exponent : 0; return n === 0 ? 0 : Dt[t](n) } R_calculateRawAscensionSpeedMult(t = !0) { if (!this.gameData) return 0; let a = this.gameData, n = "R_RawAscensionSpeedMult", o = a.cubeUpgrades[59] ?? 0, i = [a.shopUpgrades.chronometer, a.shopUpgrades.chronometer2, a.shopUpgrades.chronometer3, a.achievements[262], a.achievements[263], a.platonicUpgrades[15], a.singularityCount, a.shopUpgrades.chronometerZ, a.octUpgrades.octeractImprovedAscensionSpeed.level, a.octUpgrades.octeractImprovedAscensionSpeed2.level, a.singularityChallenges.limitedAscensions.completions, a.singularityChallenges.limitedTime.completions, a.shopUpgrades.shopChronometerS, o, a.insideSingularityChallenge ? 1 : 0], r = this.#n(n, i), l = [this.R_calculateMortuus2AscensionSpeed(), this.R_calculatePolymathAscSpeed(), 1 + 1.2 / 100 * a.shopUpgrades.chronometer, 1 + .6 / 100 * a.shopUpgrades.chronometer2, 1 + 1.5 / 100 * a.shopUpgrades.chronometer3, 1 + .6 / 1e3 * this.R_calculateHepteractEffective("chronos"), 1 + .002 * this.getCorruptionTotalLevel() * a.platonicUpgrades[15], this.calculateChallenge15Reward("ascensionSpeed"), 1 + 1 / 400 * o, 1 + .5 * (a.goldenQuarkUpgrades.intermediatePack.level > 0 ? 1 : 0), 1 + 1 / 1e3 * a.singularityCount * a.shopUpgrades.chronometerZ, 1 + +a.octUpgrades.octeractImprovedAscensionSpeed.level / 2e3 * a.singularityCount, 1 + +a.octUpgrades.octeractImprovedAscensionSpeed2.level / 2e3 * a.singularityCount, Math.pow(1.006, a.shopUpgrades.chronometerInfinity + this.R_calculateFreeShopInfinityUpgrades()), Math.pow(1 + .1 * a.singularityChallenges.limitedAscensions.completions / 100, 1 + Math.max(0, Math.floor(Math.log10(a.ascensionCount)))), 1 + .06 * a.singularityChallenges.limitedTime.completions, Math.max(Math.pow(1.01, (a.singularityCount - 200) * a.shopUpgrades.shopChronometerS), 1), 1 / this.R_calculateLimitedAscensionsDebuff(), 1 / this.R_calculateSingularityDebuff("Ascension Speed"), 1 + this.R_calculateConsumableEventBuff(4)], u = l.reduce((d, g) => d * g, 1); return this.#o(n, { value: u, cachedBy: i }), t ? u : l } R_calculateAscensionSpeedMult() { let t = this.R_calculateRawAscensionSpeedMult(), a = this.R_calculateAscensionSpeedExponentSpread(); return t < 1 ? t = Math.pow(t, 1 - a) : t = Math.pow(t, 1 + a), t } R_calculateFreeAntUpgradeLevels() { if (!this.gameData) return 1; let t = this.gameData, a = (o, i) => { let r = 0; switch (o) { case "transcend": return r += Math.min(100, i), r += 1 / 20 * (Math.min(1e3, Math.max(100, i)) - 100), r += 1 / 100 * (Math.max(1e3, i) - 1e3), r; case "reincarnation": return r += Math.min(25, i), r += 1 / 2 * (Math.min(75, Math.max(25, i)) - 25), r += 1 / 10 * (Math.max(75, i) - 75), r; case "ascension": return r += Math.min(10, i), r += 1 / 2 * (Math.max(10, i) - 10), r } }, n = 0; return n += a("reincarnation", t.challengecompletions[9]), n += Math.round(2e3 * (1 - Math.pow(.999, t.constantUpgrades[6] ?? 0))), n += 12 * a("ascension", t.challengecompletions[11]), n += 2 * t.researches[97], n += 2 * t.researches[98], n += t.researches[102], n += 2 * t.researches[132], n += Math.floor(1 / 200 * t.researches[200]), n += this.R_calculateAchievementReward(), n *= this.calculateChallenge15Reward("bonusAntLevel"), t.currentChallenge.ascension === 11 && (n += Math.floor(3 * t.challengecompletions[8] + 5 * t.challengecompletions[9])), n } R_calculateAchievementReward() { if (!this.gameData) return 1; let t = this.gameData, a = _e.map((o, i) => { if (o.reward && o.reward.includes("freeAntUpgrades")) { let r = o.reward.match(/freeAntUpgrades:\s*\(\)\s*=>\s*(\d+)/); if (r) return { index: i, freeAntUpgrades: Number(r[1]) } } return null }).filter(o => o !== null), n = 0; return a.forEach(o => { t.achievements[o.index] === 1 && (n += o.freeAntUpgrades) }), n } R_calculatePolymathAscSpeed() { if (!this.gameData) return 1; let t = this.gameData, a = (f, v) => { let w = (R, B) => { let { mantissa: H, exponent: G } = U(R); return (H * B).toExponential() + "e" + G }, U = R => { let B = R.match(/^([\d.]+)e\+?(-?\d+)$/i); return B ? { mantissa: parseFloat(B[1]), exponent: parseInt(B[2], 10) } : { mantissa: parseFloat(R), exponent: 0 } }, P = f, V = 1; v >= 120 && (V *= (v - 90) / 30), v >= 150 && (V *= (v - 120) / 30), v >= 180 && (V *= (v - 170) / 10), P = w(f, V); let Q = R => (Math.floor(R) || 0).toExponential(), O = w(Q(Math.pow(v, 3) / 8 + 1), parseFloat(P)), J = v >= 30 ? w(Q(Math.pow(v - 30, 3) / 32 + 1), parseFloat(P)) : "0e0", F = v >= 60 ? w(Q(Math.pow(v - 60, 3) / 384 + 1), parseFloat(P)) : "0e0", z = v >= 90 ? w(Q(Math.pow(v - 90, 3) / 500 + 1), parseFloat(P)) : "0e0", Y = v >= 120 ? w(Q(Math.pow(v - 120, 3) / 375 + 1), parseFloat(P)) : "0e0", k = v >= 150 ? w(Q(Math.pow(v - 150, 3) / 192 + 1), parseFloat(P)) : "0e0", I = v >= 150 ? w(Q(Math.pow(v - 150, 3) / 1280 + 1), parseFloat(P)) : "0e0"; return { shard: O, commonFragment: J, uncommonFragment: F, rareFragment: z, epicFragment: Y, legendaryFragment: k, mythicalFragment: I } }, n = 0; t.singularityChallenges.noOcteracts.enabled || t.singularityChallenges.sadisticPrequel.enabled || (n += t.octUpgrades.octeractTalismanLevelCap1.level, n += t.octUpgrades.octeractTalismanLevelCap2.level, n += t.octUpgrades.octeractTalismanLevelCap3.level, n += t.octUpgrades.octeractTalismanLevelCap4.level); let o = 180, i = o; i += 6 * Math.min(10, t.challengecompletions[13]), i += 3 * (Math.max(10, t.challengecompletions[13]) - 10), i += Math.floor(t.researches[200] / 400), i += t.singularityChallenges.taxmanLastStand.completions * 25, i += n; let r = [1, 1.04, 1.08, 1.12, 1.16, 1.2, 1.25, 1.3, 1.325, 1.35, 1.4], l = { shard: t.talismans.polymath.shard.toString(), commonFragment: t.talismans.polymath.commonFragment.toString(), uncommonFragment: t.talismans.polymath.uncommonFragment.toString(), rareFragment: t.talismans.polymath.rareFragment.toString(), epicFragment: t.talismans.polymath.epicFragment.toString(), legendaryFragment: t.talismans.polymath.legendaryFragment.toString(), mythicalFragment: t.talismans.polymath.mythicalFragment.toString() }, u = 0, d = f => a(1e16.toString(), f), g = f => { let v = f.match(/^([\d.]+)e\+?(-?\d+)$/i); return v ? Math.log10(parseFloat(v[1])) + parseInt(v[2], 10) : Math.log10(parseFloat(f)) }, m = {}; for (let f in l) m[f] = g(l[f]); let h = !0; for (; h && u < i;) { let f = d(u), v = !0; for (let w in f) { let U = g(f[w]); if (m[w] < U) { v = !1; break } } if (!v) break; for (let w in f) { let U = g(f[w]); m[w] = Math.log10(Math.pow(10, m[w]) - Math.pow(10, U)) } u += 1 } let A = u / o, M = 0; A >= 1 && (A >= 2 && (M += 1), A >= 4 && (M += 1), A >= 8 && (M += 1)); let E = 1 + Math.min(6, Math.floor(6 * A)) + M; return E = Math.min(E, r.length - 1), r[E] ?? 1 } R_calculateMortuus2AscensionSpeed() { if (!this.gameData) return 0; let t = this.gameData, a = t.ants.upgrades[15], n = this.R_calculateFreeAntUpgradeLevels(), o; return t.currentChallenge.ascension === 11 ? o = Math.min(t.ants.upgrades[15], n) : o = t.ants.upgrades[15] + Math.min(t.ants.upgrades[15], n), 2 - Math.pow(.996, o) } R_calculateHorseShoeLevel() { if (!this.gameData) return 0; let t = this.gameData, a = t.runes.horseShoe.toString(), n = 1 / 20; n += .005 * t.singularityChallenges.taxmanLastStand.completions; let o = t.shopUpgrades.shopHorseShoe > 0 ? 3 : 0, i = 1, l = ((d, g) => { let m = f => { let v = f.match(/^([\d.]+)e\+?(-?\d+)$/i); return v ? { m: parseFloat(v[1]), e: parseInt(v[2], 10) } : { m: parseFloat(f), e: 0 } }, h = m(d), A = m(g), M = h.e - A.e, E = h.m / A.m; if (M < 0 || M === 0 && E < 1) { let f = E * Math.pow(10, M); return Math.log10(1 + f) } return Math.log10(E) + M })(a, "1e500"), u = Math.floor(n * l * i) + o; return Math.max(0, u) } R_calculateCashGrabBonus(t) { if (!this.gameData) return 0; let a = this.gameData; return 1 + a.shopUpgrades.shopCashGrabUltra * t * Math.min(1, Math.pow(a.lifetimeAmbrosia / 1e7, 1 / 3)) } R_calculateEXUltraBonus(t) { if (!this.gameData) return 0; let a = this.gameData; return 1 + t * Math.min(a.shopUpgrades.shopEXUltra, Math.floor(a.lifetimeAmbrosia / 1e3) / 125) } calculateAmbrosiaSpeed(t = !0) { if (!this.gameData) return 0; let a = this.gameData; if (!this.pseudoData) return 0; let n = this.pseudoData; if (!this.meData) return 0; let o = this.meData, i = n?.playerUpgrades.find(M => M.internalName === "AMBROSIA_GENERATION_BUFF")?.level, r = i ? 1 + i * .05 : 1, l = this.R_calculateCampaignAmbrosiaSpeedBonus(), u = 100 * (1 + o.globalBonus / 100) * (1 + o.personalBonus / 100) - 100, d = this.R_calculateRedAmbrosiaUpgradeValue("blueberryGenerationSpeed"), g = this.R_calculateRedAmbrosiaUpgradeValue("blueberryGenerationSpeed2"), m = a.cubeUpgrades[76] ?? 1, h = [+a.visitedAmbrosiaSubtab, r, l, this.R_calculateAmbrosiaGenerationShopUpgrade(), this.R_calculateAmbrosiaGenerationSingularityUpgrade(), this.R_calculateAmbrosiaGenerationOcteractUpgrade(), 1 + this.R_calculateAmbrosiaUpgradeValue("ambrosiaPatreon") * u / 100, 1 + a.singularityChallenges.oneChallengeCap.completions / 100, 1 + a.singularityChallenges.noAmbrosiaUpgrades.completions / 50, d, g, 1 + .01 * m * this.R_calculateNumberOfThresholds(), this.R_calculateCashGrabBonus(kt), this.isEvent ? 1 + this.R_calculateConsumableEventBuff(11) : 1, this.R_calculateHorseShoeLevel()], A = h.reduce((M, E) => M * E, 1); return t ? A : h } calculateBlueBerries(t = !0) { let a = this.getGameData(); if (!a) return 0; let n = 0; a.singularityChallenges.noAmbrosiaUpgrades.completions >= 10 ? n = 2 : a.singularityChallenges.noAmbrosiaUpgrades.completions > 0 && (n = 1); let o = [+(a.singularityChallenges.noSingularityUpgrades.completions > 0), +a.goldenQuarkUpgrades.blueberries.level, +a.octUpgrades.octeractBlueberries.level, this.R_calculateSingularityMilestoneBlueberries(), n], i = o.reduce((r, l) => r + l, 0); return t ? i : o } calculateLuck(t = !0, a = !1) { let n = this.getGameData(), o = this.getPseudoData(); if (!n) return { additive: 0, raw: 0, total: 0 }; if (!o) return { additive: 0, raw: 0, total: 0 }; let i = n.cubeUpgrades[77] ?? 0, r = [1, n.singularityChallenges.noSingularityUpgrades.completions >= 30 ? .05 : 0, this.R_calculateDilatedFiveLeafBonus(), n.shopUpgrades.shopAmbrosiaLuckMultiplier4 / 100, n.singularityChallenges.noAmbrosiaUpgrades.completions / 200, .001 * i, this.isEvent ? this.R_calculateConsumableEventBuff(12) : 0], l = o.playerUpgrades.find(k => k.internalName === "AMBROSIA_LUCK_BUFF")?.level, u = l ? l * 20 : 0, d = this.R_calculateCampaignLuckBonus(), g = this.R_calculateRedAmbrosiaUpgradeValue("freeLevelsRow2"), m = this.R_calculateRedAmbrosiaUpgradeValue("freeLevelsRow3"), h = this.R_calculateRedAmbrosiaUpgradeValue("freeLevelsRow4"), A = this.R_calculateRedAmbrosiaUpgradeValue("freeLevelsRow5"), M = { 2: g, 3: m, 4: h, 5: A }, E = (k, I) => a ? M[I] : k + M[I], f = this.R_calculateAmbrosiaUpgradeValue("ambrosiaLuck1"), v = this.R_calculateAmbrosiaUpgradeValue("ambrosiaLuck2"), w = this.R_calculateAmbrosiaUpgradeValue("ambrosiaLuck3"), U = this.R_calculateTotalCubes(), P = this.R_calculateAmbrosiaUpgradeValue("ambrosiaCubeLuck1"), V = this.R_calculateAmbrosiaUpgradeValue("ambrosiaQuarkLuck1"), Q = this.R_calculateRedAmbrosiaUpgradeValue("regularLuck"), O = this.R_calculateRedAmbrosiaUpgradeValue("regularLuck2"), J = this.R_calculateRedAmbrosiaUpgradeValue("viscount"), F = [100, u, d, this.R_calculateSingularityAmbrosiaLuckMilestoneBonus(), this.R_calculateAmbrosiaLuckShopUpgrade(), this.R_calculateAmbrosiaLuckSingularityUpgrade(), this.R_calculateAmbrosiaLuckOcteractUpgrade(), 2 * E(f, 2) + 12 * Math.floor(E(f, 2) / 10), (3 + .3 * Math.floor(E(f, 2) / 10)) * E(v, 4) + 40 * Math.floor(E(v, 4) / 10), this.calculateBlueBerries() * E(w, 5), this.R_calculateTotalCubes() * .02 * E(P, 3), .02 * E(V, 3) * Math.floor(Math.pow(Math.log10(Number(n.worlds) + 1) + 1, 2)), n.highestSingularityCount >= 131 ? 131 : 0, n.highestSingularityCount >= 269 ? 269 : 0, n.shopUpgrades.shopOcteractAmbrosiaLuck * (1 + Math.floor(Math.log10(n.totalWowOcteracts + 1))), n.singularityChallenges.noAmbrosiaUpgrades.completions * 15, Q, O, J, 2 * i, this.R_calculateCookieUpgrade29Luck(), n.shopUpgrades.shopAmbrosiaUltra * this.R_calculateSumOfExaltCompletions(), Math.max(0, (this.R_calculateSynergismLevel() ?? -229) * 4)], z = [0], Y = []; if (a ? Y = F : Y = [...F, ...z], t) { let k = r.reduce((R, B) => R + B, 0), I = Y.reduce((R, B) => R + B, 0); return { additive: k, raw: I, total: k * I } } else return { additive: r, raw: Y } } R_calculateLuckConversion(t = !0) { if (!this.gameData) return 0; let a = this.gameData, n = "R_LuckConversion", o = this.R_calculateRedAmbrosiaUpgradeValue("conversionImprovement1"), i = this.R_calculateRedAmbrosiaUpgradeValue("conversionImprovement2"), r = this.R_calculateRedAmbrosiaUpgradeValue("conversionImprovement3"), l = this.R_calculateHorseShoeLevel(), u = [a.shopUpgrades.shopRedLuck1, a.shopUpgrades.shopRedLuck2, a.shopUpgrades.shopRedLuck3, o, i, r, l], d = this.#n(n, u); if (d) return d; let g = [20, o, i, r, -.01 * Math.floor(a.shopUpgrades.shopRedLuck1 / 20), -.01 * Math.floor(a.shopUpgrades.shopRedLuck2 / 20), -.01 * Math.floor(a.shopUpgrades.shopRedLuck3 / 20), -.5 * l / (l + 50)], m = g.reduce((h, A) => h + A, 0); return this.#o(n, { value: m, cachedBy: u }), t ? m : g } R_calculateRedAmbrosiaLuck(t = !0) { if (!this.gameData || !this.pseudoData) return 0; let a = this.gameData, n = this.pseudoData, o = "R_RedAmbrosiaLuck", i = n.playerUpgrades.find(M => M.internalName === "RED_LUCK_BUFF")?.level ?? 0, r = this.calculateLuck(), l = this.R_calculateRedAmbrosiaUpgradeValue("redLuck"), u = this.R_calculateRedAmbrosiaUpgradeValue("viscount"), d = this.R_calculateHorseShoeLevel(), g = [i, r.total, l, u, a.singularityChallenges.noAmbrosiaUpgrades.completions, a.shopUpgrades.shopRedLuck1, a.shopUpgrades.shopRedLuck2, a.shopUpgrades.shopRedLuck3, d], m = this.#n(o, g); if (m) return m; let h = [100, i, Math.floor((r.total - 100) / this.R_calculateLuckConversion()), l, a.singularityChallenges.noAmbrosiaUpgrades.completions * 4, a.shopUpgrades.shopRedLuck1 * .05, a.shopUpgrades.shopRedLuck2 * .075, a.shopUpgrades.shopRedLuck3 * .1, u, d * .2, Math.max(0, this.R_calculateSynergismLevel() ?? -259)], A = h.reduce((M, E) => M + E, 0); return this.#o(o, { value: A, cachedBy: g }), t ? A : h } calculateGoldenRevolution() { if (!this.gameData) return 0; let t = this.gameData, a = t.highestSingularityCount >= 100 ? 1 - .5 * t.highestSingularityCount / 250 : 1 } async dumpDataForHeater() {
            let t = D.getModule("HSGameData"); if (t) await t.forceUpdateAllData(); else { c.error("Failed to acquire game data for heater export", this.context), S.Notify("Failed to acquire game data for heater export", { position: "top", notificationType: "error" }); return } if (!this.gameData) return 0; let a = this.gameData; try { let { additive: n, raw: o, total: i } = this.calculateLuck(!0), r = this.calculateLuck(!0, !0), l = (i - 100 * Math.floor(i / 100)) / 100, u = (r.total - 100 * Math.floor(r.total / 100)) / 100, d = this.calculateBlueBerries(), g = this.calculateAmbrosiaSpeed(), m = d * g; return { ...this.gameData, hs_data: { lifeTimeAmbrosia: a.lifetimeAmbrosia, lifeTimeRedAmbrosia: a.lifetimeRedAmbrosia, quarks: a.worlds, platonic4x4: a.platonicUpgrades[19], baseLuck: o, luckMult: n, totalLuck: i, luckConversion: this.R_calculateLuckConversion(), totalCubes: this.R_calculateTotalCubes(), transcription: .55 + a.octUpgrades.octeractOneMindImprover.level / 150, ascSpeed: this.R_calculateAscensionSpeedMult(), blueberries: d, bonusRow2: this.R_calculateRedAmbrosiaUpgradeValue("freeLevelsRow2"), bonusRow3: this.R_calculateRedAmbrosiaUpgradeValue("freeLevelsRow3"), bonusRow4: this.R_calculateRedAmbrosiaUpgradeValue("freeLevelsRow4"), bonusRow5: this.R_calculateRedAmbrosiaUpgradeValue("freeLevelsRow5"), spread: this.R_calculateAscensionSpeedExponentSpread(), totalInfinityVouchers: this.R_calculateAllShopTablets(), tokens: this.campaignData?.tokens, maxTokens: this.campaignData?.maxTokens, isAtMaxTokens: this.campaignData?.isAtMaxTokens, isEvent: this.isEvent, bellStacks: this.eventData?.HAPPY_HOUR_BELL.amount, personalQuarkBonus: this.meData?.bonus.quarkBonus, blueAmbrosiaBarValue: a.blueberryTime, redAmbrosiaBarValue: a.redAmbrosiaTime, redAmbrosiaBarMax: this.R_calculateRequiredRedAmbrosiaTime(), ambrosiaSpeedMult: g, ambrosiaSpeed: m, ambrosiaGainChance: l, trueAmbrosiaGainChance: u, ambrosiaAcceleratorCount: a.shopUpgrades.shopAmbrosiaAccelerator, pseudoCoinUpgrades: { ambrosiaGenerationBuffLevel: this.pseudoData?.playerUpgrades.find(A => A.internalName === "AMBROSIA_GENERATION_BUFF")?.level, ambrosiaLuckBuffLevel: this.pseudoData?.playerUpgrades.find(A => A.internalName === "AMBROSIA_LUCK_BUFF")?.level, baseObtainiumBuffLevel: this.pseudoData?.playerUpgrades.find(A => A.internalName === "BASE_OBTAINIUM_BUFF")?.level, baseOfferingBuffLevel: this.pseudoData?.playerUpgrades.find(A => A.internalName === "BASE_OFFERING_BUFF")?.level, cubeBuffLevel: this.pseudoData?.playerUpgrades.find(A => A.internalName === "CUBE_BUFF")?.level, redAmbrosiaGenerationBuffLevel: this.pseudoData?.playerUpgrades.find(A => A.internalName === "RED_GENERATION_BUFF")?.level, redAmbrosiaLuckBuffLevel: this.pseudoData?.playerUpgrades.find(A => A.internalName === "RED_LUCK_BUFF")?.level }, redAmbrosiaUpgrades: { tutorial: this.R_calculateRedAmbrosiaUpgradeValue("tutorial"), conversionImprovement1: this.R_calculateRedAmbrosiaUpgradeValue("conversionImprovement1"), conversionImprovement2: this.R_calculateRedAmbrosiaUpgradeValue("conversionImprovement2"), conversionImprovement3: this.R_calculateRedAmbrosiaUpgradeValue("conversionImprovement3"), freeTutorialLevels: this.R_calculateRedAmbrosiaUpgradeValue("freeTutorialLevels"), freeLevelsRow2: this.R_calculateRedAmbrosiaUpgradeValue("freeLevelsRow2"), freeLevelsRow3: this.R_calculateRedAmbrosiaUpgradeValue("freeLevelsRow3"), freeLevelsRow4: this.R_calculateRedAmbrosiaUpgradeValue("freeLevelsRow4"), freeLevelsRow5: this.R_calculateRedAmbrosiaUpgradeValue("freeLevelsRow5"), blueberryGenerationSpeed: this.R_calculateRedAmbrosiaUpgradeValue("blueberryGenerationSpeed"), blueberryGenerationSpeed2: this.R_calculateRedAmbrosiaUpgradeValue("blueberryGenerationSpeed2"), regularLuck: this.R_calculateRedAmbrosiaUpgradeValue("regularLuck"), regularLuck2: this.R_calculateRedAmbrosiaUpgradeValue("regularLuck2"), redGenerationSpeed: this.R_calculateRedAmbrosiaUpgradeValue("redGenerationSpeed"), redLuck: this.R_calculateRedAmbrosiaUpgradeValue("redLuck"), redAmbrosiaCube: this.R_calculateRedAmbrosiaUpgradeValue("redAmbrosiaCube"), redAmbrosiaObtainium: this.R_calculateRedAmbrosiaUpgradeValue("redAmbrosiaObtainium"), redAmbrosiaOffering: this.R_calculateRedAmbrosiaUpgradeValue("redAmbrosiaOffering"), redAmbrosiaCubeImprover: this.R_calculateRedAmbrosiaUpgradeValue("redAmbrosiaCubeImprover"), viscount: this.R_calculateRedAmbrosiaUpgradeValue("viscount"), infiniteShopUpgrades: this.R_calculateRedAmbrosiaUpgradeValue("infiniteShopUpgrades"), redAmbrosiaAccelerator: this.R_calculateRedAmbrosiaUpgradeValue("redAmbrosiaAccelerator") }, isInsideSingularityChallenge: a.insideSingularityChallenge } } } catch (n) {
                let o = n instanceof Error ? `${n.message}
${n.stack}` : String(n); c.error(`Failed to calculate game data for heater export
${o}`, this.context), S.Notify("Failed to calculate game data for heater export", { position: "top", notificationType: "error" }); return
            }
        }
    }; var Je = class extends L { #e = new Map; #t = [5e3, 15e3, 3e4, 6e4]; constructor(e) { super(e) } async init() { c.log("Initializing HSWebsocket module", this.context), this.isInitialized = !0 } #a(e) { let t = this.#e.get(e); if (!t) { c.warn(`Tried to reconnect websocket ${e} but it doesn't exist`, this.context); return } this.#e.delete(e), this.registerWebSocket(e, t.regParams) } registerWebSocket(e, t) { let a = this; if (this.#e.has(e)) { c.warn(`Tried to register websocket ${e} again`, this.context); return } if (!t.url) { c.error(`Tried to register websocket ${e} without a URL`, this.context); return } let n = { socket: new WebSocket(t.url), reconnectionTries: 0, onClose: t.onClose ?? p.Noop, onOpen: t.onOpen ?? p.Noop, onMessage: t.onMessage ?? p.Noop, onRetriesFailed: t.onRetriesFailed ?? p.Noop, regParams: t }, o = async l => { let u = a.#e.get(e); console.log("WS CLOSED", e, { code: l.code, reason: l.reason, wasClean: l.wasClean, tries: u?.reconnectionTries }); let d = a.#t[++n.reconnectionTries]; d !== void 0 ? (c.log(`Reconnecting ${e} in ${d}ms (attempt ${n.reconnectionTries})`, a.context), setTimeout(() => { a.#a(e) }, d)) : (c.warn(`WebSocket ${e} failed to reconnect after ${n.reconnectionTries} tries`), await (n.onRetriesFailed ?? p.Noop)()), await (n.onClose ?? p.Noop)(l) }, i = async l => { let u = a.#e.get(e); if (!u) { c.warnOnce(`wsOnOpen(): Socket ${e} not found`, a.context); return } let d; try { d = JSON.parse(l.data) } catch (g) { c.warn(`Failed to parse WebSocket message for ${e}: ${g}`, this.context), d = void 0 } await (u.onMessage ?? p.Noop)(d) }, r = async l => { let u = a.#e.get(e); if (!u) { c.warnOnce(`wsOnOpen(): Socket ${e} not found`, a.context); return } u.reconnectionTries = 0, c.log(`WebSocket ${e} connected successfully`, a.context), await (u.onOpen ?? p.Noop)(l) }; n.socket.onclose = o, n.socket.onopen = r, n.socket.onmessage = i, this.#e.set(e, n), c.log(`Registered websocket ${e}`, this.context) } unregisterWebSocket(e) { let t = this.#e.get(e); t ? ((t.socket.readyState === WebSocket.OPEN || t.socket.readyState === WebSocket.CONNECTING) && t.socket.close(), this.#e.delete(e), c.log(`Unregistered websocket ${e}`, this.context)) : c.debug(`Could not unregister websocket (Maybe you're not logged in?) ${e}`, this.context) } getWebSocket(e) { return this.#e.get(e) } }; var Fe = class s extends L { static #e; constructor(e) { super(e), s.#e = e.context } async init() { let e = this; this.isInitialized = !0 } }; var ze = class {
        constructor() { this.timerDisplay = null; this.timerHeader = null; this.timerContent = null; this.isMinimized = !1; this.isDragging = !1; this.isResizing = !1; this.dragOffset = { x: 0, y: 0 }; this.resizeStart = { width: 0, height: 0, x: 0, y: 0 }; this.timestamps = []; this.quarksHistory = []; this.goldenQuarksHistory = []; this.startTime = 0; this.currentSingularityStart = 0; this.currentPhaseStart = 0; this._currentPhaseName = ""; this.phaseHistory = new Map; this.currentSingularityPhases = new Map; this.lastRecordedPhaseName = null; this.liveTimerInterval = null; this.currentLiveTime = 0; this.singularityBundles = []; this.previousQuarks = 0; this.previousGoldenQuarks = 0; this.exportButton = null; this.dynamicContent = null; this.createTimerDisplay(), this.setupDragAndResize() } setCurrentPhase(e) { this._currentPhaseName = e, this.updateDisplay() } getCurrentPhase() { return this._currentPhaseName } createTimerDisplay() {
            this.timerDisplay = document.createElement("div"), this.timerDisplay.id = "hs-autosing-timer-display", this.timerDisplay.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.9);
        color: #fff;
        border-radius: 8px;
        font-family: monospace;
        font-size: 14px;
        z-index: 10000;
        min-width: 200px;
        width: 280px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        display: none;
        overflow: hidden;
    `, this.timerHeader = document.createElement("div"), this.timerHeader.style.cssText = `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 8px 12px;
        cursor: move;
        display: flex;
        justify-content: space-between;
        align-items: center;
        user-select: none;
        border-radius: 8px 8px 0 0;
    `; let e = document.createElement("span"); e.textContent = "\u23F1\uFE0F Autosing Timer", e.style.fontWeight = "bold"; let t = document.createElement("button"); t.textContent = "\u2212", t.style.cssText = `
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        width: 20px;
        height: 20px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
        padding: 0;
    `, t.onclick = () => this.toggleMinimize(), this.timerHeader.appendChild(e), this.timerHeader.appendChild(t), this.timerContent = document.createElement("div"), this.timerContent.style.cssText = `
        padding: 12px;
        background: rgba(0, 0, 0, 0.9);
    `, this.dynamicContent = document.createElement("div"), this.timerContent.appendChild(this.dynamicContent), this.exportButton = document.createElement("button"), this.exportButton.id = "hs-export-data-btn", this.exportButton.className = "hs-export-btn", this.exportButton.style.display = "none", this.exportButton.onclick = () => this.exportDataAsCSV(), this.timerContent.appendChild(this.exportButton); let a = document.createElement("div"); a.style.cssText = `
        position: absolute;
        bottom: 0;
        right: 0;
        width: 15px;
        height: 15px;
        cursor: nwse-resize;
        background: linear-gradient(135deg, transparent 0%, transparent 50%, rgba(255, 255, 255, 0.3) 50%);
    `, a.onmousedown = o => this.startResize(o), this.timerDisplay.appendChild(this.timerHeader), this.timerDisplay.appendChild(this.timerContent), this.timerDisplay.appendChild(a), document.body.appendChild(this.timerDisplay); let n = document.createElement("style"); n.textContent = `
        @keyframes hs-color_rotate {
            0% { color: #ff5e00; }
            100% { color: #ff5e00; }
        }

        .hs-rainbow-text {
            font-weight: bold;
            animation: hs-color_rotate 6s linear infinite;
        }

        .hs-export-btn {
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
            border: none;
            color: white;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            font-weight: bold;
            margin-top: 8px;
            width: 100%;
        }

        .hs-export-btn:hover {
            box-shadow: 0 4px 12px rgba(56, 239, 125, 0.4);
        }
    `, document.head.appendChild(n)
        } updateExportButton() { if (!this.exportButton) return; let e = C.getSetting("advancedDataCollection"), t = e && e.isEnabled() && this.singularityBundles.length > 0; this.exportButton.style.display = t ? "block" : "none", t && (this.exportButton.textContent = `\u{1F4CA} Export Data (${this.singularityBundles.length} singularities)`) } setupDragAndResize() { !this.timerHeader || !this.timerDisplay || (this.timerHeader.onmousedown = e => { (e.target === this.timerHeader || e.target.tagName === "SPAN") && this.startDrag(e) }, document.addEventListener("mousemove", e => { this.isDragging ? this.drag(e) : this.isResizing && this.resize(e) }), document.addEventListener("mouseup", () => { this.isDragging = !1, this.isResizing = !1 })) } startDrag(e) { if (!this.timerDisplay) return; this.isDragging = !0; let t = this.timerDisplay.getBoundingClientRect(); this.dragOffset.x = e.clientX - t.left, this.dragOffset.y = e.clientY - t.top } drag(e) { if (!this.timerDisplay || !this.isDragging) return; let t = e.clientX - this.dragOffset.x, a = e.clientY - this.dragOffset.y; this.timerDisplay.style.left = `${t}px`, this.timerDisplay.style.top = `${a}px`, this.timerDisplay.style.right = "auto", this.timerDisplay.style.bottom = "auto" } startResize(e) { if (!this.timerDisplay) return; e.preventDefault(), this.isResizing = !0; let t = this.timerDisplay.getBoundingClientRect(); this.resizeStart = { width: t.width, height: t.height, x: e.clientX, y: e.clientY } } resize(e) { if (!this.timerDisplay || !this.isResizing) return; let t = e.clientX - this.resizeStart.x, a = e.clientY - this.resizeStart.y, n = Math.max(200, this.resizeStart.width + t), o = Math.max(100, this.resizeStart.height + a); this.timerDisplay.style.width = `${n}px`, this.timerDisplay.style.height = `${o}px` } toggleMinimize() { if (!(!this.timerContent || !this.timerDisplay)) if (this.isMinimized = !this.isMinimized, this.isMinimized) { this.timerContent.style.display = "none", this.timerDisplay.style.height = "auto"; let e = this.timerHeader?.querySelector("button"); e && (e.textContent = "+") } else { this.timerContent.style.display = "block", this.timerDisplay.style.height = ""; let e = this.timerHeader?.querySelector("button"); e && (e.textContent = "\u2212"), this.updateDisplay() } } startLiveTimer() { this.stopLiveTimer(), this.currentSingularityStart = performance.now(), this.currentPhaseStart = this.currentSingularityStart, this.currentSingularityPhases.clear(), this.lastRecordedPhaseName = null, this._currentPhaseName = "", this.liveTimerInterval = window.setInterval(() => { this.currentLiveTime = (performance.now() - this.currentSingularityStart) / 1e3, this.updateDisplay() }, 100) } stopLiveTimer() { this.liveTimerInterval !== null && (clearInterval(this.liveTimerInterval), this.liveTimerInterval = null) } start() { this.timestamps = [], this.quarksHistory = [], this.goldenQuarksHistory = [], this.startTime = performance.now(), this.phaseHistory.clear(), this.singularityBundles = [], this.previousQuarks = 0, this.previousGoldenQuarks = 0, this.startLiveTimer() } parseQuarkValue(e) { if (typeof e == "number") return e; let t = e.replace(",", "."), a = Number(t); return isNaN(a) ? 0 : a } recordPhase(e) { let t = performance.now(), a = (t - this.currentSingularityStart) / 1e3, n = (t - this.currentPhaseStart) / 1e3; if (e === this.lastRecordedPhaseName) { if (this.phaseHistory.has(e)) { let i = this.phaseHistory.get(e); if (i.times.length > 0) { let r = i.times.length - 1; i.times[r] += n, i.totalTime += n, i.lastTime = i.times[r] } } let o = this.currentSingularityPhases.get(e) || 0; this.currentSingularityPhases.set(e, o + n) } else { this.phaseHistory.has(e) || this.phaseHistory.set(e, { times: [], totalTime: 0, lastTime: 0 }); let o = this.phaseHistory.get(e); o.times.push(n), o.totalTime = a, o.lastTime = n, this.currentSingularityPhases.set(e, n), this.lastRecordedPhaseName = e } this.currentPhaseStart = t, this.updateDisplay() } recordSingularity(e, t) { let a = performance.now(), n = this.parseQuarkValue(e), o = this.parseQuarkValue(t); this.timestamps.push(a), this.quarksHistory.push(n), this.goldenQuarksHistory.push(o); let i = C.getSetting("advancedDataCollection"); if (i && i.isEnabled()) { let r = this.timestamps.length < 2 ? (a - this.startTime) / 1e3 : (a - this.timestamps[this.timestamps.length - 2]) / 1e3, l = this.previousQuarks > 0 ? n - this.previousQuarks : 0, u = this.previousGoldenQuarks > 0 ? o - this.previousGoldenQuarks : 0, d = { singularityNumber: this.timestamps.length, totalTime: r, quarksGained: l, goldenQuarksGained: u, totalQuarks: n, totalGoldenQuarks: o, phases: Object.fromEntries(this.currentSingularityPhases), timestamp: Date.now() }; this.singularityBundles.push(d) } this.previousQuarks = n, this.previousGoldenQuarks = o, this.startLiveTimer(), this.updateDisplay() } getSingularityCount() { return Math.max(0, this.timestamps.length) } getLastDuration() { return this.timestamps.length < 2 ? null : (this.timestamps[this.timestamps.length - 1] - this.timestamps[this.timestamps.length - 2]) / 1e3 } getAverageLast(e) { if (e <= 0 || this.timestamps.length <= e) return null; let t = 0; for (let a = 1; a <= e; a++)t += this.timestamps[this.timestamps.length - a] - this.timestamps[this.timestamps.length - (a + 1)]; return t / e / 1e3 } getQuarksPerSecond(e) { if (e.length < 2) return null; let t = e[0], n = e[e.length - 1] - t, o = (this.timestamps[this.timestamps.length - 1] - this.startTime) / 1e3; return o <= 0 ? null : n / o } getLastQuarksGained(e) { return e.length < 2 ? null : e[e.length - 1] - e[e.length - 2] } formatNumber(e) { return e.toExponential(2).replace("+", "") } getPhaseAverage(e) { let t = this.phaseHistory.get(e); return !t || t.times.length === 0 ? null : t.times.reduce((n, o) => n + o, 0) / t.times.length } exportDataAsCSV() {
            if (this.singularityBundles.length === 0) { alert("No data to export"); return } let e = new Set; this.singularityBundles.forEach(d => { Object.keys(d.phases).forEach(g => e.add(g)) }); let t = Array.from(e).sort(), a = ["Singularity Number", "Total Time (s)", "Quarks Gained", "Golden Quarks Gained", "Total Quarks", "Total Golden Quarks", "Timestamp", ...t.map(d => `Phase: ${d} (s)`)], n = this.singularityBundles.map(d => [d.singularityNumber.toString(), d.totalTime.toFixed(3), d.quarksGained.toExponential(6), d.goldenQuarksGained.toExponential(6), d.totalQuarks.toExponential(6), d.totalGoldenQuarks.toExponential(6), new Date(d.timestamp).toISOString(), ...t.map(m => (d.phases[m] || "").toString())].join(",")), o = [a.join(","), ...n].join(`
`), i = new Blob([o], { type: "text/csv;charset=utf-8;" }), r = document.createElement("a"), l = URL.createObjectURL(i), u = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5); r.setAttribute("href", l), r.setAttribute("download", `autosing_data_${u}.csv`), r.style.visibility = "hidden", document.body.appendChild(r), r.click(), document.body.removeChild(r)
        } updateDisplay() {
            if (!this.timerContent || !this.timerDisplay || this.timerDisplay.style.display === "none" || this.isMinimized) return; let e = this.getSingularityCount(), t = this.getLastDuration(), a = this.getAverageLast(5), n = this.getAverageLast(10), o = this.getAverageLast(50), i = this.getAverageLast(e - 1), r = this.getQuarksPerSecond(this.goldenQuarksHistory), l = this.getLastQuarksGained(this.goldenQuarksHistory), u = this.goldenQuarksHistory.length > 0 ? this.goldenQuarksHistory[this.goldenQuarksHistory.length - 1] : 0, d = this.getQuarksPerSecond(this.quarksHistory), g = this.getLastQuarksGained(this.quarksHistory), m = this.quarksHistory.length > 0 ? this.quarksHistory[this.quarksHistory.length - 1] : 0, h = `<style>
@keyframes hs-color_rotate {
    0%   { color: #ff5e00; }
    9%   { color: #ff9a00; }
    18%  { color: #ffcd00; }
    27%  { color: #e5ff00; }
    36%  { color: #a5ff00; }
    45%  { color: #00ffc8; }
    54%  { color: #00c8ff; }
    63%  { color: #00a5ff; }
    72%  { color: #9500ff; }
    81%  { color: #ff00e1; }
    90%  { color: #ff0095; }
    100% { color: #ff5e00; }
}

.hs-rainbow-text {
    color: #ff5e00;
    font-weight: bold;
    animation: hs-color_rotate 6s linear infinite;
}

.hs-export-btn {
    background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
    border: none;
    color: white;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    font-weight: bold;
    margin-top: 8px;
    width: 100%;
    transition: all 0.3s ease;
}

.hs-export-btn:hover {
    box-shadow: 0 4px 12px rgba(56, 239, 125, 0.4);
}

.hs-export-btn:active {
    transform: translateY(0);
}
</style>`; if (h += `<div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #444;">
            <div style="font-size: 11px; color: #888; margin-bottom: 4px;">CURRENT SINGULARITY</div>
            <div style="margin-bottom: 4px;">Time: <span style="color: #00E676; font-weight: bold; font-size: 16px;">${this.currentLiveTime.toFixed(1)}s</span></div>`, this._currentPhaseName) { let A = (performance.now() - this.currentPhaseStart) / 1e3; h += `<div>Phase: <span style="color: #FF6B6B; font-weight: bold;">${this._currentPhaseName}</span> (<span style="color: #FFD93D;">${A.toFixed(1)}s</span>)</div>` } if (h += "</div>", h += `<div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #444;">
            <div style="font-size: 11px; color: #888; margin-bottom: 4px;">PROGRESS</div>
            <div>Singularities: <span style="color: #4CAF50; font-weight: bold;">${e}</span></div>
        </div>`, m > 0 && (h += `<div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #444;">
                <div style="font-size: 11px; color: #888; margin-bottom: 4px;">QUARKS</div>
                <div style="margin-bottom: 4px;">Total: 
                    <span style="color: #00BCD4; font-weight: bold;">
                        ${this.formatNumber(m)}
                    </span>
                </div>`, d !== null && d > 0 && (h += `<div>Rate: 
                    <span style="color: #4DD0E1; font-weight: bold;">
                        ${this.formatNumber(d)}/s
                    </span>
                </div>`), h += "</div>"), u > 0 && (h += `<div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #444;">
                <div style="font-size: 11px; color: #888; margin-bottom: 4px;">GOLDEN QUARKS</div>
                <div style="margin-bottom: 4px;">Total: <span style="color: #FFD700; font-weight: bold;">${this.formatNumber(u)}</span></div>`, r !== null && r > 0 && (h += `<div>Rate: <span style="color: #ffbf00; font-weight: bold;">${this.formatNumber(r)}/s</span></div>`), h += "</div>"), h += `<div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #444;">
            <div style="font-size: 11px; color: #888; margin-bottom: 4px;">TIMING</div>`, t !== null && (h += `<div style="margin-bottom: 4px;">Last: <span style="color: #2196F3; font-weight: bold;">${t.toFixed(1)}s</span></div>`), a !== null && (h += `<div style="margin-bottom: 4px;">Avg (5): <span style="color: #9C27B0; font-weight: bold;">${a.toFixed(1)}s</span></div>`), n !== null && (h += `<div style="margin-bottom: 4px;">Avg (10): <span style="color: #19ae11; font-weight: bold;">${n.toFixed(1)}s</span></div>`), o !== null && (h += `<div style="margin-bottom: 4px;">Avg (50): <span style="color: #FF9800; font-weight: bold;">${o.toFixed(1)}s</span></div>`), i !== null && (h += `<div>Avg (All): <span class="hs-rainbow-text">${i.toFixed(1)}s</span></div>`), h += "</div>", this.phaseHistory.size > 0) {
                h += `<div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #444;">
                <div style="font-size: 11px; color: #888; margin-bottom: 4px;">PHASE STATISTICS</div>`; let A = Array.from(this.phaseHistory.entries()).sort((M, E) => M[1].totalTime - E[1].totalTime); for (let [M, E] of A) {
                    let f = this.getPhaseAverage(M); f !== null && (h += `<div style="margin-bottom: 2px; font-size: 12px;">
                        <span style="color: #B39DDB;">${M}</span>: 
                        <span style="color: #FFB74D; font-weight: bold;">${f.toFixed(1)}s</span>
                        <span style="color: #666;"> (${E.times.length}x)</span>
                        <span style="color: #4FC3F7;"> | Last: ${E.lastTime.toFixed(1)}s</span>
                    </div>`)
                } h += "</div>"
            } this.dynamicContent && (this.dynamicContent.innerHTML = h), this.updateExportButton()
        } show() { this.timerDisplay && (this.timerDisplay.style.display = "block") } hide() { this.timerDisplay && (this.timerDisplay.style.display = "none"), this.stopLiveTimer() } reset() { this.timestamps = [], this.quarksHistory = [], this.goldenQuarksHistory = [], this.startTime = 0, this.phaseHistory.clear(), this.singularityBundles = [], this.previousQuarks = 0, this.previousGoldenQuarks = 0, this.lastRecordedPhaseName = null, this.stopLiveTimer(), this.currentLiveTime = 0, this.updateDisplay() } destroy() { this.stopLiveTimer(), this.timerDisplay && this.timerDisplay.parentNode && this.timerDisplay.parentNode.removeChild(this.timerDisplay) }
    }; var Bt = { viscosity: 0, drought: 0, deflation: 0, extinction: 0, illiteracy: 0, recession: 0, dilation: 0, hyperchallenge: 0 }, We = class extends L {
        constructor() { super(...arguments); this.timerDisplay = null; this.autosingEnabled = !1; this.targetSingularity = 0; this.sleepTime = 20; this.challengeButtons = {}; this.ambrosia_early_cube = null; this.ambrosia_late_cube = null; this.ambrosia_quark = null; this.ambrosia_obtoff = null; this.ambrosia_ambrosia = null; this.antSacrifice = null; this.C11Unlocked = !1; this.C12Unlocked = !1; this.C13Unlocked = !1; this.C14Unlocked = !1; this.C15Unlocked = !1; this.timerModal = null; this.singTab2 = null } init() { c.log("Initializing HSAutosing module", this.context), this.autosingEnabled = !1, this.targetSingularity = 0, this.buildingsTab = document.getElementById("buildingstab"), this.challengeTab = document.getElementById("challengetab"), this.runesTab = document.getElementById("runestab"), this.corruptionsTab = document.getElementById("traitstab"), this.settingsTab = document.getElementById("settingstab"), this.singularityTab = document.getElementById("singularitytab"); for (let t = 1; t <= 15; t++) { let a = document.getElementById(`challenge${t}`); a && (this.challengeButtons[t] = a) } return this.exitTranscBtn = document.getElementById("challengebtn"), this.exitReincBtn = document.getElementById("reincarnatechallengebtn"), this.exitAscBtn = document.getElementById("ascendChallengeBtn"), this.ascendBtn = document.getElementById("ascendbtn"), this.antSacrifice = document.getElementById("antSacrifice"), this.coin = document.getElementById("buycoin1"), this.singTab2 = document.getElementById("toggleSingularitySubTab2"), !this.timerModal || !this.buildingsTab || !this.challengeTab || !this.settingsTab || !this.singularityTab || !this.challengeButtons || !this.exitAscBtn || !this.exitReincBtn ? (c.debug("Error during autosing initialization: could not find main tabs", this.context), Promise.resolve()) : (c.log("HSAutosing module initialized", this.context), Promise.resolve()) } isAutosingEnabled() { return this.autosingEnabled } subscribeGameDataChanges() { let t = D.getModule("HSGameData"); t && !this.gameDataSubscriptionId && (this.gameDataSubscriptionId = t.subscribeGameDataChange(this.gameDataCallback.bind(this)), c.log("Subscribed to game data changes for autosing", this.context)) } unsubscribeGameDataChanges() { let t = D.getModule("HSGameData"); t && this.gameDataSubscriptionId && (t.unsubscribeGameDataChange(this.gameDataSubscriptionId), this.gameDataSubscriptionId = void 0, c.log("Unsubscribed from game data changes for autosing", this.context)) } gameDataCallback() { return this.gameDataResolver && (this.gameDataResolver(), this.gameDataResolver = void 0), Promise.resolve() } async enableAutoSing() { this.autosingEnabled = !0, p.startDialogWatcher(); let t = C.getSetting("ambrosiaQuickBar"); if (t && !t.isEnabled()) return S.Notify("You need to enable the ambrosia quickbar setting before you can use autosing."), this.stopAutosing, Promise.resolve(); let a = C.getSetting("singularityNumber"); this.targetSingularity = a.getValue(), this.timerModal = new ze, this.timerModal && this.timerModal.show(), this.subscribeGameDataChanges(), new Promise(i => { this.gameDataResolver = i }); let n = D.getModule("HSGameDataAPI"); if (!n) return c.debug("Could not find HSGameDataAPI module", this.context), this.stopAutosing(), Promise.resolve(); let o = n.getGameData(); return o ? this.targetSingularity > o.highestSingularityCount ? (c.log("target singularity cannot be bigger than highest singularity"), this.stopAutosing(), Promise.resolve()) : (this.unsubscribeGameDataChanges(), this.performAutosingLogic(), c.log(`Autosing enabled for target singularity: ${this.targetSingularity}`, this.context), Promise.resolve()) : (c.debug("Could not get game data", this.context), this.stopAutosing(), Promise.resolve()) } async disableAutoSing() { return this.autosingEnabled = !1, this.stopAutosing(), this.timerModal && this.timerModal.hide(), c.log("Autosing disabled", this.context), Promise.resolve() } async performAutosingLogic() { let t = C.getSetting("autosingStrategy"), a = t.getValue(), n = t.getDefinition().settingControl; if (!n?.selectOptions) return S.Notify("Strategy selector not available", { notificationType: "warning" }), this.stopAutosing(), Promise.resolve(); let o = n.selectOptions.find(m => m.value.toString() === p.asString(a)); if (!o) return S.Notify("Selected strategy not found", { notificationType: "warning" }), this.stopAutosing(), Promise.resolve(); let i = C.getStrategies(); if (this.strategy = i.find(m => m.strategyName === o.text), !this.strategy) return S.Notify("Could not find strategy", { notificationType: "warning" }), this.stopAutosing(), Promise.resolve(); let r = C.getSetting("autosingEarlyCubeLoadout").getValue(), l = C.getSetting("autosingLateCubeLoadout").getValue(), u = C.getSetting("autosingQuarkLoadout").getValue(), d = C.getSetting("autosingObtOffLoadout").getValue(), g = C.getSetting("autosingAmbrosiaLoadout").getValue(); this.ambrosia_early_cube = document.getElementById(`hs-ambrosia-quickbar-blueberryLoadout${r}`), this.ambrosia_late_cube = document.getElementById(`hs-ambrosia-quickbar-blueberryLoadout${l}`), this.ambrosia_quark = document.getElementById(`hs-ambrosia-quickbar-blueberryLoadout${u}`), this.ambrosia_obtoff = document.getElementById(`hs-ambrosia-quickbar-blueberryLoadout${d}`), this.ambrosia_ambrosia = document.getElementById(`hs-ambrosia-quickbar-blueberryLoadout${g}`), (r === l || r === u || l === u) && S.Notify("Autosing Ambrosia loadout selection contains the same loadout twice", { notificationType: "warning" }); try { for (this.timerModal && this.timerModal.start(); this.isAutosingEnabled();) { await this.setAmbrosiaLoadout(this.ambrosia_quark), await p.click(this.ascendBtn), await this.performSingularity(); let m = !1; for (; this.isAutosingEnabled();) { let h = document.querySelector("#singularitybtn"); if (h) { let M = getComputedStyle(h).getPropertyValue("filter"), E = !M || M === "none"; if (E || (m = !0), m && E) { c.debug("Singularity button ACTIVATED!"); break } } let A = await this.getStage(); await this.matchStageToStrategy(A) } if (this.isAutosingEnabled()) { let h = this.getFinalStrategyPhase(); h && (c.debug(`Singularity activated \u2014 performing final phase: ${h.startPhase}-${h.endPhase}`, this.context), await this.matchStageToStrategy("final")) } } } catch (m) { let h = m instanceof Error ? m.message : String(m); c.debug(`Error during autosing logic: ${h}`, this.context), this.stopAutosing() } } getFinalStrategyPhase() { return !this.strategy || !this.strategy.strategy.length ? null : this.strategy.strategy[this.strategy.strategy.length - 1] } getPhaseIndex(t) { return q.indexOf(t) } isInChallenge(t) { return !!document.getElementById(`challenge${t}`)?.classList.contains("challengeActive") } isInAmbLoadout(t) { return !!t?.classList.contains("hs-ambrosia-active-slot") } async matchStageToStrategy(t) { if (!t || !this.strategy) return; let a = null; if (t.toLowerCase() === "final") { if (a = this.getFinalStrategyPhase(), !a) { c.log("No final strategy phase found", this.context); return } } else { let n = null, o = null; for (let l of q) { if (!t.startsWith(`${l}-`)) continue; let u = t.slice(l.length + 1); if (this.isPhaseOption(u)) { n = l, o = u; break } } if (!n || !o) { c.debug(`Invalid stage format ${t}`, this.context); return } let i = this.getPhaseIndex(n), r = this.getPhaseIndex(o); if (i === -1 || r === -1) { c.debug(`Unknown stage ${t}`, this.context); return } if (a = this.strategy.strategy.find(l => { let u = this.getPhaseIndex(l.startPhase), d = this.getPhaseIndex(l.endPhase); return u === -1 || d === -1 ? !1 : i >= u && r <= d }) ?? null, !a) { c.debug(`No strategy phase matched for stage ${t}`, this.context); return } } c.debug(`executing phase: ${a.startPhase}-${a.endPhase}`, this.context), this.timerModal && this.timerModal.setCurrentPhase(a.startPhase + "-" + a.endPhase), await this.executePhase(a) } isPhaseOption(t) { return q.includes(t) } async executePhase(t) {
            await this.setCorruptions(t.corruptions), this.challengeTab.click(); for (let a = 0; a < t.strat.length; a++) {
                if (!this.autosingEnabled) return; let n = t.strat[a]; if (n.challengeNumber == 201) await this.setCorruptions(t.corruptions); else if (n.challengeNumber == 200) { let o = n.ifJump?.ifJumpOperator, i = this.getChallengeCompletions(n.ifJump?.ifJumpChallenge ?? -1); switch (o) { case ">": i > (n.ifJump?.ifJumpValue ?? 0) && n.ifJump?.ifJumpIndex !== void 0 && (a = n.ifJump?.ifJumpIndex - 1); break; case "<": i < (n.ifJump?.ifJumpValue ?? 0) && n.ifJump?.ifJumpIndex !== void 0 && (a = n.ifJump?.ifJumpIndex - 1); break; default: break } } else if (n.challengeNumber >= 100) { c.debug(`Autosing: Performing special action: ${ie.find(o => o.value === n.challengeNumber)?.label ?? n.challengeNumber}`, this.context), await p.sleep(n.challengeWaitTime), await this.performSpecialAction(n.challengeNumber); continue } else n.challengeNumber >= 11 && n.challengeNumber <= 15 && await this.ensureChallengeUnlocked(n.challengeNumber), c.debug(`Autosing: waiting for: ${n.challengeCompletions ?? 0} completions of challenge${n.challengeNumber}, after reaching goal waiting ${n.challengeWaitTime}ms inside 
MAX TIME: ${n.challengeMaxTime}ms and waiting outside: ${n.challengeWaitAfter}ms`, this.context), await this.waitForCompletion(n.challengeNumber, n.challengeCompletions ?? 0, n.challengeMaxTime, n.challengeWaitTime), n.challengeWaitAfter && n.challengeWaitAfter > 0 && (n.challengeNumber <= 5 ? (await p.click(this.exitTranscBtn), await p.sleep(n.challengeWaitAfter)) : n.challengeNumber <= 10 ? (await p.click(this.exitReincBtn), await p.sleep(n.challengeWaitAfter)) : (await p.click(this.exitAscBtn), await p.sleep(n.challengeWaitAfter)))
            } this.timerModal && this.timerModal.recordPhase(`${t.startPhase}-${t.endPhase}`)
        } async performSpecialAction(t) { switch (t) { case 101: await p.click(this.exitTranscBtn); break; case 102: await p.click(this.exitReincBtn); break; case 103: await p.click(this.exitAscBtn); break; case 104: await p.click(this.ascendBtn); break; case 105: this.ambrosia_early_cube && await this.setAmbrosiaLoadout(this.ambrosia_early_cube); break; case 106: this.ambrosia_late_cube && await this.setAmbrosiaLoadout(this.ambrosia_late_cube); break; case 107: this.ambrosia_quark && await this.setAmbrosiaLoadout(this.ambrosia_quark); break; case 108: this.antSacrifice && await p.click(this.antSacrifice); break; case 109: let a = { viscosity: 16, drought: 0, deflation: 16, extinction: 0, illiteracy: 5, recession: 16, dilation: 0, hyperchallenge: 16 }; await this.setCorruptions(a); break; case 110: await this.setCorruptions(Bt); break; case 111: break; case 112: this.ambrosia_obtoff && await this.setAmbrosiaLoadout(this.ambrosia_obtoff); break; case 113: this.ambrosia_ambrosia && await this.setAmbrosiaLoadout(this.ambrosia_ambrosia); break; default: c.log(`Unknown special action ${t}`, this.context) } } async setAmbrosiaLoadout(t) { for (; !this.isInAmbLoadout(t);)await p.click(t), await p.sleep(this.sleepTime) } stringifyCorruptions(t) { return [t.viscosity, t.drought, t.deflation, t.extinction, t.illiteracy, t.recession, t.dilation, t.hyperchallenge].join(",") } async setCorruptions(t) { let a = 0, n = document.querySelector("#corruptionLoadoutTable button.corrImport"); n || c.debug("Error: could not access corruption import button", this.context); let o = { viscosity: t.viscosity, drought: t.drought, deflation: t.deflation, extinction: t.extinction, illiteracy: t.illiteracy, recession: t.recession, dilation: t.dilation, hyperchallenge: t.hyperchallenge }; for (; JSON.stringify(p.getCorruptions("current")) !== JSON.stringify(t);) { if (a >= 10) { c.log("Could not set corruptions", this.context); break } a += 1, n.click(); let i = document.getElementById("prompt_text"); i || c.debug("Error: could not access prompt input", this.context), i.value = JSON.stringify(o); let r = document.getElementById("ok_prompt"); await p.click(r), await p.click(this.ascendBtn) } a < 10 && c.debug(`Corruptions: ${this.stringifyCorruptions(t)} set`, this.context) } stopAutosing() { this.autosingEnabled = !1, this.unsubscribeGameDataChanges(), C.getSetting("startAutosing").disable(), this.timerModal && this.timerModal.hide(), p.stopDialogWatcher() } async getStage() { await p.click(this.settingsTab); let t = document.getElementById("switchSettingSubTab4"); t || (c.debug("Error during autosing logic: could not access settings to read stage", this.context), this.stopAutosing()); let a = document.getElementById("kMisc"); a || (c.debug("Error during autosing logic: could not access settings to read stage", this.context), this.stopAutosing()); let n = await p.waitForElement("gameStageStatistic"); n || (c.debug("Error during autosing logic: could not access settings to read stage", this.context), this.stopAutosing()), await new Promise(r => { let l = !1, u = new MutationObserver(() => { l || (l = !0, u.disconnect(), r()) }); u.observe(n, { childList: !0, subtree: !0, characterData: !0 }), t.click(), a.click(), setTimeout(() => { u.disconnect(), r() }, 2e3) }), await p.waitForInnerText(n, r => /Current Game Section:/.test(r)); let o = new RegExp("Current Game Section: (.*)"), i = n.innerText.match(o); return i ? (c.debug(`Found stage: ${i[1].trim()} in settings`), i[1].trim()) : (console.error("Could not find game stage"), "") } async enterAndLeaveExalt() { let t = document.getElementById("oneChallengeCap"), a = document.getElementById("ascSingChallengeTimeTakenStats"); if (!t) { c.debug("Error: Exalt 2 button not found", this.context), this.stopAutosing(); return } let n = () => window.getComputedStyle(a).display !== "none"; for (; !n();)await p.click(t), await p.sleep(this.sleepTime); for (; n();)await p.click(t), await p.sleep(this.sleepTime) } async getCurrentGoldenQuarks() { await p.click(this.singularityTab), this.singTab2 && await p.click(this.singTab2); let t = document.getElementById("goldenQuarkamount"); if (!t) return c.debug("Error: could not find golden quarks display element", this.context), 0; await new Promise(l => { if (t.textContent?.trim()) return l(); let u = new MutationObserver(() => { let d = t.textContent?.trim(); d && d.length > 0 && (u.disconnect(), l()) }); u.observe(t, { childList: !0, subtree: !0, characterData: !0 }), setTimeout(() => { u.disconnect(), l() }, 3e3) }); let a = t.textContent || "", n = /\d+(\.\d+)?[eE][+-]?\d+/, o = /\d+(\.\d+)?/, i = a.match(n) || a.match(o); if (!i) return c.debug(`Still no number found in text: "${a}"`, this.context), 0; let r = parseFloat(i[0]); return c.debug(`Current Golden Quarks: ${r}`, this.context), isNaN(r) ? 0 : r } async getCurrentQuarks() { let t = document.getElementById("quarkDisplay"); if (!t) return 0; let a = t.textContent, n = parseFloat(a); return c.debug(`Current Quarks: ${n}`, this.context), isNaN(n) ? 0 : n } async performSingularity() { await this.enterAndLeaveExalt(); let t = await this.getCurrentGoldenQuarks(), a = await this.getCurrentQuarks(); this.timerModal && this.timerModal.recordSingularity(a, t), this.C11Unlocked = !1, this.C12Unlocked = !1, this.C13Unlocked = !1, this.C14Unlocked = !1, this.C15Unlocked = !1; let n = document.getElementById("elevatorTargetInput"); n || (c.debug("Error during autosing logic: elevator input not found", this.context), this.stopAutosing()), n.value = this.targetSingularity.toString(), n.dispatchEvent(new Event("input", { bubbles: !0 })); let o = document.getElementById("elevatorTeleportButton"); o || (c.debug("Error during autosing logic: elevator teleport button button not found", this.context), this.stopAutosing()), await p.click(o), await this.buyCoin(), c.debug("Singularity performed", this.context); let i = await this.getStage(); for (; !Object.values(it).some(r => i.includes(r));)await p.sleep(5), i = await this.getStage(); return Promise.resolve() } async buyCoin() { let t = "0"; for (; p.isBiggerThan1000(t);) { await p.click(this.coin); let a = document.getElementById("coinDisplay"); a || c.debug("Error: Could not buy coin building", this.context), t = a.textContent } } getChallengeCompletions(t) { let a = document.getElementById(`challenge${t}level`); return a ? this.parseNumber(a.innerText) : 0 } getChallengeGoal(t) { let a = document.getElementById(`challenge${t}level`); if (!a) return 0; let n = a.innerText; if (n.includes("/")) { let o = n.split("/"); return this.parseNumber(o[1].trim()) } return 9999 } getActiveC11to14Challenge() { for (let t = 11; t <= 14; t++)if (this.isInChallenge(t)) return t; return null } async waitForCompletion(t, a, n = 99999999, o = 0) { let r = this.challengeButtons[t], l = performance.now(); for (; !this.isInChallenge(t) && performance.now() - l < n;) { if (!this.isAutosingEnabled()) return this.stopAutosing(), Promise.resolve(); if (!r) return c.debug(`Challenge button ${t} not found`, this.context), Promise.resolve(); await p.DblClick(r), await p.sleep(20) } if (l = performance.now(), !this.isInChallenge(t)) return c.debug(`Timeout: Failed to enter challenge ${t}`, this.context), Promise.resolve(); for (this.markChallengeUnlocked(t); performance.now() - l < n;) { if (!this.isAutosingEnabled()) return this.stopAutosing(), Promise.resolve(); let u = this.getChallengeCompletions(t), d = this.getChallengeGoal(t); if (u >= d || u >= a) if (t === 10) { let g = this.getActiveC11to14Challenge(); if (g !== null) { let m = this.getChallengeGoal(g), h = this.getChallengeCompletions(g); for (; ;) { await p.sleep(10); let A = this.getChallengeCompletions(g); if (A == h) return Promise.resolve(); h = A } } else return Promise.resolve() } else return u >= a && o > 0 && await p.sleep(o), Promise.resolve(); await p.sleep(10) } c.debug(`Timeout: Challenge ${t} failed to reach ${a} completions within ${n}ms`) } parseNumber(t) { let a = t.replace(/,/g, "").trim(); a.includes("/") && (a = a.split("/")[0]); let n = Number(a); return isNaN(n) ? 0 : n } isChallengeUnlocked(t) { switch (t) { case 11: return this.C11Unlocked; case 12: return this.C12Unlocked; case 13: return this.C13Unlocked; case 14: return this.C14Unlocked; case 15: return this.C15Unlocked; default: return !0 } } markChallengeUnlocked(t) { switch (t) { case 10: this.C11Unlocked = !0; break; case 11: this.C12Unlocked = !0; break; case 12: this.C13Unlocked = !0; break; case 13: this.C14Unlocked = !0; break; case 14: this.C15Unlocked = !0; break } } async ensureChallengeUnlocked(t) { if (this.isChallengeUnlocked(t)) return; c.debug(`Ensuring unlock path for c${t}`); let a = { 11: [10], 12: [11, 10], 13: [12, 10], 14: [13, 10], 15: [14, 10] }; await this.setCorruptions(Bt); for (let n = 11; n <= t; n++) { let o = a[n]; if (o) for (let i of o) c.debug(`Running prerequisite c${i} for c${n}`, this.context), i === 10 ? await this.waitForCompletion(i, 1, 6e4, 500) : await this.waitForCompletion(i, 0, 6e4, 0) } } async waitForSingularityActivation() { return new Promise(t => { let a = document.querySelector("#singularitybtn"); if (!a) { t(!1); return } let n = () => { let r = getComputedStyle(a).getPropertyValue("filter"); return !r || r === "none" }, o = !n(), i = new MutationObserver(() => { if (!this.isAutosingEnabled()) { i.disconnect(), t(!1); return } let r = n(); if (!r) { o = !0; return } o && r && (i.disconnect(), c.debug("Singularity button ACTIVATED!", this.context), t(!0)) }); i.observe(a, { attributes: !0, attributeFilter: ["style", "class"] }) }) }
    }; var Ze = class extends L { #e; #t; #a; #r; #i; constructor(e) { super(e), this.#e = document.getElementById("offeringPotionHide"), this.#t = document.getElementById("obtainiumPotionHide"), this.#a = { attributes: !1, childList: !0, subtree: !0 }, this.#r = new MutationObserver((t, a) => { this.#n(t, a) }), this.#i = new MutationObserver((t, a) => { this.#o(t, a) }) } async init() { c.log("Initialising HSPotions module", this.context), this.observe(), this.isInitialized = !0 } observe() { this.#r.observe(this.#e, this.#a), this.#i.observe(this.#t, this.#a) } #n(e, t) { if (document.getElementById("offeringPotionMultiUseButton") === null) { let n = document.getElementById("useofferingpotion"), o = document.getElementById("buyofferingpotion"); if (!n || !o) { c.warn("Could not find native buttons for use/buy offering potions", this.context); return } if (n) { let i = n.cloneNode(!0); i.id = "offeringPotionMultiUseButton", i.textContent = "CONSUME 10x", i.addEventListener("click", () => { for (let r = 0; r < 10; r++)n.click() }), n.parentNode?.insertBefore(i, n.nextSibling) } if (o) { let i = o.cloneNode(!0); i.id = "offeringPotionMultiBuyButton", i.textContent = "BUY 10x", i.addEventListener("click", () => { for (let r = 0; r < 10; r++)o.click(), setTimeout(() => { document.getElementById("ok_confirm")?.click() }, 1) }), o.parentNode?.insertBefore(i, o.nextSibling) } this.#r.disconnect(), c.log("Offering potion multi buy / consume buttons injected", this.context) } } #o(e, t) { if (document.getElementById("obtainiumPotionMultiUseButton") === null) { let n = document.getElementById("useobtainiumpotion"), o = document.getElementById("buyobtainiumpotion"); if (!n || !o) { c.warn("Could not find native buttons for use/buy obtainium potions", this.context); return } if (n) { let i = n.cloneNode(!0); i.id = "obtainiumPotionMultiUseButton", i.textContent = "CONSUME 10x", i.addEventListener("click", () => { for (let r = 0; r < 10; r++)n.click() }), n.parentNode?.insertBefore(i, n.nextSibling) } if (o) { let i = o.cloneNode(!0); i.id = "obtainiumPotionMultiBuyButton", i.textContent = "BUY 10x", i.addEventListener("click", () => { for (let r = 0; r < 10; r++)o.click(), setTimeout(() => { document.getElementById("ok_confirm")?.click() }, 1) }), o.parentNode?.insertBefore(i, o.nextSibling) } this.#i.disconnect(), c.log("Obtainium potion multi buy / consume buttons injected", this.context) } } }; var D = class s { #e = "HSModuleManager"; #t = []; static #a = new Map; #r = { HSUI: S, HSCodes: be, HSHepteracts: ke, HSTalismans: Te, HSSettings: C, HSPrototypes: xe, HSMouse: ee, HSShadowDOM: He, HSStorage: Be, HSAmbrosia: Le, HSStats: Re, HSGameState: Ge, HSPatches: Oe, HSGameData: Ve, HSGameDataAPI: oe, HSWebSocket: Je, HSDebug: Fe, HSAutosing: We, HSQOLButtons: Ze }; constructor(e, t) { this.#e = e, this.#t = t, c.log("Enabling Hypersynergism modules", this.#e), this.#t.sort((a, n) => a.loadOrder === void 0 ? 1 : n.loadOrder === void 0 ? -1 : a.loadOrder - n.loadOrder) } async preprocessModules() { let e = []; for (let t of this.#t) { if (e.includes(t.className)) { c.warn(`Module "${t.className}" is already enabled - there is probably a duplicate module in enabledModules (index.ts)!`, this.#e); return } let a = this.addModule(t); if (t.initImmediate !== void 0 && t.initImmediate === !0 && a && (await a.init(), t.className === "HSUI")) { let n = a; await c.integrateToUI(n) } e.push(t.className) } } addModule(e) { if (e.moduleType === 2) try { let t = e.moduleName || e.context; if (!e.moduleKind) throw new Error(`Failed to add module ${t} because moduleKind is not defined`); if (!e.scriptContext) throw new Error(`Failed to add module ${t} because scriptContext is not defined`); let a = new Ae({ moduleName: t, context: e.context, moduleColor: e.moduleColor, moduleKind: e.moduleKind, moduleCSSUrl: e.moduleCSSUrl, moduleScriptUrl: e.moduleScriptUrl, scriptContext: e.scriptContext }); return s.#a.set(e.className, a), e.moduleColor && typeof String.prototype.colorTag == "function" ? c.log(`Enabled EXTERNAL module '${t.colorTag(e.moduleColor)}'`, this.#e) : c.log(`Enabled EXTERNAL module '${t}'`, this.#e), s.#a.get(e.className) } catch (t) { c.warn(`Failed to add module ${e.className}:`, this.#e), console.log(t); return } else try { let t = this.#r[e.className]; if (!t) throw new Error(`Class "${e.className}" not found in module`); let a = e.moduleName || e.context, n = new t({ moduleName: a, context: e.context, moduleColor: e.moduleColor }); return s.#a.set(e.className, n), e.moduleColor && typeof String.prototype.colorTag == "function" ? c.log(`Enabled module '${a.colorTag(e.moduleColor)}'`, e.context) : c.log(`Enabled module '${a}'`, e.context), s.#a.get(e.className) } catch (t) { c.warn(`Failed to add module ${e.className}:`, this.#e), console.log(t); return } } async initModules() { s.#a.forEach; for (let [e, t] of s.#a.entries()) t.isInitialized || await t.init() } getModules() { return s.#a } static getModule(e) { return s.#a.get(e) } }; var c = class s {
        static #e = "HSLogger"; static #t = !1; static #a; static #r = -1; static #i = !1; static #n = new Map; static #o; static async integrateToUI(e) { let t = await e.getLogElement(); t && (this.#a = t, this.#t = !0, this.log("HSLogger integrated to UI", "HSLogger")) } static #s(e, t = "HSMain", a = 1) {
            if (this.#t) {
                let n = document.createElement("div"); n.classList.add("hs-ui-log-line"); let o = ""; switch (a) { case 1: o = ""; break; case 4: n.classList.add("hs-ui-log-line-info"), o = ""; break; case 2: o = "WARN ", n.classList.add("hs-ui-log-line-warn"); break; case 3: o = "ERROR ", n.classList.add("hs-ui-log-line-error"); break; case 5: o = "DBG ", n.classList.add("hs-ui-log-line-debug"); break; default: o = ""; break }let i = this.#i ? "" : "hs-log-ts-hidden", r = D.getModule(t), l = r && r.moduleColor ? p.parseColorTags(t.colorTag(r.moduleColor)) : t; n.innerHTML = `${o} [<span class="hs-log-ctx">${l}</span><span class="hs-log-ts ${i}"> (${p.getTime()})</span>]: ${p.parseColorTags(e)}
`; let u = p.hashCode(`${o}${l}${e}`); if (this.#r !== u) this.#a.appendChild(n); else { let g = this.#a.querySelector("div:last-child"); if (g) try { let m = g.innerHTML.match(/\(x(\d+)\)/); if (m) { let h = m[0], A = parseInt(m[1], 10); g.innerHTML = g.innerHTML.replace(h, `(x${A + 1})`) } else g.innerHTML += " (x2)" } catch (m) { console.log(m) } } let d = this.#a.querySelectorAll(".hs-ui-log-line"); if (d && d.length > b.HSLogger.logSize) { let g = this.#a.querySelector(".hs-ui-log-line:first-child"); g && g.parentElement?.removeChild(g) } s.scrollToBottom(), this.#r = u
            }
        } static #l(e, t) { let a = b.HSLogger.logLevel; if (a === 1 || t) return !0; if (a === 6) return !1; switch (e) { case 1: return a === 4 || a === 5; case 2: return a === 2 || a === 8; case 3: return a === 2 || a === 3; case 4: return a === 7 || a === 5; case 5: return !1 } } static scrollToBottom() { this.#t && this.#a && (this.#a.scrollTop = this.#a.scrollHeight) } static log(e, t = "HSMain", a = !1) { this.#l(1, a) && (console.log(`[${t}]: ${p.removeColorTags(e)}`), this.#s(e, t, 1)) } static info(e, t = "HSMain", a = !1) { this.#l(4, a) && (console.log(`[${t}]: ${p.removeColorTags(e)}`), this.#s(e, t, 4)) } static warn(e, t = "HSMain", a = !1) { this.#l(2, a) && (console.warn(`[${t}]: ${p.removeColorTags(e)}`), this.#s(e, t, 2)) } static error(e, t = "HSMain", a = !1) { this.#l(3, a) && (console.error(`[${t}]: ${p.removeColorTags(e)}`), this.#s(e, t, 3)) } static debug(e, t = "HSMain", a = !1) { let n = C.getSetting("showDebugLogs"); n && n.getValue() && (console.log(`DBG [${t}]: ${p.removeColorTags(e)}`), this.#s(e, t, 5)) } static clear() { this.#t && (this.#a.innerHTML = "", s.log("Log cleared", this.#e)) } static logOnce(e, t) { !this.#n.has(t) || !this.#n.get(t)?.logged ? (this.#n.set(t, { logged: !0, timestamp: Date.now(), level: 1, count: 0 }), this.log(e, "Once", !0)) : this.#n.get(t).count++, this.#u() } static warnOnce(e, t) { !this.#n.has(t) || !this.#n.get(t)?.logged ? (this.#n.set(t, { logged: !0, timestamp: Date.now(), level: 2, count: 0 }), this.warn(e, "Once", !0)) : this.#n.get(t).count++, this.#u() } static errorOnce(e, t) { !this.#n.has(t) || !this.#n.get(t)?.logged ? (this.#n.set(t, { logged: !0, timestamp: Date.now(), level: 3, count: 0 }), this.error(e, "Once", !0)) : this.#n.get(t).count++, this.#u() } static #u() { } static setTimestampDisplay(e) { e ? this.#i = !0 : this.#i = !1; let t = this.#a.querySelectorAll(".hs-ui-log-line"); if (t) for (let a of Array.from(t)) { let n = a.querySelector(".hs-log-ts"); n && (e ? n.classList.remove("hs-log-ts-hidden") : n.classList.add("hs-log-ts-hidden")) } }
    }; var Lt = "data:image/png;base64,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"; var Rt = "data:image/png;base64,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"; var Gt = ` #hs-ambrosia-quick-loadout-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    padding: 0px;
    width: auto;
    gap: 4px;
    flex-direction: row;
    align-self: flex-end;
    margin: 0px 4% 10px 0px;
    border: 0px solid #4f86f7;
 }

 #hs-ambrosia-extra-btn {
    border: 2px solid orange;
 }`; var je = class {
        #e = "HSMain"; #t; #a; #r; constructor(e) { this.#t = new D("HSModuleManager", e) } async preprocessModules() { await this.#t.preprocessModules() } async init() { c.log("Initialising Hypersynergism modules", this.#e), await this.#t.initModules(), c.log("Building UI Panel", this.#e), this.#i(), c.log("Injecting style overrides", this.#e), this.#n(), await C.syncSettings(), await S.Notify(`Hypersynergism v${b.General.currentModVersion} loaded`, { position: "top", notificationType: "success" }), this.#a = setInterval(async () => { let e = await ae.getLatestRelease(); e && c.debug(`Latest release: ${e.name} (${e.version})`, this.#e) }, b.PrivateAPI.checkIntervalMs) } #i() { let e = D.getModule("HSUI"); e && (e.updateTitle(`Hypersynergism v${b.General.currentModVersion}`), this.#o(e), this.#s(e), this.#l(e), e.renameTab(2, "Tools"), e.renameTab(3, "Settings"), e.renameTab(4, "Debug")) } #n() { S.injectStyle(Gt, "hs-override-css") } #o(e) {
            let t = oe.getCalculationDefinitions({ toolingSupport: "true" }).map(r => ({ text: r.supportsReduce ? `${r.calculationName} (C)` : r.calculationName, value: r.supportsReduce ? `${r.fnName}|c` : r.fnName })); e.replaceTabContents(2, x.Grid({
                html: [x.Div({ html: "Export tools", styles: { borderBottom: "1px solid limegreen", gridColumn: "span 2" } }), x.Div({ id: "hs-panel-amb-heater-p", html: `Export an extended save file string for the <a href="${b.General.heaterUrl}" class="hs-link" target="_blank">Ambrosia Heater.</a>`, styles: { gridColumn: "span 2" } }), x.Button({ id: "hs-panel-amb-heater-btn", text: "Ambrosia heater" }), x.Div({ html: "References", styles: { borderBottom: "1px solid limegreen", gridColumn: "span 2" } }), x.Button({ id: "hs-panel-cor-ref-btn", text: "Corruption Ref." }), x.Button({ id: "hs-panel-cor-ref-btn-2", text: "Crpt. Onemind" }), x.Div({ html: "Mod links", styles: { borderBottom: "1px solid limegreen", gridColumn: "span 2" } }), x.Button({ id: "hs-panel-mod-github-btn", text: "Mod Github" }), x.Button({ id: "hs-panel-mod-wiki-btn", text: "Mod Wiki" }), x.Button({ id: "hs-panel-mod-wiki_features-btn", text: "Mod Features" }), x.Button({ id: "hs-panel-mod-website-btn", text: "Mod Website" }), x.Div({ html: "Other tools", styles: { borderBottom: "1px solid limegreen", gridColumn: "span 2" } }), x.Button({ id: "hs-panel-dump-settings-btn", text: "Dump Settings" }), x.Button({ id: "hs-panel-dump-gamedata-btn", text: "Dump Game vars" }), x.Button({ id: "hs-panel-clear-settings-btn", text: "CLEAR SETTINGS", styles: { borderColor: "red" } }), x.Button({ id: "hs-panel-check-version-btn", text: "CHECK VERSION" }), x.Div({ html: "Testing tools", styles: { borderBottom: "1px solid limegreen", gridColumn: "span 2" } }), x.Button({ id: "hs-panel-test-notify-btn", text: "Notify test" }), x.Button({ id: "hs-panel-test-notify-long-btn", text: "Notify test 2" }), x.Div({ html: "Calculation tools", styles: { borderBottom: "1px solid limegreen", gridColumn: "span 2" } }), x.Div({
                    id: "hs-panel-calc-tools-p", html: `Execute supported calculations and see their results. Calculations denoted with "(C)" support "calculating by components",
                        meaning that the calculation results can be output as an array of components that make up the calculations.<br><br>
                        Note that calculating by components always clears the calculation cache first.`, styles: { gridColumn: "span 2", fontSize: "10pt" }
                }), x.Select({ class: "hs-panel-setting-block-select-input", id: "hs-panel-test-calc-sel", type: 4, styles: { gridColumn: "span 2" } }, t), x.Button({ id: "hs-panel-test-calc-redu-btn", text: "Calculate reduced", styles: { width: "auto" } }), x.Button({ id: "hs-panel-test-calc-comps-btn", text: "Calculate components", styles: { width: "auto" } }), x.Button({ id: "hs-panel-test-calc-cache-clear-btn", text: "Clear cache" }), x.Button({ id: "hs-panel-test-calc-cache-dump-btn", text: "Dump cache" }), x.Div({ id: "hs-panel-test-calc-latest", styles: { gridColumn: "span 2" } })], styles: { gridTemplateColumns: "repeat(2, 1fr)", gridTemplateRows: "1fr", columnGap: "5px", rowGap: "10px", padding: "5px" }
            })), document.querySelector("#hs-panel-amb-heater-btn")?.addEventListener("click", async () => { let r = D.getModule("HSGameDataAPI"); if (r) { let l = await r.dumpDataForHeater(); if (l) { let u = JSON.stringify(l), d = btoa(u), g = p.base64WithCRLF(d); await navigator.clipboard.writeText(g), S.Notify("Ambrosia heater data copied to clipboard", { position: "top", notificationType: "success" }) } } }), document.querySelector("#hs-panel-cor-ref-btn")?.addEventListener("click", () => { e.Modal({ htmlContent: `<img class="hs-modal-img" src="${Lt}" />`, needsToLoad: !0 }) }), document.querySelector("#hs-panel-cor-ref-btn-2")?.addEventListener("click", () => { e.Modal({ htmlContent: `<img class="hs-modal-img" src="${Rt}" />`, needsToLoad: !0 }) }), document.querySelector("#hs-panel-mod-github-btn")?.addEventListener("click", () => { window.open(b.General.modGithubUrl, "_blank") }), document.querySelector("#hs-panel-mod-wiki-btn")?.addEventListener("click", () => { window.open(b.General.modWikiUrl, "_blank") }), document.querySelector("#hs-panel-mod-wiki_features-btn")?.addEventListener("click", () => { window.open(b.General.modWikiFeaturesUrl, "_blank") }), document.querySelector("#hs-panel-mod-website-btn")?.addEventListener("click", () => { window.open(b.General.modWebsiteUrl, "_blank") }), document.querySelector("#hs-panel-dump-settings-btn")?.addEventListener("click", () => { C.dumpToConsole() }), document.querySelector("#hs-panel-dump-gamedata-btn")?.addEventListener("click", () => { let r = D.getModule("HSGameDataAPI"); r && (console.log("----- GAME DATA -----"), console.log(r.getGameData()), console.log("----- PSEUDO DATA -----"), console.log(r.getPseudoData()), console.log("----- CAMPAIGN DATA -----"), console.log(r.getCampaignData()), console.log("----- ME DATA -----"), console.log(r.getMeData()), console.log("----- EVENT DATA -----"), console.log(r.getEventData())) }), document.querySelector("#hs-panel-clear-settings-btn")?.addEventListener("click", () => { let r = D.getModule("HSStorage"); r && (r.clearData(b.HSSettings.storageKey), c.info("Stored settings cleared", this.#e)) }), document.querySelector("#hs-panel-check-version-btn")?.addEventListener("click", async () => { await p.isLatestVersion() ? S.Notify("You are using the latest version of Hypersynergism!", { position: "top", notificationType: "success" }) : S.Notify("You are not using the latest version of Hypersynergism!", { position: "top", notificationType: "warning" }) }), document.querySelector("#hs-panel-test-calc-redu-btn")?.addEventListener("click", () => { let r = D.getModule("HSGameDataAPI"), l = document.querySelector("#hs-panel-test-calc-sel"); if (r && l) { let u = l.value.split("|")[0]; if (typeof r[u] == "function") { let d = r[u](); console.log(`--- CALCULATED ${u} ---`), console.log(d); let g = document.querySelector("#hs-panel-test-calc-latest"); g && (g.innerText = `Last calc result: ${p.N(d)}`) } else c.warn(`${u} is not a function`, this.#e) } else c.warn("dataModule or calculation select was null", this.#e) }), document.querySelector("#hs-panel-test-calc-comps-btn")?.addEventListener("click", () => { let r = D.getModule("HSGameDataAPI"), l = document.querySelector("#hs-panel-test-calc-sel"); if (r && l) { let u = l.value.split("|"), d = u[0], g = u.includes("c"); if (typeof r[d] == "function") if (g) { r.clearCache(); let m = r[d](!1), h = document.querySelector("#hs-panel-test-calc-latest"); h && (h.innerText = `Last calc result: [${m.toString().split(",").join(", ")}]`), console.log(`--- CALCULATED ${d} ---`), console.log(m) } else c.warn(`${d} cannot be calculated by components`, this.#e); else c.warn(`${d} is not a function`, this.#e) } else c.warn("dataModule or calculation select was null", this.#e) }), document.querySelector("#hs-panel-test-calc-cache-clear-btn")?.addEventListener("click", () => { let r = D.getModule("HSGameDataAPI"); r && (c.info("Cleared calculation cache", this.#e), r.clearCache()) }), document.querySelector("#hs-panel-test-calc-cache-dump-btn")?.addEventListener("click", () => { let r = D.getModule("HSGameDataAPI"); r && (c.info("Calculation cache dump", this.#e), r.dumpCache()) }); let a = ["topLeft", "top", "topRight", "right", "bottomRight", "bottom", "bottomLeft", "left"], n = ["default", "warning", "error", "success"], o = -1, i = -1; document.querySelector("#hs-panel-test-notify-btn")?.addEventListener("click", async () => { o++, i++, o > a.length - 1 && (o = 0), i > n.length - 1 && (i = 0), await S.Notify("Test notification", { position: a[o], notificationType: n[i] }) }), document.querySelector("#hs-panel-test-notify-long-btn")?.addEventListener("click", async () => { o++, i++, o > a.length - 1 && (o = 0), i > n.length - 1 && (i = 0), await S.Notify("This is a really very extremely long test notification which tests if the notification works with a long notification test notification ", { position: a[o], notificationType: n[i] }) })
        } #s(e) { let t = C.autoBuildSettingsUI(); t.didBuild && (e.replaceTabContents(3, [t.navHTML, t.pagesHTML].join("")), document.delegateEventListener("click", ".hs-panel-setting-block-gamedata-icon", a => { let n = document.querySelector("#hs-panel-settings-subtab-gamedata"), o = n.dataset.color, i = document.querySelector("#settings-grid-gamedata"), r = document.querySelectorAll(".hs-panel-settings-grid"), l = document.querySelectorAll(".hs-panel-subtab"); n && i && r && l && (r.forEach(d => { d.classList.remove("open") }), l.forEach(d => { d.style.backgroundColor = "" }), i.classList.add("open"), o && o.length > 0 && (n.style.backgroundColor = o)), document.querySelector("#hs-setting-block-gamedata").scrollIntoView({ block: "start", behavior: "smooth" }) }), document.delegateEventListener("click", ".hs-panel-subtab", a => { let n = a.target, o = n.dataset.subtab, i = n.dataset.color; if (o) { let r = `#settings-grid-${o}`, l = document.querySelector(r), u = document.querySelectorAll(".hs-panel-settings-grid"), d = document.querySelectorAll(".hs-panel-subtab"); l && u && d && (u.forEach(g => { g.classList.remove("open") }), d.forEach(g => { g.style.backgroundColor = "" }), l.classList.add("open"), i && i.length > 0 && (n.style.backgroundColor = i)) } })) } #l(e) { e.replaceTabContents(4, x.Grid({ html: [x.Div({ html: "Mouse", styles: { borderBottom: "1px solid limegreen", gridColumn: "span 2" } }), x.Div({ id: "hs-panel-debug-mousepos" }), x.Div({ html: "Game Data", styles: { borderBottom: "1px solid limegreen", gridColumn: "span 2" } }), x.Div({ id: "hs-panel-debug-gamedata-currentambrosia", styles: { gridColumn: "span 2" } })], styles: { gridTemplateColumns: "repeat(2, 1fr)", gridTemplateRows: "1fr", columnGap: "5px", rowGap: "5px" } })) }
    }; (async () => { let s = [{ className: "HSPrototypes", context: "HSPrototypes", moduleColor: "crimson", loadOrder: 1, initImmediate: !0 }, { className: "HSUI", context: "HSUI", moduleColor: "royalblue", loadOrder: 2, initImmediate: !0 }, { className: "HSStorage", context: "HSStorage", moduleColor: "wheat", loadOrder: 3, initImmediate: !0 }, { className: "HSSettings", context: "HSSettings", moduleColor: "slategray", loadOrder: 4 }, { className: "HSDebug", context: "HSDebug", moduleColor: "#ff2020", loadOrder: 5, initImmediate: !0 }, { className: "HSWebSocket", context: "HSWebSocket", moduleColor: "#FC427B", loadOrder: 6 }, { className: "HSShadowDOM", context: "HSShadowDOM", moduleColor: "hotpink" }, { className: "HSCodes", context: "HSCodes", moduleColor: "darkgoldenrod" }, { className: "HSHepteracts", context: "HSHepteracts", moduleColor: "slateblue" }, { className: "HSTalismans", context: "HSTalismans", moduleColor: "cyan" }, { className: "HSMouse", context: "HSMouse", moduleColor: "gold" }, { className: "HSAmbrosia", context: "HSAmbrosia", moduleColor: "blueviolet" }, { className: "HSStats", context: "HSStats", moduleColor: "lawngreen" }, { className: "HSGameState", context: "HSGameState", moduleColor: "indianred" }, { className: "HSPatches", context: "HSPatches", moduleColor: "#487eb0" }, { className: "HSGameData", context: "HSGameData", moduleColor: "#fbc531" }, { className: "HSGameDataAPI", context: "HSGameDataAPI", moduleColor: "#fbc531" }, { className: "HSAutosing", context: "HSAutosing", moduleColor: "#00ff7f" }, { className: "HSQOLButtons", context: "HSQOLButtons", moduleColor: "#c0c0c0" }, { className: "Chartist", context: "Chartist", moduleColor: "#e8d7bf", moduleType: 2, moduleKind: 3, moduleScriptUrl: "https://cdn.jsdelivr.net/npm/chartist@1.3.1/dist/index.umd.min.js", moduleCSSUrl: "https://cdn.jsdelivr.net/npm/chartist@1.3.1/dist/index.min.css", scriptContext: "Chartist" }], e = new je(s); await e.preprocessModules(), window.hypersynergism = e })();
})();
