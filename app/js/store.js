// store.js — progress saved in localStorage, with export and import.
const KEY = 'leonida-evidence-file-v1';

export function defaultState() {
  return { earned: {}, notes: {}, counts: {}, spoilers: true };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return { ...defaultState(), ...parsed };
  } catch {
    return defaultState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // storage full or unavailable — progress stays in memory for this session
  }
}

export function exportState(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'leonida-evidence-file-progress.json';
  a.click();
  URL.revokeObjectURL(url);
}

export async function importState(file) {
  const text = await file.text();
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== 'object') throw new Error('not a progress file');
  return { ...defaultState(), ...parsed };
}

export function resetState() {
  localStorage.removeItem(KEY);
  return defaultState();
}
