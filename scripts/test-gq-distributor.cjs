const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const esbuild = require('esbuild');

const { code } = esbuild.transformSync(
    fs.readFileSync('src/mod/class/hs-modules/hs-qolButtons.ts', 'utf8'),
    { loader: 'ts', format: 'cjs' }
);

async function fixture(balance, upgrades, options = {}) {
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
        appendChild(child) {
            this.children.push(child); child.parentNode = this;
            if (child.id) elements.set(child.id, child);
            return child;
        }
        insertBefore(child, reference) {
            this.appendChild(child);
            const index = this.children.indexOf(reference);
            if (index >= 0) { this.children.pop(); this.children.splice(index, 0, child); }
            return child;
        }
        remove() {
            elements.delete(this.id);
            if (this.parentNode) this.parentNode.children = this.parentNode.children.filter(child => child !== this);
        }
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
    const purchaseButtons = purchase.appendChild(new Element());
    purchaseButtons.appendChild(ok);
    purchaseButtons.appendChild(cancel);
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
        const budget = Number(cost.value) === -1 ? gameData.goldenQuarks : Number(cost.value);
        selectedLevels = Math.min(active.cap ?? Infinity, Math.floor(Math.min(budget, gameData.goldenQuarks) / active.price));
        ok.disabled = selectedLevels === 0;
    });
    ok.addEventListener('click', () => {
        purchases.push({ id: active.id, levels: selectedLevels });
        gameData.goldenQuarks -= selectedLevels * active.price;
        gameData.goldenQuarkUpgrades[active.id].goldenQuarksInvested += selectedLevels * active.price;
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
    const values = { gqDistributorRatios: JSON.stringify(ratios), gqDistributorBalanceInvestments: options.balanceInvestments ?? true };
    const settings = { getSetting: name => ({ getValue: () => values[name], setValue: value => { values[name] = value; } }) };
    let snapshots = 0;
    const api = {
        getGameData: () => { throw new Error('Cached GDS data must not be required'); },
        getForcedGameData: async () => {
            snapshots++;
            if (options.failSnapshot && snapshots > 1) throw new Error('Save unavailable.');
            return structuredClone(gameData);
        }
    };
    const moduleObject = { exports: {} };
    vm.runInNewContext(code, {
        module: moduleObject, exports: moduleObject.exports,
        require: () => ({
            HSModule: class { context = 'Test'; },
            HSModuleManager: { getModule: () => api },
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
    const qol = new moduleObject.exports.HSQOLButtons({});
    await qol.showGQDistributor();
    // The injected distributor is the second child after the GQ display.
    const distributor = elements.get('goldenQuarksDisplay').parentNode.children[1];
    const distribute = elements.get('hs-gq-distribute');
    const status = distributor.children.at(-1);
    const matchButton = elements.get('hs-gq-match-invested-ratios');
    const balanceToggle = elements.get('hs-gq-balance-investments');
    return {
        run: () => distribute.click(), budgets, purchases, distribute, status, purchase, alert,
        values, gameData, inputs: distributor.children[1].children.map(child => child.children[1]),
        match: () => matchButton.click(),
        setBalance: async checked => { balanceToggle.checked = checked; await balanceToggle.dispatchEvent({ type: 'change' }); },
        show: () => qol.showGQDistributor(),
        buyMax: async (id = upgrades[0].id) => {
            await elements.get(id).dispatchEvent(new TestEvent('click', { shiftKey: true }));
            await new Promise(resolve => setTimeout(resolve, 0));
            await elements.get('hs-purchase-buy-max').click();
            await new Promise(resolve => setTimeout(resolve, 0));
        },
        counts: () => ({ cancelled, alertsDismissed, snapshots, observers: observers.size,
            maxButtons: purchaseButtons.children.filter(child => child.id === 'hs-purchase-buy-max').length })
    };
}

async function main() {
    const weighted = await fixture(1000, [{ id: 'a', ratio: 1, price: 10, alerts: 2 }, { id: 'b', ratio: 3, price: 10 }]);
    await weighted.run();
    assert.deepEqual(weighted.budgets.map(({ budget }) => budget), [250, 750]);
    assert.deepEqual(weighted.purchases, [{ id: 'a', levels: 25 }, { id: 'b', levels: 75 }]);
    assert.equal(weighted.counts().alertsDismissed, 3);
    assert.equal(weighted.counts().snapshots, 2, 'One initial read and one fresh read for the entire distribution');
    assert.equal(weighted.status.textContent, 'Done!');

    const single = await fixture(20, [{ id: 'a', price: 10 }, { id: 'b', price: 10 }]);
    await single.run();
    assert.equal(single.purchases.length, 2);
    assert.equal(single.counts().alertsDismissed, 0);

    const tooSmall = await fixture(15, [{ id: 'a', ratio: 1, price: 10 }, { id: 'b', ratio: 4, price: 10 }]);
    await tooSmall.run();
    assert.equal(tooSmall.counts().cancelled, 1);
    assert.deepEqual(tooSmall.purchases, [{ id: 'b', levels: 1 }]);
    assert.equal(tooSmall.purchase.style.display, 'none');

    const unaffordable = await fixture(50, [{ id: 'a', price: 100 }, { id: 'b', price: 10 }]);
    await unaffordable.run();
    assert.deepEqual(unaffordable.budgets.map(({ id }) => id), ['b']);
    assert.equal(unaffordable.counts().alertsDismissed, 2);

    const capped = await fixture(1000, [{ id: 'a', price: 10, cap: 1 }, { id: 'b', price: 10 }]);
    await capped.run();
    assert.deepEqual(capped.purchases, [{ id: 'a', levels: 1 }, { id: 'b', levels: 50 }]);

    const invested = await fixture(100, [{ id: 'a', price: 10, invested: 1000 }, { id: 'b', price: 10 }]);
    await invested.run();
    assert.deepEqual(invested.budgets.map(({ id, budget }) => [id, budget]), [['b', 100]]);

    const large = await fixture(3.28e27, [{ id: 'a', price: 1e24 }, { id: 'b', price: 1e24 }]);
    await large.run();
    assert.deepEqual(large.budgets.map(({ budget }) => budget), [1.64e27, 1.64e27]);
    assert.ok(large.budgets.every(({ text }) => !text.includes(',')));

    const timeout = await fixture(100, [{ id: 'a', price: 10 }], { timeout: true });
    await timeout.run();
    assert.match(timeout.status.textContent, /Distribution stopped/);
    assert.equal(timeout.distribute.disabled, false);
    assert.equal(timeout.counts().observers, 0);
    assert.equal(timeout.purchases.length, 0);

    for (const option of ['missingDialog', 'openDialog']) {
        const blocked = await fixture(100, [{ id: 'a', price: 10 }], { [option]: true });
        await blocked.run();
        assert.equal(blocked.purchases.length, 0);
        assert.equal(blocked.distribute.disabled, false);
        assert.ok(blocked.status.textContent);
    }

    const max = await fixture(100, [{ id: 'a', price: 10, cap: 4 }]);
    await max.show();
    assert.equal(max.counts().maxButtons, 1, 'Do not duplicate Buy MAX when rebuilding the distributor');
    await max.buyMax();
    assert.deepEqual(max.budgets.map(({ budget }) => budget), [-1]);
    assert.deepEqual(max.purchases, [{ id: 'a', levels: 4 }]);

    const disabledMax = await fixture(100, [{ id: 'a', price: 10, cap: 0 }]);
    await disabledMax.buyMax();
    assert.equal(disabledMax.purchases.length, 0, 'Buy MAX must respect the native disabled OK button');

    const matching = await fixture(400, [{ id: 'a', price: 1, invested: 300 }, { id: 'b', price: 1, invested: 100 }]);
    assert.deepEqual(matching.inputs.map(input => input.value), ['1', '1'], 'Opening must not overwrite the entered ratios');
    // The button uses a fresh snapshot, including manual purchases since opening.
    matching.gameData.goldenQuarkUpgrades.a.goldenQuarksInvested = 100;
    matching.gameData.goldenQuarkUpgrades.b.goldenQuarksInvested = 300;
    await matching.match();
    assert.ok(Math.abs(Number(matching.inputs[1].value) / Number(matching.inputs[0].value) - 3) < 1e-12);
    assert.equal(JSON.parse(matching.values.gqDistributorRatios).b, 100);
    assert.equal(matching.purchases.length, 0, 'The match button must not spend GQ');
    assert.equal(matching.counts().snapshots, 2, 'The match button pulls the save once');

    const balanced = await fixture(10, [{ id: 'a', price: 1, invested: 5 }, { id: 'b', price: 1, invested: 3 }]);
    await balanced.setBalance(true);
    assert.equal(balanced.values.gqDistributorBalanceInvestments, true);
    assert.equal(balanced.counts().snapshots, 1, 'Changing the mode needs no extra snapshot');
    await balanced.run();
    assert.deepEqual(balanced.budgets.map(({ budget }) => budget), [4, 6]);
    assert.deepEqual(Object.values(balanced.gameData.goldenQuarkUpgrades).map(upgrade => upgrade.goldenQuarksInvested), [9, 9]);
    assert.deepEqual(balanced.inputs.map(input => input.value), ['1', '1'], 'Balancing must preserve the desired ratios');

    const split = await fixture(10, [{ id: 'a', price: 1, invested: 5 }, { id: 'b', price: 1, invested: 3 }]);
    await split.setBalance(false);
    assert.equal(split.values.gqDistributorBalanceInvestments, false);
    assert.equal(split.counts().snapshots, 1);
    await split.run();
    assert.deepEqual(split.budgets.map(({ budget }) => budget), [5, 5]);
    assert.deepEqual(Object.values(split.gameData.goldenQuarkUpgrades).map(upgrade => upgrade.goldenQuarksInvested), [10, 8]);

    const unequal = await fixture(10, [{ id: 'a', ratio: 1, price: 1, invested: 5 }, { id: 'b', ratio: 2, price: 1, invested: 3 }]);
    await unequal.run();
    assert.deepEqual(unequal.budgets.map(({ budget }) => budget), [1, 9]);
    assert.deepEqual(Object.values(unequal.gameData.goldenQuarkUpgrades).map(upgrade => upgrade.goldenQuarksInvested), [6, 12]);

    const insufficient = await fixture(2, [{ id: 'a', price: 1, invested: 10 }, { id: 'b', price: 1 }]);
    await insufficient.run();
    assert.deepEqual(insufficient.budgets.map(({ id, budget }) => [id, budget]), [['b', 2]], 'Spend toward the target without reducing existing investments');

    const severalBehind = await fixture(6, [{ id: 'a', price: 1, invested: 10 }, { id: 'b', price: 1 }, { id: 'c', price: 1 }]);
    await severalBehind.run();
    assert.deepEqual(severalBehind.budgets.map(({ id, budget }) => [id, budget]), [['b', 3], ['c', 3]], 'Balance the upgrades below target when the full ratio is unreachable');

    const noInvestment = await fixture(100, [{ id: 'a', ratio: 1, price: 1 }, { id: 'b', ratio: 3, price: 1 }]);
    await noInvestment.match();
    assert.deepEqual(noInvestment.inputs.map(input => input.value), ['1', '3']);
    assert.match(noInvestment.status.textContent, /No GQ invested/);
    await noInvestment.run();
    assert.deepEqual(noInvestment.budgets.map(({ budget }) => budget), [25, 75]);

    const zeroInvestment = await fixture(100, [{ id: 'a', price: 1, invested: 100 }, { id: 'b', price: 1 }]);
    await zeroInvestment.match();
    assert.equal(zeroInvestment.inputs[1].value, '0');
    await zeroInvestment.run();
    assert.deepEqual(zeroInvestment.budgets.map(({ id, budget }) => [id, budget]), [['a', 100]]);

    const enormousInvestment = await fixture(1000, [{ id: 'a', ratio: 1, price: 1, invested: 1e100 }, { id: 'b', ratio: 3, price: 1, invested: 3e100 }], { balanceInvestments: false });
    await enormousInvestment.run();
    assert.deepEqual(enormousInvestment.budgets.map(({ budget }) => budget), [250, 750], 'Splitting new GQ must not depend on previous investments');

    const fresh = await fixture(1000, [{ id: 'a', price: 1 }, { id: 'b', price: 1 }]);
    fresh.gameData.goldenQuarks = 40;
    await fresh.run();
    assert.deepEqual(fresh.budgets.map(({ budget }) => budget), [20, 20]);

    const failedRead = await fixture(100, [{ id: 'a', price: 1 }], { failSnapshot: true });
    await failedRead.run();
    assert.match(failedRead.status.textContent, /Distribution stopped/);
    assert.equal(failedRead.distribute.disabled, false);
    assert.equal(failedRead.purchases.length, 0);
    const ratiosBeforeFailure = failedRead.values.gqDistributorRatios;
    await failedRead.match();
    assert.equal(failedRead.values.gqDistributorRatios, ratiosBeforeFailure);
    assert.equal(failedRead.distribute.disabled, false);
    console.log('GQ distributor regression cases passed.');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
