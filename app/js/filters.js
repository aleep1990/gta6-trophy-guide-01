// filters.js — kind chips and the checklist filter (search, grade, kind, earned, spoilers).
export const KIND_CHIPS = [
  { id: '', label: 'All kinds' },
  { id: 'story', label: 'Story' },
  { id: 'missable', label: 'Missable' },
  { id: 'collectible', label: 'Collectibles' },
  { id: 'activity', label: 'Activities' },
  { id: 'robbery', label: 'Robberies' },
  { id: 'side', label: 'Side quests' },
  { id: 'hidden', label: 'Hidden' },
  { id: 'unconfirmed', label: 'Unconfirmed' },
];

export function hasUnconfirmed(trophy) {
  return (trophy.claims || []).some((c) => c.st === 'u');
}

export function isSpoilerHidden(trophy, state) {
  return state.spoilers && trophy.hidden && !state.earned[trophy.id];
}

export function filterTrophies(guide, state, query) {
  const q = (query.search || '').trim().toLowerCase();
  return guide.trophies.filter((t) => {
    if (query.grade && t.grade !== query.grade) return false;
    if (query.earned === 'earned' && !state.earned[t.id]) return false;
    if (query.earned === 'unearned' && state.earned[t.id]) return false;
    switch (query.kind) {
      case 'story': if (t.kind !== 'story') return false; break;
      case 'missable': if (!t.missable) return false; break;
      case 'collectible': if (t.kind !== 'collectible') return false; break;
      case 'activity': if (t.kind !== 'activity') return false; break;
      case 'robbery': if (t.kind !== 'robbery') return false; break;
      case 'side': if (t.kind !== 'side') return false; break;
      case 'hidden': if (!t.hidden) return false; break;
      case 'unconfirmed': if (!hasUnconfirmed(t)) return false; break;
      default: break;
    }
    if (q) {
      const hay = (t.name + ' ' + t.description + ' ' + t.guide).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}
