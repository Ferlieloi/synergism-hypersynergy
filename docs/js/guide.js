/* Search is progressive enhancement; the complete guide is pre-rendered HTML. */
(() => {
  'use strict';
  // The features page hides its categories under html.folding until they are folded (no full list for a frame
  // first): lifted whatever happens here, so an error never leaves them hidden.
  try {
    setUp();
  } finally {
    document.documentElement.classList.remove('folding');
  }

  function setUp() {
  const search = document.getElementById('feature-search');
  const category = document.getElementById('feature-category');
  if (!search || !category) return;

  const sections = [...document.querySelectorAll('.feature-category')];
  const features = [...document.querySelectorAll('.feature')];
  // Punctuation and symbols are spaces on both sides, so a label typed as the panel shows it
  // ("Repeat hover (hold left Shift)", "S216+", "✏️ Edit") still matches.
  const words = value => value.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ');
  const text = new Map(features.map(feature => [feature, words(feature.textContent)]));
  const result = document.getElementById('feature-results');
  const noResults = document.getElementById('no-results');
  const reset = document.getElementById('search-reset');
  const params = new URLSearchParams(location.search);
  search.value = params.get('q') || '';
  if ([...category.options].some(option => option.value === params.get('category'))) {
    category.value = params.get('category');
  }

  // Folding: each category title becomes a toggle. Every category starts folded; nothing is remembered across visits.
  // A search or category choice unfolds everything; the folds return once it is cleared.
  const toggles = new Map();
  const counts = new Map();
  for (const section of sections) {
    const heading = section.querySelector('h2');
    if (!heading) continue;
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'fold-toggle';
    toggle.setAttribute('aria-expanded', 'true');
    const icon = document.createElement('span');
    icon.className = 'fold-icon';
    icon.setAttribute('aria-hidden', 'true');
    const count = document.createElement('span');
    count.className = 'category-count';
    toggle.append(icon, ...heading.childNodes, count);
    heading.append(toggle);
    toggle.addEventListener('click', () => {
      setFolded(section, toggle.getAttribute('aria-expanded') === 'true');
      updateFoldAll();
    });
    toggles.set(section, toggle);
    counts.set(section, count);
    setFolded(section, true);
  }

  const foldAll = document.createElement('button');
  foldAll.type = 'button';
  foldAll.className = 'fold-all';
  // Both labels share one grid cell so the button keeps its width when the label changes.
  foldAll.innerHTML = '<span>Fold all</span><span>Unfold all</span>';
  reset.after(foldAll);

  function setFolded(section, folded) {
    section.classList.toggle('folded', folded);
    toggles.get(section)?.setAttribute('aria-expanded', String(!folded));
  }

  function updateFoldAll() {
    const shown = sections.filter(section => !section.hidden && toggles.has(section));
    const allFolded = shown.length > 0 && shown.every(section => section.classList.contains('folded'));
    foldAll.classList.toggle('unfold', allFolded);
  }

  foldAll.addEventListener('click', () => {
    const fold = !foldAll.classList.contains('unfold');
    for (const section of sections) {
      if (!section.hidden && toggles.has(section)) setFolded(section, fold);
    }
    updateFoldAll();
  });

  let savedFolds = null;
  function applyFilterFolds(active) {
    if (active && !savedFolds) {
      savedFolds = new Set(sections.filter(section => section.classList.contains('folded')));
      for (const section of savedFolds) setFolded(section, false);
    } else if (!active && savedFolds) {
      for (const section of sections) setFolded(section, savedFolds.has(section));
      savedFolds = null;
    }
  }

  function filter(updateURL = true) {
    const terms = words(search.value).split(' ').filter(Boolean);
    applyFilterFolds(terms.length > 0 || category.value !== '');
    let visible = 0;
    for (const section of sections) {
      let count = 0;
      const selected = !category.value || category.value === section.dataset.category;
      for (const feature of section.querySelectorAll('.feature')) {
        const matches = selected && terms.every(term => text.get(feature).includes(term));
        feature.hidden = !matches;
        if (matches) count++;
      }
      section.hidden = count === 0;
      const label = counts.get(section);
      if (label) label.textContent = String(count);
      visible += count;
    }
    updateFoldAll();
    result.textContent = `${visible} of ${features.length} features shown`;
    noResults.hidden = visible !== 0;
    if (updateURL && location.protocol !== 'file:') {
      const url = new URL(location.href);
      if (search.value.trim()) url.searchParams.set('q', search.value.trim());
      else url.searchParams.delete('q');
      if (category.value) url.searchParams.set('category', category.value);
      else url.searchParams.delete('category');
      try { history.replaceState(null, '', url); } catch { /* File/sandbox previews still filter. */ }
    }
  }

  function revealAnchor() {
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    const target = document.getElementById(id);
    if (!target?.classList.contains('feature')) return;
    // Direct links must work even when a previously shared filter hides this entry.
    if (target.hidden) {
      search.value = '';
      category.value = '';
      filter();
    }
    const section = target.closest('.feature-category');
    if (section?.classList.contains('folded')) {
      setFolded(section, false);
      updateFoldAll();
    }
    const details = target.querySelector('details');
    if (details) details.open = true;
    target.scrollIntoView({ block: 'start' });
  }
  // A miniature unfolds its entry's details, where the image is (without JS it opens the image).
  for (const thumb of document.querySelectorAll('.feature .thumb')) {
    thumb.addEventListener('click', event => {
      const details = thumb.closest('.feature').querySelector('details');
      if (!details) return;
      event.preventDefault();
      details.open = true;
      details.querySelector('.shot')?.scrollIntoView({ block: 'nearest' });
    });
  }
  search.addEventListener('input', () => filter());
  category.addEventListener('change', () => filter());
  reset.addEventListener('click', () => {
    search.value = '';
    category.value = '';
    filter();
    search.focus();
  });
  window.addEventListener('hashchange', revealAnchor);
  filter(false);
  revealAnchor();
  }
})();
