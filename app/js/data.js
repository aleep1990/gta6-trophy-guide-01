// data.js — loads the trophy file and computes the citation audit from it.
// The audit numbers are counted live from the data, never hard-coded.
export async function loadGuide() {
  const response = await fetch('data/trophies.json');
  if (!response.ok) throw new Error('could not load data/trophies.json');
  return response.json();
}

export function sourceById(guide, id) {
  return guide.sources.find((s) => s.id === id) || { id, name: 'Source ' + id, title: '', url: '' };
}

export function auditCounts(guide) {
  let claims = 0;
  let cited = 0;
  let backed2 = 0;
  let unconfirmed = 0;
  let disputes = 0;
  let steps = 0;
  let stepsCited = 0;
  const backing = new Map();
  for (const t of guide.trophies) {
    for (const c of t.claims || []) {
      claims++;
      if (c.s && c.s.length > 0) {
        cited++;
        if (c.s.length >= 2) backed2++;
        for (const id of c.s) backing.set(id, (backing.get(id) || 0) + 1);
      }
      if (c.st === 'u') unconfirmed++;
    }
    disputes += (t.disputes || []).length;
    for (const st of t.steps || []) {
      steps++;
      if (st.s && st.s.length > 0) stepsCited++;
    }
  }
  const guidesCiting = guide.trophies.filter((t) => (t.sources || []).length > 0).length;
  return {
    trophies: guide.trophies.length,
    claims,
    cited,
    backed2,
    unconfirmed,
    disputes,
    steps,
    stepsCited,
    guidesCiting,
    sourcesRead: guide.sources.length,
    backing,
  };
}

export function trophyById(guide, id) {
  return guide.trophies.find((t) => t.id === id);
}

export function roadmapOrder(guide) {
  return [...guide.trophies].sort((a, b) => a.stage - b.stage || a.id - b.id);
}

export function nextUp(guide, earned, n) {
  return roadmapOrder(guide).filter((t) => !earned[t.id]).slice(0, n);
}
