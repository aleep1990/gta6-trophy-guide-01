// Leonida Ledger — boot, hash routing, theme and keyboard shortcuts.
// Routes: #/tracker, #/roadmap, #/missables, #/planner, #/about, #/trophy/<id>.

import { loadTrophies } from './data.js';
import { loadState, saveState, setEarned } from './store.js';
import { renderAbout, renderDetail, renderMissables, renderPlanner, renderRoadmap, renderTracker, updateProgress } from './views.js';

const view = document.getElementById('view');
const state = loadState();
let trophies = [];

function applyTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  const btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = state.theme === 'dark' ? '☀ Paper theme' : '☾ Sunset theme';
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  saveState(state);
  applyTheme();
}

function toggleSpoilers() {
  state.spoilers = !state.spoilers;
  saveState(state);
  render();
}

const ctx = {
  onToggle(id, isEarned) {
    setEarned(state, id, isEarned);
    render();
  },
  rerender() {
    render();
  },
};

function setActiveTab(route) {
  for (const a of document.querySelectorAll('.tabs a')) {
    a.classList.toggle('active', a.dataset.view === route);
  }
}

function render() {
  if (trophies.length === 0) return;
  updateProgress(state, trophies);
  const hash = location.hash || '#/tracker';
  const match = hash.match(/^#\/trophy\/(\d+)$/);
  if (match) {
    setActiveTab('tracker');
    renderDetail(view, state, trophies, Number(match[1]), ctx);
    return;
  }
  const route = hash.replace(/^#\//, '').split('/')[0] || 'tracker';
  setActiveTab(route);
  if (route === 'roadmap') renderRoadmap(view, state, trophies, ctx);
  else if (route === 'missables') renderMissables(view, state, trophies, ctx);
  else if (route === 'planner') renderPlanner(view, state, trophies);
  else if (route === 'about') renderAbout(view);
  else renderTracker(view, state, trophies, ctx);
  // Keep the header spoiler button honest.
  const spoilerBtn = document.getElementById('spoilerToggleBtn');
  if (spoilerBtn) spoilerBtn.textContent = state.spoilers ? 'Spoilers: on' : 'Spoilers: off';
}

function addHeaderControls() {
  const header = document.querySelector('.masthead-inner');
  const controls = document.createElement('div');
  controls.style.display = 'flex';
  controls.style.gap = '8px';
  controls.style.flexWrap = 'wrap';
  const themeBtn = document.createElement('button');
  themeBtn.type = 'button';
  themeBtn.id = 'themeToggle';
  themeBtn.addEventListener('click', toggleTheme);
  controls.append(themeBtn);
  const spoilerBtn = document.createElement('button');
  spoilerBtn.type = 'button';
  spoilerBtn.id = 'spoilerToggleBtn';
  spoilerBtn.addEventListener('click', () => {
    toggleSpoilers();
    spoilerBtn.textContent = state.spoilers ? 'Spoilers: on' : 'Spoilers: off';
  });
  spoilerBtn.textContent = state.spoilers ? 'Spoilers: on' : 'Spoilers: off';
  controls.append(spoilerBtn);
  header.append(controls);
  applyTheme();
}

function addKeyboardShortcuts() {
  document.addEventListener('keydown', (event) => {
    const tag = (event.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || event.metaKey || event.ctrlKey || event.altKey) return;
    const key = event.key.toLowerCase();
    if (key === '/') {
      event.preventDefault();
      const search = document.getElementById('searchBox');
      if (search) search.focus();
      else location.hash = '#/tracker';
    } else if (key === 't') location.hash = '#/tracker';
    else if (key === 'r') location.hash = '#/roadmap';
    else if (key === 'm') location.hash = '#/missables';
    else if (key === 'n') location.hash = '#/planner';
    else if (key === 'd') toggleTheme();
    else if (key === 's') toggleSpoilers();
    else if (key === '?') location.hash = '#/about';
  });
}

async function boot() {
  addHeaderControls();
  addKeyboardShortcuts();
  try {
    const loaded = await loadTrophies();
    trophies = loaded.trophies;
  } catch (error) {
    view.replaceChildren();
    const card = document.createElement('div');
    card.className = 'card';
    card.textContent = 'Could not load the trophy list (data/trophies.json). Serve this folder with a static server — for example: node serve.ts — and open http://localhost:8080.';
    view.append(card);
    return;
  }
  window.addEventListener('hashchange', render);
  render();
}

boot();
