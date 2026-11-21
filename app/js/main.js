// main.js — boots the guide: loads the data, wires the tracker, filters,
// spoiler setting, export/import, views and the screenshot seed parameters.
import { loadGuide, auditCounts, trophyById, roadmapOrder } from './data.js';
import { loadState, saveState, exportState, importState, resetState } from './store.js';
import { KIND_CHIPS, filterTrophies } from './filters.js';
import {
  renderAudit, renderChecklist, renderDetail, renderNextUp, renderRoadmapMini,
  renderSourcesRail, renderDisputesRail, renderRoadmapView, renderSourcesView, esc,
} from './views.js';

const params = new URLSearchParams(location.search);
let guide;
let audit;
let state = loadState();
let selectedId = 28; // Positive Mental Attitude — the missable one, a good first read
let query = { search: '', grade: '', earned: '', kind: '' };

const $ = (id) => document.getElementById(id);

function applySeedParams() {
  const seed = Number(params.get('seed'));
  if (Number.isInteger(seed) && seed > 0) {
    const order = roadmapOrder(guide);
    for (let i = 0; i < Math.min(seed, order.length); i++) state.earned[order[i].id] = true;
  }
  if (params.get('spoilers') === 'off') state.spoilers = false;
  const trophy = Number(params.get('trophy'));
  if (Number.isInteger(trophy) && trophyById(guide, trophy)) selectedId = trophy;
  const view = params.get('view');
  if (view === 'roadmap' || view === 'sources' || view === 'checklist') switchView(view);
  $('spoilerToggle').checked = state.spoilers;
  saveState(state);
}

function applyFocusScroll() {
  // Screenshot deep-link: scroll the detail pane to a section (?focus=guide|claims|disputes|sources)
  const focus = params.get('focus');
  if (!focus) return;
  const target =
    focus === 'guide' ? document.querySelector('.guide-text') :
    focus === 'claims' ? document.getElementById('claimsHeading') :
    focus === 'disputes' ? document.querySelector('.dispute') :
    focus === 'sources' ? document.querySelector('.source-list') : null;
  if (target) target.scrollIntoView({ block: 'start' });
}

function renderAll() {
  const earnedCount = guide.trophies.filter((t) => state.earned[t.id]).length;
  $('progressText').textContent = earnedCount + ' / ' + guide.trophies.length + ' earned';
  $('progressFill').style.width = Math.round((earnedCount / guide.trophies.length) * 100) + '%';
  const list = filterTrophies(guide, state, query);
  $('listCount').textContent = list.length + ' of ' + guide.trophies.length + ' trophies';
  $('checklist').innerHTML = renderChecklist(guide, state, list, selectedId);
  $('detailPane').innerHTML = renderDetail(guide, state, trophyById(guide, selectedId));
  $('nextUp').innerHTML = renderNextUp(guide, state);
  $('roadmapMini').innerHTML = renderRoadmapMini(guide, state);
  $('sourcesRail').innerHTML = renderSourcesRail(guide, audit);
  $('disputesRail').innerHTML = renderDisputesRail(guide);
  $('roadmapView').innerHTML = renderRoadmapView(guide, state);
  $('sourcesView').innerHTML = renderSourcesView(guide, audit);
}

function switchView(name) {
  document.querySelectorAll('.view-tab').forEach((b) => b.classList.toggle('active', b.dataset.view === name));
  $('viewChecklist').hidden = name !== 'checklist';
  $('viewRoadmap').hidden = name !== 'roadmap';
  $('viewSources').hidden = name !== 'sources';
  $('toolbar').style.display = name === 'checklist' ? '' : 'none';
}

function selectTrophy(id) {
  if (!trophyById(guide, id)) return;
  selectedId = id;
  switchView('checklist');
  renderAll();
  const el = document.querySelector('#checklist li[data-trophy="' + id + '"]');
  if (el) el.scrollIntoView({ block: 'nearest' });
}

function toggleEarned(id) {
  if (state.earned[id]) delete state.earned[id];
  else state.earned[id] = true;
  saveState(state);
  renderAll();
}

async function boot() {
  guide = await loadGuide();
  audit = auditCounts(guide);
  $('auditCounts').innerHTML = renderAudit(audit);
  $('footSources').innerHTML = 'Sources: ' + guide.sources.map((s) =>
    '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.name) + '</a>'
  ).join(' · ') + '.';
  $('kindChips').innerHTML = KIND_CHIPS.map((k) =>
    '<button type="button" data-kind="' + k.id + '" class="' + (k.id === '' ? 'active' : '') + '">' + esc(k.label) + '</button>'
  ).join('');

  $('searchInput').addEventListener('input', (e) => { query.search = e.target.value; renderAll(); });
  $('gradeFilter').addEventListener('change', (e) => { query.grade = e.target.value; renderAll(); });
  $('earnedFilter').addEventListener('change', (e) => { query.earned = e.target.value; renderAll(); });
  $('kindChips').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-kind]');
    if (!b) return;
    query.kind = b.dataset.kind;
    document.querySelectorAll('#kindChips button').forEach((x) => x.classList.toggle('active', x === b));
    renderAll();
  });
  $('spoilerToggle').checked = state.spoilers;
  $('spoilerToggle').addEventListener('change', (e) => {
    state.spoilers = e.target.checked;
    saveState(state);
    renderAll();
  });
  document.querySelectorAll('.view-tab').forEach((b) =>
    b.addEventListener('click', () => { switchView(b.dataset.view); })
  );
  $('checklist').addEventListener('click', (e) => {
    const li = e.target.closest('li[data-trophy]');
    if (li) selectTrophy(Number(li.dataset.trophy));
  });
  $('checklist').addEventListener('change', (e) => {
    if (e.target.matches('input[data-earn]')) toggleEarned(Number(e.target.dataset.earn));
  });
  $('detailPane').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-earn]');
    if (btn) toggleEarned(Number(btn.dataset.earn));
  });
  $('detailPane').addEventListener('change', (e) => {
    if (e.target.matches('input[data-count]')) {
      const id = Number(e.target.dataset.count);
      state.counts[id] = Math.max(0, Number(e.target.value) || 0);
      saveState(state);
      renderAll();
    }
  });
  $('detailPane').addEventListener('input', (e) => {
    if (e.target.matches('textarea[data-note]')) {
      const id = Number(e.target.dataset.note);
      state.notes[id] = e.target.value;
      saveState(state);
    }
  });
  document.querySelector('.rail-pane').addEventListener('click', (e) => {
    const li = e.target.closest('[data-trophy]');
    if (li) selectTrophy(Number(li.dataset.trophy));
  });
  $('roadmapView').addEventListener('click', (e) => {
    const li = e.target.closest('[data-trophy]');
    if (li) selectTrophy(Number(li.dataset.trophy));
  });
  $('sourcesView').addEventListener('click', (e) => {
    const li = e.target.closest('[data-trophy]');
    if (li) selectTrophy(Number(li.dataset.trophy));
  });
  $('exportBtn').addEventListener('click', () => exportState(state));
  $('importFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      state = await importState(file);
      $('spoilerToggle').checked = state.spoilers;
      saveState(state);
      renderAll();
    } catch {
      alert('That file is not a valid progress export.');
    }
    e.target.value = '';
  });
  $('resetBtn').addEventListener('click', () => {
    if (confirm('Reset all earned trophies, notes and counters?')) {
      state = resetState();
      $('spoilerToggle').checked = state.spoilers;
      renderAll();
    }
  });

  applySeedParams();
  renderAll();
  applyFocusScroll();
}

boot().catch((err) => {
  document.getElementById('detailPane').innerHTML =
    '<p class="empty">Could not load the guide data: ' + esc(err.message) + '</p>';
});
