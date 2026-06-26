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
        .then(r => r.text())
        .then(code => {
            const script = document.createElement('script');
            script.textContent = code;
            document.head.appendChild(script);
            window.hypersynergism?.init?.();
            console.log('[HS] Mod loaded');
        });
} catch (e) {
    console.error('[HS] Injection failed', e);
}
// ==== HYPERSYNERGISM INJECTOR END ====
`
}

module.exports = { buildInjectorCode }