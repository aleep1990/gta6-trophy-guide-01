// Leonida Ledger — all views: tracker, trophy detail, roadmap, missables, planner, about.
// Every string from the data file is placed with textContent, never innerHTML.

import { GRADE_LABELS, GRADES, KIND_LABELS, KINDS, ROADMAP_STAGES, WATCH_LIST_IDS } from './config.js';
import { gradeCounts, trophyById } from './data.js';
import { applyFilters, isSpoilerHidden, planNextUp } from './filters.js';
import { downloadFile, exportState, importState, setEarned, setNote } from './store.js';

// Trophies the reader chose to reveal this session despite spoilers being on.
const revealedThisSession = new Set();

export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

function pill(text, className) {
  return el('span', 'pill ' + (className || ''), text);
}

function gradePill(grade) {
  return pill(GRADE_LABELS[grade] || grade, 'grade-' + grade);
}

function trophyLink(trophy) {
  const a = document.createElement('a');
  a.href = '#/trophy/' + trophy.id;
  a.textContent = trophy.name;
  return a;
}

function psnTargetText(trophy) {
  if (trophy.psn_target == null) return null;
  if (trophy.id === 52) return 'PSN 0/$' + trophy.psn_target.toLocaleString('en-US');
  if (trophy.id === 53) return 'PSN 0/$' + trophy.psn_target.toLocaleString('en-US');
  return 'PSN 0/' + trophy.psn_target;
}

export function updateProgress(state, trophies) {
  const earned = new Set(state.earned);
  document.getElementById('earnedCount').textContent = String(earned.size);
  const fill = document.getElementById('progressFill');
  fill.style.width = Math.round((earned.size / trophies.length) * 100) + '%';
  document.getElementById('progressBar').setAttribute('aria-valuenow', String(earned.size));
  const counts = gradeCounts(trophies, earned);
  const parts = GRADES.map((g) => `${GRADE_LABELS[g]} ${counts[g].earned}/${counts[g].total}`);
  document.getElementById('gradeCounts').textContent = parts.join(' · ');
  const remaining = trophies.length - earned.size;
  document.getElementById('progressNote').textContent =
    remaining === 0
      ? 'Platinum earned — you are a Leonida Legend.'
      : remaining === 1
        ? 'One trophy left: the platinum is yours.'
        : `${remaining} to go — the next one is on the Next up page.`;
}

function trophyRow(trophy, state, onToggle) {
  const earned = state.earned.includes(trophy.id);
  const spoilerHidden = isSpoilerHidden(trophy, state) && !revealedThisSession.has(trophy.id);
  const li = el('li', 'trophy-row' + (earned ? ' earned' : '') + (spoilerHidden ? ' hidden-trophy' : ''));
  const check = document.createElement('input');
  check.type = 'checkbox';
  check.className = 'trophy-check';
  check.checked = earned;
  check.setAttribute('aria-label', 'Mark ' + (spoilerHidden ? 'hidden trophy' : trophy.name) + ' as earned');
  check.addEventListener('change', () => onToggle(trophy.id, check.checked));
  li.append(check);

  const main = el('div', 'trophy-main');
  const name = el('div', 'trophy-name');
  if (spoilerHidden) {
    name.textContent = 'Hidden trophy — earn it to reveal';
    main.append(name);
    main.append(el('div', 'trophy-desc', 'A story trophy. Its name and description stay hidden while spoilers are on.'));
    const reveal = document.createElement('button');
    reveal.type = 'button';
    reveal.className = 'ghost';
    reveal.textContent = 'Reveal anyway (spoiler)';
    reveal.addEventListener('click', () => {
      revealedThisSession.add(trophy.id);
      onToggle(trophy.id, state.earned.includes(trophy.id), true);
    });
    main.append(reveal);
  } else {
    name.append(trophyLink(trophy));
    main.append(name);
    main.append(el('div', 'trophy-desc', trophy.description));
    const meta = el('div', 'trophy-meta');
    meta.append(gradePill(trophy.grade));
    meta.append(pill(KIND_LABELS[trophy.kind] || trophy.kind, 'kind'));
    if (trophy.hidden) meta.append(pill('Hidden', 'hidden-pill'));
    if (trophy.missable) meta.append(pill('Missable', 'missable'));
    main.append(meta);
  }
  li.append(main);

  const side = el('div', 'trophy-side');
  if (!spoilerHidden) {
    const target = psnTargetText(trophy);
    if (target) side.append(el('span', 'psn-target', target));
    const guide = document.createElement('a');
    guide.href = '#/trophy/' + trophy.id;
    guide.className = 'guide-link';
    guide.textContent = 'Guide →';
    side.append(guide);
  }
  li.append(side);
  return li;
}

function toolbar(state, trophies, rerender) {
  const bar = el('div', 'toolbar');
  const search = document.createElement('input');
  search.type = 'search';
  search.id = 'searchBox';
  search.placeholder = 'Search names, descriptions, guides… ( / )';
  search.value = state.filters.query;
  search.setAttribute('aria-label', 'Search trophies');
  search.addEventListener('input', () => {
    state.filters.query = search.value;
    rerender();
  });
  bar.append(search);

  const gradeLabel = el('label', null, 'Grade ');
  const grade = document.createElement('select');
  grade.setAttribute('aria-label', 'Filter by grade');
  for (const g of ['all', ...GRADES]) {
    const o = document.createElement('option');
    o.value = g;
    o.textContent = g === 'all' ? 'All grades' : GRADE_LABELS[g];
    grade.append(o);
  }
  grade.value = state.filters.grade;
  grade.addEventListener('change', () => {
    state.filters.grade = grade.value;
    rerender();
  });
  gradeLabel.append(grade);
  bar.append(gradeLabel);

  const kindLabel = el('label', null, 'Kind ');
  const kind = document.createElement('select');
  kind.setAttribute('aria-label', 'Filter by kind');
  for (const k of ['all', ...KINDS]) {
    const o = document.createElement('option');
    o.value = k;
    o.textContent = k === 'all' ? 'All kinds' : KIND_LABELS[k];
    kind.append(o);
  }
  kind.value = state.filters.kind;
  kind.addEventListener('change', () => {
    state.filters.kind = kind.value;
    rerender();
  });
  kindLabel.append(kind);
  bar.append(kindLabel);

  const unearnedLabel = el('label', 'toggle', 'Unearned only ');
  const unearned = document.createElement('input');
  unearned.type = 'checkbox';
  unearned.checked = state.filters.onlyUnearned;
  unearned.addEventListener('change', () => {
    state.filters.onlyUnearned = unearned.checked;
    rerender();
  });
  unearnedLabel.prepend(unearned);
  bar.append(unearnedLabel);

  const missableLabel = el('label', 'toggle', 'Missable only ');
  const missable = document.createElement('input');
  missable.type = 'checkbox';
  missable.checked = state.filters.onlyMissable;
  missable.addEventListener('change', () => {
    state.filters.onlyMissable = missable.checked;
    rerender();
  });
  missableLabel.prepend(missable);
  bar.append(missableLabel);

  bar.append(el('span', 'spacer'));

  const exportBtn = el('button', null, 'Export progress');
  exportBtn.type = 'button';
  exportBtn.addEventListener('click', () => downloadFile('leonida-ledger-progress.json', exportState(state)));
  bar.append(exportBtn);

  const importBtn = el('button', null, 'Import progress');
  importBtn.type = 'button';
  const importInput = document.createElement('input');
  importInput.type = 'file';
  importInput.accept = 'application/json';
  importInput.setAttribute('aria-label', 'Import progress file');
  importInput.style.display = 'none';
  importBtn.addEventListener('click', () => importInput.click());
  importInput.addEventListener('change', async () => {
    const file = importInput.files && importInput.files[0];
    if (!file) return;
    try {
      const data = importState(await file.text());
      state.earned = data.earned;
      state.notes = data.notes;
      rerender();
    } catch {
      alert('That file is not a Leonida Ledger progress export.');
    }
    importInput.value = '';
  });
  bar.append(importBtn);
  bar.append(importInput);
  return bar;
}

export function renderTracker(view, state, trophies, ctx) {
  view.replaceChildren();
  view.append(el('h2', null, 'Tracker'));
  const intro = el('p', 'view-intro');
  intro.append('All 55 official trophies: ');
  intro.append(el('strong', null, '1 platinum, 2 gold, 6 silver, 46 bronze'));
  intro.append(' — 28 of them hidden on PlayStation until earned. Tick one off and it stays ticked; your notes and progress live in this browser only.');
  view.append(intro);

  const picks = planNextUp(trophies, state, 3);
  if (picks.length > 0) {
    const strip = el('div', 'nextup-strip');
    strip.append(el('h3', null, 'Next up'));
    const ol = document.createElement('ol');
    for (const pick of picks) {
      const li = document.createElement('li');
      li.append(trophyLink(pick.trophy));
      li.append(el('span', 'why', ' — ' + pick.why));
      ol.append(li);
    }
    strip.append(ol);
    const more = document.createElement('a');
    more.href = '#/planner';
    more.textContent = 'See the full plan →';
    more.style.marginLeft = '8px';
    strip.querySelector('h3').append(more);
    view.append(strip);
  }

  view.append(toolbar(state, trophies, ctx.rerender));
  const filtered = applyFilters(trophies, state);
  if (filtered.length === 0) {
    view.append(el('div', 'empty-state', 'No trophies match those filters. Clear the search or widen the filters.'));
    return;
  }
  const list = el('ul', 'trophy-list');
  for (const t of filtered) list.append(trophyRow(t, state, ctx.onToggle));
  view.append(list);
  const count = el('p', 'view-intro');
  count.textContent = `Showing ${filtered.length} of ${trophies.length} trophies.`;
  view.append(count);
}

function sourceList(sources) {
  const ul = el('ul', 'sources');
  for (const s of sources || []) {
    const li = document.createElement('li');
    if (typeof s === 'string') {
      li.textContent = s;
    } else if (s.url) {
      li.textContent = s.label + ' — ';
      const a = document.createElement('a');
      a.href = s.url;
      a.rel = 'noopener';
      a.textContent = s.url.replace(/^https?:\/\//, '');
      li.append(a);
    } else {
      li.textContent = s.label || '';
    }
    ul.append(li);
  }
  return ul;
}

export function renderDetail(view, state, trophies, id, ctx) {
  const trophy = trophyById(trophies, id);
  view.replaceChildren();
  if (!trophy) {
    view.append(el('h2', null, 'No such trophy'));
    view.append(el('p', 'view-intro', 'That trophy is not in the official list of 55.'));
    const back = document.createElement('a');
    back.href = '#/tracker';
    back.textContent = '← Back to the tracker';
    view.append(back);
    return;
  }
  const earned = state.earned.includes(trophy.id);
  const spoilerHidden = isSpoilerHidden(trophy, state) && !revealedThisSession.has(trophy.id);
  const back = document.createElement('a');
  back.href = '#/tracker';
  back.className = 'back-link';
  back.textContent = '← Back to the tracker';
  view.append(back);

  const detail = el('div', 'detail');
  const head = el('div', 'detail-head');
  const name = el('h2', null, spoilerHidden ? 'Hidden trophy' : trophy.name);
  head.append(name);
  if (!spoilerHidden) {
    head.append(el('p', 'trophy-desc', trophy.description));
    const meta = el('div', 'trophy-meta');
    meta.append(gradePill(trophy.grade));
    meta.append(pill(KIND_LABELS[trophy.kind] || trophy.kind, 'kind'));
    if (trophy.hidden) meta.append(pill('Hidden', 'hidden-pill'));
    if (trophy.missable) meta.append(pill('Missable', 'missable'));
    const target = psnTargetText(trophy);
    if (target) meta.append(pill(target, ''));
    head.append(meta);
    const checkLabel = el('label', 'toggle');
    const check = document.createElement('input');
    check.type = 'checkbox';
    check.checked = earned;
    check.addEventListener('change', () => ctx.onToggle(trophy.id, check.checked));
    checkLabel.append(check, document.createTextNode(earned ? ' Earned — ticked off' : ' Mark as earned'));
    head.append(checkLabel);
  } else {
    head.append(el('p', 'trophy-desc', 'This is a hidden story trophy. Its name, description and guide stay hidden while spoilers are on — earn it in the game, or reveal it here.'));
    const reveal = document.createElement('button');
    reveal.type = 'button';
    reveal.textContent = 'Reveal this trophy (spoiler)';
    reveal.addEventListener('click', () => {
      revealedThisSession.add(trophy.id);
      ctx.rerender();
    });
    head.append(reveal);
  }
  detail.append(head);

  if (!spoilerHidden) {
    const grid = el('div', 'detail-grid');
    const left = el('div', 'detail');
    const guideCard = el('div', 'card');
    guideCard.append(el('h3', null, 'Guide'));
    const guideText = el('div', 'guide-text');
    for (const para of trophy.guide.split(/(?<=\.)\s+/)) {
      guideText.append(el('p', null, para));
    }
    guideCard.append(guideText);
    guideCard.append(el('div', 'honesty', ''));
    const honesty = guideCard.querySelector('.honesty');
    honesty.append(el('strong', null, 'Honest note: '));
    honesty.append(document.createTextNode('GTA VI launched 19 Nov 2026. This guide is written from the official description and the PSN progress target — where a place or step is not pinned down yet, the guide says so instead of inventing one.'));
    left.append(guideCard);

    const notesCard = el('div', 'card notes-area');
    notesCard.append(el('h3', null, 'Your notes'));
    const notes = document.createElement('textarea');
    notes.value = state.notes[trophy.id] || '';
    notes.placeholder = 'Your own notes for this trophy — a spot, a loadout, a reminder…';
    notes.setAttribute('aria-label', 'Notes for ' + trophy.name);
    const saved = el('p', 'saved');
    notes.addEventListener('input', () => {
      setNote(state, trophy.id, notes.value);
      saved.textContent = notes.value.trim() ? 'Saved in this browser.' : '';
    });
    notesCard.append(notes);
    notesCard.append(saved);
    left.append(notesCard);
    grid.append(left);

    const right = el('div', 'detail');
    const sourcesCard = el('div', 'card');
    sourcesCard.append(el('h3', null, 'Sources'));
    sourcesCard.append(sourceList(trophy.sources));
    right.append(sourcesCard);

    const missCard = el('div', 'card');
    missCard.append(el('h3', null, 'Can it be missed?'));
    const box = el('div', 'missable-box' + (trophy.missable ? '' : ' safe'));
    box.append(el('h4', null, trophy.missable ? '⚠ Flagged missable' : 'Safe — not missable'));
    box.append(el('p', null, trophy.missable_note));
    missCard.append(box);
    right.append(missCard);

    const facts = el('div', 'card');
    facts.append(el('h3', null, 'Facts'));
    const factsList = el('ul', 'sources');
    const factsItems = [
      `Grade: ${GRADE_LABELS[trophy.grade]}`,
      `Kind: ${KIND_LABELS[trophy.kind] || trophy.kind}`,
      `Hidden on PlayStation: ${trophy.hidden ? 'yes — hidden until earned' : 'no'}`,
      trophy.psn_target != null ? `PSN progress target: ${trophy.psn_target}` : 'PSN progress target: none — it pops in one go',
    ];
    for (const f of factsItems) factsList.append(el('li', null, f));
    facts.append(factsList);
    right.append(facts);
    grid.append(right);
    detail.append(grid);
  }

  const nav = el('div', 'detail-nav');
  const prev = trophyById(trophies, trophy.id - 1);
  const next = trophyById(trophies, trophy.id + 1);
  if (prev) {
    const a = document.createElement('a');
    a.href = '#/trophy/' + prev.id;
    a.textContent = '← ' + (isSpoilerHidden(prev, state) ? 'Previous trophy' : prev.name);
    nav.append(a);
  } else nav.append(el('span'));
  if (next) {
    const a = document.createElement('a');
    a.href = '#/trophy/' + next.id;
    a.textContent = (isSpoilerHidden(next, state) ? 'Next trophy' : next.name) + ' →';
    nav.append(a);
  }
  detail.append(nav);
  view.append(detail);
}

export function renderRoadmap(view, state, trophies, ctx) {
  view.replaceChildren();
  view.append(el('h2', null, 'Roadmap to the platinum'));
  const intro = el('p', 'view-intro');
  intro.append('Six stages, built from the official descriptions. Community estimates put the full run at roughly ');
  intro.append(el('strong', null, '200 hours'));
  intro.append(' — story first, grinds last. Tick trophies off as you earn them; each stage shows its own progress.');
  view.append(intro);
  const earned = new Set(state.earned);
  for (const stage of ROADMAP_STAGES) {
    const stageTrophies = stage.trophyIds.map((id) => trophyById(trophies, id)).filter(Boolean);
    const done = stageTrophies.filter((t) => earned.has(t.id)).length;
    const card = el('div', 'stage');
    const head = el('div', 'stage-head');
    head.append(el('h3', null, stage.title));
    head.append(el('span', 'stage-count', `${done} / ${stageTrophies.length} earned`));
    card.append(head);
    const bar = el('div', 'progress-bar');
    const fill = el('span');
    fill.style.width = Math.round((done / stageTrophies.length) * 100) + '%';
    bar.append(fill);
    card.append(bar);
    card.append(el('p', 'stage-why', stage.why));
    const ul = document.createElement('ul');
    for (const t of stageTrophies) {
      const li = el('li', earned.has(t.id) ? 'done' : '');
      const check = document.createElement('input');
      check.type = 'checkbox';
      check.checked = earned.has(t.id);
      check.setAttribute('aria-label', 'Mark ' + t.name + ' as earned');
      check.addEventListener('change', () => ctx.onToggle(t.id, check.checked));
      li.append(check);
      const hidden = isSpoilerHidden(t, state) && !revealedThisSession.has(t.id);
      if (hidden) li.append(el('span', null, 'Hidden trophy'));
      else {
        li.append(trophyLink(t));
        li.append(el('span', 'mini', ` — ${GRADE_LABELS[t.grade]} · ${t.description}`));
      }
      ul.append(li);
    }
    card.append(ul);
    view.append(card);
  }
}

export function renderMissables(view, state, trophies, ctx) {
  view.replaceChildren();
  view.append(el('h2', null, 'Missables'));
  const intro = el('p', 'view-intro');
  intro.append('Built from the official descriptions and the launch-week guides. Only one trophy is flagged as possibly missable — the rest of this page is the honest precaution list for the one-time story moments.');
  view.append(intro);

  const flagged = trophies.filter((t) => t.missable);
  const flaggedCard = el('div', 'card');
  flaggedCard.append(el('h3', null, '⚠ Flagged missable'));
  if (flagged.length === 0) flaggedCard.append(el('p', null, 'None flagged.'));
  const flaggedList = el('div', 'missable-list');
  for (const t of flagged) {
    const row = trophyRow(t, state, ctx.onToggle);
    flaggedList.append(row);
  }
  flaggedCard.append(flaggedList);
  flaggedCard.append(el('p', 'watch-note', 'Sources: EGamers.io flags Positive Mental Attitude as the only possibly missable trophy; Outputlag reports the Chapter 1 meditation spot disappears after the chapter and that no mission replay has been confirmed. Meditate there before Chapter 1 ends.'));
  view.append(flaggedCard);

  const watchCard = el('div', 'card');
  watchCard.append(el('h3', null, 'One-time story moments — save first'));
  watchCard.append(el('p', 'watch-note', 'These trophies are tied to single story missions. They are NOT confirmed missable — community discussion suggests nothing in the game is missable — but no mission replay has been confirmed, so keep a manual save at the start of every chapter before you play one.'));
  const watchList = el('div', 'missable-list');
  for (const id of WATCH_LIST_IDS) {
    const t = trophyById(trophies, id);
    if (t) watchList.append(trophyRow(t, state, ctx.onToggle));
  }
  watchCard.append(watchList);
  view.append(watchCard);

  const safeCard = el('div', 'card');
  safeCard.append(el('h3', null, 'Everything else is safe'));
  safeCard.append(el('p', null, 'Every other trophy is cumulative, repeatable or available after the story: collectibles, activities, robberies, races, stunts and the money grinds. You cannot lock yourself out of them by playing the story.'));
  view.append(safeCard);
}

export function renderPlanner(view, state, trophies) {
  view.replaceChildren();
  view.append(el('h2', null, 'Next up'));
  const intro = el('p', 'view-intro');
  intro.append('Your next trophies, in order: the story beats first, then the quick wins, then the short grinds. The plan updates itself as you tick trophies off.');
  view.append(intro);
  const picks = planNextUp(trophies, state, 8);
  if (picks.length === 0) {
    view.append(el('div', 'card planner-done', 'All 55 earned. You are a Leonida Legend — Vice Got a Price! is yours.'));
    return;
  }
  const list = el('ol', 'planner-list');
  picks.forEach((pick, i) => {
    const t = pick.trophy;
    const hidden = isSpoilerHidden(t, state) && !revealedThisSession.has(t.id);
    const li = el('li', 'planner-item');
    li.append(el('span', 'planner-rank', String(i + 1)));
    const main = el('div');
    const name = el('div', 'trophy-name');
    if (hidden) name.textContent = 'Hidden trophy';
    else name.append(trophyLink(t));
    main.append(name);
    if (!hidden) main.append(el('div', 'trophy-desc', t.description));
    main.append(el('div', 'planner-why', pick.why));
    li.append(main);
    const side = el('div', 'trophy-side');
    if (!hidden) {
      side.append(gradePill(t.grade));
      const target = psnTargetText(t);
      if (target) side.append(el('span', 'psn-target', target));
    }
    li.append(side);
    list.append(li);
  });
  view.append(list);
}

export function renderAbout(view) {
  view.replaceChildren();
  view.append(el('h2', null, 'About & keyboard shortcuts'));
  const grid = el('div', 'about-grid');
  const about = el('div', 'card');
  about.append(el('h3', null, 'What this is'));
  about.append(el('p', null, 'Leonida Ledger is an offline guide and tracker for the 55 PlayStation 5 trophies of Grand Theft Auto VI. It runs entirely from its own files: no account, no network, nothing uploaded. Your progress and notes live in this browser only, and you can export them as a JSON file.'));
  about.append(el('p', null, 'The game launched on 19 Nov 2026. Every guide here is written in our own words from the official trophy descriptions and the PSN progress targets. Where a place or step is not pinned down yet, the guide says so plainly instead of inventing one — the guides will be checked in the game as players confirm them.'));
  about.append(el('h3', null, 'Sources'));
  const srcs = el('ul');
  const sourceItems = [
    'Exophase — the official trophy list: names, descriptions, grades and rarity.',
    'PSNProfiles — grades and the PSN progress targets (such as 0/42 Shooting Range challenges).',
    'Insider Gaming — which 28 trophies are hidden on PlayStation.',
    'EGamers.io and Outputlag — the possibly-missable flag on Positive Mental Attitude and the no-mission-replay report.',
  ];
  for (const s of sourceItems) srcs.append(el('li', null, s));
  about.append(srcs);
  grid.append(about);

  const keys = el('div', 'card');
  keys.append(el('h3', null, 'Keyboard shortcuts'));
  const table = document.createElement('table');
  table.className = 'keys-table';
  const rows = [
    ['/', 'Focus the search box'],
    ['T', 'Open the tracker'],
    ['R', 'Open the roadmap'],
    ['M', 'Open the missables page'],
    ['N', 'Open Next up'],
    ['D', 'Switch theme (sunset / paper)'],
    ['S', 'Toggle the spoiler setting'],
    ['?', 'Open this page'],
  ];
  for (const [key, desc] of rows) {
    const tr = document.createElement('tr');
    const td1 = document.createElement('td');
    const kbd = document.createElement('kbd');
    kbd.textContent = key;
    td1.append(kbd);
    tr.append(td1, el('td', null, desc));
    table.append(tr);
  }
  keys.append(table);
  grid.append(keys);
  view.append(grid);
}
