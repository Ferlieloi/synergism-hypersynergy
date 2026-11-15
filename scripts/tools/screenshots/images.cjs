// Where each screenshot goes on the website (docs/res/<to>@2x.webp), its crop in the shot's pixels (2x), and its
// width on the site when smaller than taken (page px: the file is scaled down to twice that). `marked`: where its
// annotated version goes (game-shots.cjs draws the marks; a view without `to` is used only annotated).
// The names are those of game-shots.cjs, plus steam-loader (loader-shot.cjs).
module.exports = {
    'mod-panel': { to: 'features/mod-panel' },
    // Getting started: down to "Don't switch ambrosia loadouts" (Advanced isn't needed there)
    'autosing-settings': { to: 'guides/autosing-settings', crop: [0, 0, 1120, 1420] },
    'header-edit': { marked: 'features/header-edit' },
    'gq-search': { to: 'features/gq-search' },
    'hepteract-distributor': { to: 'features/hepteract-distributor' },
    'heater-inputs': { marked: 'guides/heater-inputs' },
    // The catalogue's copy stays clean: its numbers are the guide's
    'heater-results': { to: 'features/heater-results', marked: 'guides/heater-results' },
    'strategy-window': { to: 'guides/strategy-window' },
    'actions-window': { to: 'guides/actions-window' },
    'if-jump': { marked: 'guides/if-jump' },
    'autosing-window': { to: 'guides/autosing-window' },
    'step-timings': { to: 'guides/step-timings' },
    // 880 px wide as taken; smaller, it floats beside the text (850 px or less, build-docs.py)
    'steam-loader': { to: 'features/steam-loader', shown: 800 },
}
