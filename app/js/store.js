// Leonida Ledger — saved state. Progress, notes, spoiler setting and theme live in
// localStorage under one key, so the guide remembers you between visits. Export and
// import move that state as a JSON file; nothing ever leaves the browser.

import { STORAGE_KEY } from './config.js';

function blankState() {
  return {
    earned: [],
    notes: {},
    spoilers: true,
    theme: 'dark',
    filters: { grade: 'all', kind: 'all', query: '', onlyUnearned: false, onlyMissable: false },
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return blankState();
    const parsed = JSON.parse(raw);
    const state = { ...blankState(), ...parsed, filters: { ...blankState().filters, ...(parsed.filters || {}) } };
    state.earned = Array.isArray(state.earned) ? state.earned.filter((n) => Number.isInteger(n)) : [];
    state.notes = typeof state.notes === 'object' && state.notes !== null ? state.notes : {};
    return state;
  } catch {
    return blankState();
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function earnedSet(state) {
  return new Set(state.earned);
}

export function setEarned(state, id, isEarned) {
  const earned = earnedSet(state);
  if (isEarned) earned.add(id);
  else earned.delete(id);
  state.earned = [...earned].sort((a, b) => a - b);
  saveState(state);
}

export function setNote(state, id, text) {
  if (text.trim()) state.notes[id] = text;
  else delete state.notes[id];
  saveState(state);
}

export function exportState(state) {
  return JSON.stringify(
    { app: 'leonida-ledger', version: 1, exportedAt: new Date().toISOString(), earned: state.earned, notes: state.notes },
    null,
    2,
  );
}

export function importState(text) {
  const parsed = JSON.parse(text);
  const earned = Array.isArray(parsed.earned) ? parsed.earned.filter((n) => Number.isInteger(n)) : null;
  if (earned === null) throw new Error('Import file has no earned list');
  const notes = typeof parsed.notes === 'object' && parsed.notes !== null ? parsed.notes : {};
  return { earned, notes };
}

export function downloadFile(filename, text, mime) {
  const url = URL.createObjectURL(new Blob([text], { type: mime || 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
