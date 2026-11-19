// Leonida Ledger — filtering, search and the spoiler rule.
// Spoilers ON hides a hidden trophy's name, description and guide until it is earned.
// Search covers names, descriptions, guides and kinds.

export function isSpoilerHidden(trophy, state) {
  return state.spoilers && trophy.hidden && !state.earned.includes(trophy.id);
}

export function applyFilters(trophies, state) {
  const { grade, kind, query, onlyUnearned, onlyMissable } = state.filters;
  const q = query.trim().toLowerCase();
  return trophies.filter((t) => {
    if (grade !== 'all' && t.grade !== grade) return false;
    if (kind !== 'all' && t.kind !== kind) return false;
    if (onlyUnearned && state.earned.includes(t.id)) return false;
    if (onlyMissable && !t.missable) return false;
    if (q) {
      const haystack = [t.name, t.description, t.guide, t.kind, t.missable_note].join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

// Next-up planner: story beats first (in story order), then quick single-action wins,
// then short grinds, then the rest by grade. Deterministic, so the same save always
// suggests the same next trophies.
export function planNextUp(trophies, state, limit) {
  const earned = new Set(state.earned);
  const rest = trophies.filter((t) => !earned.has(t.id));
  const story = rest.filter((t) => t.kind === 'story').sort((a, b) => a.id - b.id);
  const quick = rest.filter((t) => t.kind !== 'story' && t.psn_target == null && t.grade === 'bronze' && !t.missable);
  const shortGrind = rest.filter((t) => t.psn_target != null && t.psn_target <= 20 && !story.includes(t));
  const other = rest.filter((t) => !story.includes(t) && !quick.includes(t) && !shortGrind.includes(t));
  const ordered = [
    ...story.map((t) => ({ trophy: t, why: 'Story order — the next beat in the campaign.' })),
    ...quick.map((t) => ({ trophy: t, why: 'Quick win — one action, no grind.' })),
    ...shortGrind.map((t) => ({ trophy: t, why: `Short grind — PSN target ${t.psn_target}.` })),
    ...other.map((t) => ({ trophy: t, why: t.psn_target != null ? `Long grind — PSN target ${t.psn_target}.` : 'Bigger job — save it for later.' })),
  ];
  return ordered.slice(0, limit || 8);
}
