// Leonida Ledger — data loading. The trophy list lives in app/data/trophies.json
// and is fetched from the same folder as the app, so the guide works fully offline.

export async function loadTrophies() {
  const response = await fetch('data/trophies.json');
  if (!response.ok) throw new Error('Could not load data/trophies.json');
  const doc = await response.json();
  const trophies = Array.isArray(doc) ? doc : doc.trophies;
  if (!Array.isArray(trophies) || trophies.length === 0) {
    throw new Error('trophies.json has no trophies array');
  }
  return { doc, trophies };
}

export function trophyById(trophies, id) {
  return trophies.find((t) => t.id === id);
}

export function gradeCounts(trophies, earned) {
  const counts = {};
  for (const t of trophies) {
    counts[t.grade] = counts[t.grade] || { total: 0, earned: 0 };
    counts[t.grade].total += 1;
    if (earned.has(t.id)) counts[t.grade].earned += 1;
  }
  return counts;
}
