const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const esbuild = require('esbuild');

const { code } = esbuild.transformSync(
    fs.readFileSync('src/mod/class/hs-modules/hs-qolButtons.ts', 'utf8'),
    { loader: 'ts', format: 'cjs' }
);

function fixture(balance, upgrades, options = {}) {
    const elements = new Map();
    const observers = new Set();
    class Element {
        constructor(tag = 'div', id = '') {
            this.tag = tag;
            this.id = id;
            this.children = [];
            this.listeners = new Map();
            this.attributes = {};
            this.value = '';
            this.disabled = false;
            this.classList = { contains: name => this.classes?.includes(name) ?? false };
            this.style = new Proxy({}, {
                set(target, key, value) {
                    target[key] = value;
                    queueMicrotask(() => {
                        for (const observer of observers) observer.callback();
                    });
                    return true;
                }
            });
            if (id) elements.set(id, this);
        }
        appendChild(child) { this.children.push(child); child.parentNode = this; return child; }
        insertBefore(child) { return this.appendChild(child); }
        remove() { elements.delete(this.id); }
        setAttribute(name, value) { this.attributes[name] = value; }
        getAttribute(name) { return this.attributes[name]; }
        querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null; }
        querySelectorAll(selector) {
            return this.children.flatMap(child => [
                ...(selector === 'img' ? child.tag === 'img' : child.tag === 'button' && child.classes?.includes('singularityUpgrade')) ? [child] : [],
                ...child.querySelectorAll(selector)
            ]);
        }
        addEventListener(type, listener) {
            const listeners = this.listeners.get(type) ?? [];
            listeners.push(listener);
            this.listeners.set(type, listeners);
        }
        dispatchEvent(event) {
            event.target = this;
            return Promise.all((this.listeners.get(event.type) ?? []).map(listener => listener(event)));
        }
        click() { return this.disabled ? Promise.resolve() : this.dispatchEvent({ type: 'click' }); }
        blur() {}
    }
    class Observer {
        constructor(callback) { this.callback = callback; }
        observe() { observers.add(this); }
        disconnect() { observers.delete(this); }
    }
    class TestEvent {
        constructor(type, properties) { Object.assign(this, { type }, properties); }
    }

    const confirmation = new Element('div', 'confirmationBox');
    const purchase = new Element('div', 'purchasePromptWrapper');
    const alert = new Element('div', 'alertWrapper');
    confirmation.style.display = options.openDialog ? 'block' : 'none';
    purchase.style.display = alert.style.display = 'none';
    const cost = new Element('input', 'purchasePromptCost');
    const ok = new Element('button', 'ok_purchasePrompt');
    const cancel = new Element('button', 'cancel_purchasePrompt');
    const okAlert = new Element('button', 'ok_alert');
    const toggle = new Element('button', 'toggleMaxedGoldenQuarkUpgrades');
    toggle.setAttribute('aria-pressed', 'true');
    const container = new Element('div', 'actualSingularityUpgradeContainer');
    new Element().appendChild(new Element('div', 'goldenQuarksDisplay'));
    const gameData = { goldenQuarks: balance, highestSingularityCount: 300, goldenQuarkUpgrades: {} };
    const budgets = [];
    const purchases = [];
    let active;
    let pendingAlerts = 0;
    let alertsDismissed = 0;
    let cancelled = 0;
    let selectedLevels = 0;
    const openAlert = () => { confirmation.style.display = alert.style.display = 'block'; };
    const closePurchase = () => { confirmation.style.display = purchase.style.display = 'none'; };
    cost.addEventListener('input', () => {
        budgets.push({ id: active.id, budget: Number(cost.value), text: cost.value });
        selectedLevels = Math.min(active.cap ?? Infinity, Math.floor(Math.min(Number(cost.value), gameData.goldenQuarks) / active.price));
        ok.disabled = selectedLevels === 0;
    });
    ok.addEventListener('click', () => {
        purchases.push({ id: active.id, levels: selectedLevels });
        gameData.goldenQuarks -= selectedLevels * active.price;
        closePurchase();
        // Game purchases and queued alerts settle asynchronously after OK.
        queueMicrotask(() => {
            pendingAlerts = selectedLevels > 1 ? (active.alerts ?? 1) : 0;
            if (pendingAlerts) openAlert();
        });
    });
    cancel.addEventListener('click', () => { cancelled++; closePurchase(); });
    okAlert.addEventListener('click', () => {
        alertsDismissed++;
        confirmation.style.display = alert.style.display = 'none';
        if (--pendingAlerts > 0) queueMicrotask(openAlert);
    });
    for (const upgrade of upgrades) {
        gameData.goldenQuarkUpgrades[upgrade.id] = { goldenQuarksInvested: upgrade.invested ?? 0 };
        const button = container.appendChild(new Element('button', upgrade.id));
        button.classes = ['singularityUpgrade'];
        button.appendChild(Object.assign(new Element('img'), { src: `${upgrade.id}.png` }));
        button.addEventListener('click', event => {
            assert.equal(event.shiftKey, true);
            assert.equal(confirmation.style.display, 'none', 'Previous dialog must close before the next purchase');
            active = upgrade;
            if (options.timeout) return;
            setTimeout(() => {
                if (gameData.goldenQuarks < upgrade.price) { pendingAlerts = 1; openAlert(); }
                else { confirmation.style.display = purchase.style.display = 'block'; ok.disabled = true; }
            }, 0);
        });
    }
    const ratios = Object.fromEntries(upgrades.map(upgrade => [upgrade.id, upgrade.ratio ?? 1]));
    const settings = { getSetting: () => ({ getValue: () => JSON.stringify(ratios), setValue() {} }) };
    const moduleObject = { exports: {} };
    vm.runInNewContext(code, {
        module: moduleObject, exports: moduleObject.exports,
        require: () => ({
            HSModule: class { context = 'Test'; },
            HSModuleManager: { getModule: () => ({ getGameData: () => gameData }) },
            HSSettings: settings, HSLogger: { debug() {}, warn() {} },
            HSUtils: { sleep: ms => new Promise(resolve => setTimeout(resolve, ms)) },
            goldenQuarkUpgradeMinimumSingularity: {}
        }),
        document: { getElementById: id => elements.get(id) ?? null, createElement: tag => new Element(tag) },
        MutationObserver: Observer, Event: TestEvent, MouseEvent: TestEvent,
        setTimeout: (callback, ms) => {
            if (ms === 3000) return 0; // Keep the completion status available to assertions.
            return setTimeout(callback, ms === 5000 ? 30 : ms);
        },
        clearTimeout
    });
    if (options.missingDialog) elements.delete('purchasePromptCost');
    new moduleObject.exports.HSQOLButtons({}).showGQDistributor();
    // The injected distributor is the second child after the GQ display.
    const distributor = elements.get('goldenQuarksDisplay').parentNode.children[1];
    const distribute = distributor.children[2];
    const status = distributor.children[3];
    return {
        run: () => distribute.click(), budgets, purchases, distribute, status, purchase, alert,
        counts: () => ({ cancelled, alertsDismissed, observers: observers.size })
    };
}

async function main() {
    const weighted = fixture(1000, [{ id: 'a', ratio: 1, price: 10, alerts: 2 }, { id: 'b', ratio: 3, price: 10 }]);
    await weighted.run();
    assert.deepEqual(weighted.budgets.map(({ budget }) => budget), [250, 750]);
    assert.deepEqual(weighted.purchases, [{ id: 'a', levels: 25 }, { id: 'b', levels: 75 }]);
    assert.equal(weighted.counts().alertsDismissed, 3);
    assert.equal(weighted.status.textContent, 'Done!');

    const single = fixture(20, [{ id: 'a', price: 10 }, { id: 'b', price: 10 }]);
    await single.run();
    assert.equal(single.purchases.length, 2);
    assert.equal(single.counts().alertsDismissed, 0);

    const tooSmall = fixture(15, [{ id: 'a', ratio: 1, price: 10 }, { id: 'b', ratio: 4, price: 10 }]);
    await tooSmall.run();
    assert.equal(tooSmall.counts().cancelled, 1);
    assert.deepEqual(tooSmall.purchases, [{ id: 'b', levels: 1 }]);
    assert.equal(tooSmall.purchase.style.display, 'none');

    const unaffordable = fixture(50, [{ id: 'a', price: 100 }, { id: 'b', price: 10 }]);
    await unaffordable.run();
    assert.deepEqual(unaffordable.budgets.map(({ id }) => id), ['b']);
    assert.equal(unaffordable.counts().alertsDismissed, 2);

    const capped = fixture(1000, [{ id: 'a', price: 10, cap: 1 }, { id: 'b', price: 10 }]);
    await capped.run();
    assert.deepEqual(capped.purchases, [{ id: 'a', levels: 1 }, { id: 'b', levels: 50 }]);

    const invested = fixture(100, [{ id: 'a', price: 10, invested: 1000 }, { id: 'b', price: 10 }]);
    await invested.run();
    assert.deepEqual(invested.budgets.map(({ id, budget }) => [id, budget]), [['b', 100]]);

    const large = fixture(3.28e27, [{ id: 'a', price: 1e24 }, { id: 'b', price: 1e24 }]);
    await large.run();
    assert.deepEqual(large.budgets.map(({ budget }) => budget), [1.64e27, 1.64e27]);
    assert.ok(large.budgets.every(({ text }) => !text.includes(',')));

    const timeout = fixture(100, [{ id: 'a', price: 10 }], { timeout: true });
    await timeout.run();
    assert.match(timeout.status.textContent, /Distribution stopped/);
    assert.equal(timeout.distribute.disabled, false);
    assert.equal(timeout.counts().observers, 0);
    assert.equal(timeout.purchases.length, 0);

    for (const option of ['missingDialog', 'openDialog']) {
        const blocked = fixture(100, [{ id: 'a', price: 10 }], { [option]: true });
        await blocked.run();
        assert.equal(blocked.purchases.length, 0);
        assert.equal(blocked.distribute.disabled, false);
        assert.ok(blocked.status.textContent);
    }
    console.log('GQ distributor regression cases passed.');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
