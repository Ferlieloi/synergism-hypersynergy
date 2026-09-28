function buildInjectorCode(modUrl) {
    return `
// ==== HYPERSYNERGISM INJECTOR START ====
try {
    console.log('[HS] Injected preload running');

    let resolvedUrl = ${JSON.stringify(modUrl)};
    try {
        const override = process.env.HS_MOD_URL;
        if (override) resolvedUrl = override;
    } catch (e) {
        console.warn('[HS] Could not read CLI args, using baked-in URL:', e.message);
    }

    console.log('[HS] Loading mod from:', resolvedUrl);
    fetch(resolvedUrl)
        .then(r => {
            if (!r.ok) throw new Error('Mod download failed (HTTP ' + r.status + ')');
            return r.text();
        })
        .then(code => {
            const script = document.createElement('script');
            script.textContent = code;
            document.head.appendChild(script);
            // The mod entrypoint starts its own async initialization.
            const initialization = window.__HS_INIT_PROMISE;
            if (initialization && typeof initialization.then === 'function') {
                initialization.then(
                    () => console.log('[HS] Mod initialized'),
                    () => {} // The mod entrypoint reports its own initialization error.
                );
            } else {
                console.log('[HS] Mod script injected; initialization started');
            }
        })
        .catch(e => console.error('[HS] Mod download or injection failed', e));
} catch (e) {
    console.error('[HS] Injection failed', e);
}
// ==== HYPERSYNERGISM INJECTOR END ====
`
}

module.exports = { buildInjectorCode }
