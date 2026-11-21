// views.js — renders the checklist, the guide detail, the planner rail,
// the roadmap view and the sources & disputes view.
import { sourceById } from './data.js';
import { hasUnconfirmed, isSpoilerHidden } from './filters.js';

export function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function refChips(sources, guide) {
  return (sources || [])
    .map((id) => {
      const s = sourceById(guide, id);
      return '<span class="src-ref" title="' + esc(s.name + ' — ' + s.title) + '">[' + id + ']</span>';
    })
    .join('');
}

export function renderAudit(audit) {
  return (
    '<b>' + audit.trophies + '/' + audit.trophies + '</b> official name · description · grade' +
    ' &nbsp;·&nbsp; <b>' + audit.cited + '/' + audit.claims + '</b> claims cited' +
    ' &nbsp;·&nbsp; <b>' + audit.backed2 + '</b> backed by 2+ sources' +
    ' &nbsp;·&nbsp; <b>' + audit.stepsCited + '/' + audit.steps + '</b> steps cited' +
    ' &nbsp;·&nbsp; <b>' + audit.disputes + '</b> disputes shown both ways' +
    ' &nbsp;·&nbsp; <b>' + audit.unconfirmed + '</b> unconfirmed flagged' +
    ' &nbsp;·&nbsp; <b>' + audit.guidesCiting + '/' + audit.trophies + '</b> guides cite sources' +
    ' &nbsp;·&nbsp; <b>' + audit.sourcesRead + '</b> sources read'
  );
}

export function renderChecklist(guide, state, list, selectedId) {
  if (!list.length) return '<li class="empty">No trophies match these filters.</li>';
  return list
    .map((t) => {
      const hidden = isSpoilerHidden(t, state);
      const earned = !!state.earned[t.id];
      const name = hidden ? 'Hidden trophy — earn it to reveal' : t.name;
      const desc = hidden ? 'Hidden on PlayStation until earned.' : t.description;
      const tags = [];
      if (t.missable) tags.push('<span class="tag missable">MISSABLE</span>');
      if (t.hidden) tags.push('<span class="tag hidden-t">HIDDEN</span>');
      if (hasUnconfirmed(t)) tags.push('<span class="tag unconfirmed">UNCONFIRMED</span>');
      if (t.target) tags.push('<span class="tag">' + esc(String(t.target.of)) + ' ' + esc(t.target.unit) + '</span>');
      return (
        '<li class="' + (earned ? 'earned' : '') + (t.id === selectedId ? ' selected' : '') + '" data-trophy="' + t.id + '">' +
        '<input type="checkbox" ' + (earned ? 'checked' : '') + ' data-earn="' + t.id + '" aria-label="Mark ' + esc(name) + ' earned">' +
        '<span class="grade-dot ' + t.grade + '" title="' + t.grade + '"></span>' +
        '<span class="t-main"><span class="t-name">' + esc(name) + '</span><br>' +
        '<span class="t-desc">' + esc(desc) + '</span>' +
        '<span class="t-meta">' + tags.join(' ') + '</span></span></li>'
      );
    })
    .join('');
}

function sourceListHtml(guide, trophy) {
  const ids = [...new Set([
    ...(trophy.sources || []),
    ...(trophy.claims || []).flatMap((c) => c.s || []),
    ...(trophy.steps || []).flatMap((s) => s.s || []),
  ])].sort((a, b) => a - b);
  return (
    '<h3>Sources for this trophy</h3><ul class="source-list">' +
    ids.map((id) => {
      const s = sourceById(guide, id);
      return '<li><span class="src-num">[' + id + ']</span><b>' + esc(s.name) + '</b> — ' +
        '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.title) + '</a></li>';
    }).join('') +
    '</ul>'
  );
}

export function renderDetail(guide, state, trophy) {
  if (!trophy) return '<p class="empty">Select a trophy from the checklist to see its cited guide.</p>';
  const earned = !!state.earned[trophy.id];
  const hidden = isSpoilerHidden(trophy, state);
  const count = state.counts[trophy.id] || 0;
  let html = '';
  html += '<div class="detail-grade ' + trophy.grade + '">' + trophy.grade + ' trophy</div>';
  html += '<h2 class="t-name">' + esc(hidden ? 'Hidden trophy' : trophy.name) + '</h2>';
  if (trophy.missable) {
    html += '<div class="missable-banner"><b>Potentially missable.</b> ' +
      'The first meditation is only available in Chapter 1 — see the guide and the dispute below before you leave the chapter.</div>';
  }
  html += '<div class="official"><span class="lbl">Official description (as PlayStation publishes it)</span>' +
    esc(hidden ? 'Hidden on PlayStation until earned.' : trophy.description) + '</div>';
  if (hidden) {
    html += '<p class="guide-text">This is a hidden story trophy. Turn spoilers off (top toolbar) or earn it to reveal its guide.</p>';
  } else {
    html += '<p class="guide-text">' + esc(trophy.guide) + '</p>';
    html += '<h3>Cited steps</h3><ol class="steps">' +
      trophy.steps.map((s) => '<li>' + esc(s.t) + refChips(s.s, guide) + '</li>').join('') +
      '</ol>';
    html += '<h3 id="claimsHeading">Cited facts — ' + trophy.claims.length + ' claims</h3><ul class="claims">' +
      trophy.claims.map((c) => {
        const cls = c.st === 'u' ? 'unconfirmed' : c.st === 'd' ? 'disputed' : '';
        const flag = c.st === 'u' ? ' <span class="src-ref unconfirmed">UNCONFIRMED</span>' : '';
        return '<li class="' + cls + '">' + esc(c.t) + refChips(c.s, guide) + flag + '</li>';
      }).join('') +
      '</ul>';
    if ((trophy.disputes || []).length) {
      html += '<h3>Disputes — shown both ways</h3>' +
        trophy.disputes.map((d) =>
          '<div class="dispute"><div class="d-topic">' + esc(d.topic) + '</div>' +
          '<div class="d-side"><b>A:</b> ' + esc(d.a) + '</div>' +
          '<div class="d-side"><b>B:</b> ' + esc(d.b) + '</div>' +
          '<div class="d-call"><b>Our call:</b> ' + esc(d.call) + '</div></div>'
        ).join('');
    }
    html += sourceListHtml(guide, trophy);
  }
  if (trophy.target) {
    const reached = count >= trophy.target.of;
    html += '<div class="counter-row"><label>Your progress: ' +
      '<input type="number" min="0" max="' + trophy.target.of + '" value="' + count + '" data-count="' + trophy.id + '"> / ' +
      trophy.target.of + ' ' + esc(trophy.target.unit) + '</label>' +
      (reached ? '<b style="color:var(--ok)">Target reached — tick it earned.</b>' : '') + '</div>';
  }
  html += '<div class="counter-row"><button type="button" class="earned-btn ' + (earned ? 'earned' : '') + '" data-earn="' + trophy.id + '">' +
    (earned ? '✓ Earned — click to unmark' : 'Mark as earned') + '</button></div>';
  html += '<h3>Your notes</h3><textarea data-note="' + trophy.id + '" placeholder="Your own notes for this trophy…">' +
    esc(state.notes[trophy.id] || '') + '</textarea>';
  return html;
}

export function renderNextUp(guide, state) {
  const order = [...guide.trophies].sort((a, b) => a.stage - b.stage || a.id - b.id);
  const next = order.filter((t) => !state.earned[t.id]).slice(0, 5);
  let html = '<h2>Next up — roadmap order</h2>';
  if (!next.length) return html + '<p class="empty">All 55 earned. Leonida Legend.</p>';
  html += '<ul class="next-list">' + next.map((t) =>
    '<li data-trophy="' + t.id + '"><span class="t-name">' + esc(t.name) + '</span><br>' +
    '<span class="tag">STAGE ' + t.stage + '</span> <span class="tag">' + t.grade.toUpperCase() + '</span>' +
    (t.missable ? ' <span class="tag missable">MISSABLE</span>' : '') + '</li>'
  ).join('') + '</ul>';
  return html;
}

export function renderRoadmapMini(guide, state) {
  let html = '<h2>Platinum roadmap</h2>';
  for (const stage of guide.roadmap) {
    const items = guide.trophies.filter((t) => t.stage === stage.stage);
    const done = items.filter((t) => state.earned[t.id]).length;
    const pct = items.length ? Math.round((done / items.length) * 100) : 0;
    html += '<div class="stage-mini"><b>Stage ' + stage.stage + ' — ' + esc(stage.title) + '</b><br>' +
      '<span>' + done + ' / ' + items.length + ' trophies · ' + esc(stage.hours) + '</span>' +
      '<div class="mini-bar"><span style="width:' + pct + '%"></span></div></div>';
  }
  return html;
}

export function renderSourcesRail(guide, audit) {
  const rows = [...guide.sources]
    .map((s) => ({ s, n: audit.backing.get(s.id) || 0 }))
    .sort((a, b) => b.n - a.n);
  let html = '<h2>Sources rail — claims backed</h2><ul class="src-rail-list">';
  for (const { s, n } of rows) {
    html += '<li><b>' + esc(s.name) + '</b> — backs ' + n + ' claims<br>' +
      '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.title) + '</a></li>';
  }
  return html + '</ul>';
}

export function renderDisputesRail(guide) {
  const all = [];
  for (const t of guide.trophies) {
    for (const d of t.disputes || []) all.push({ trophy: t, d });
  }
  let html = '<h2>Disputes — ' + all.length + ' shown both ways</h2>';
  if (!all.length) return html + '<p class="empty">No disputes recorded.</p>';
  html += '<ul class="dispute-rail-list">' + all.slice(0, 6).map(({ trophy, d }) =>
    '<li data-trophy="' + trophy.id + '"><b>' + esc(d.topic) + '</b><br>' + esc(trophy.name) + '</li>'
  ).join('') + '</ul>';
  return html;
}

export function renderRoadmapView(guide, state) {
  let html = '<h2>Platinum roadmap — the order to earn them in</h2>' +
    '<p>Built from the official descriptions: story chapters first, then the 100% checklist, then Strangers &amp; Freaks cleanup. ' +
    'Difficulty 4/10, about 200 hours (PowerPyx, KeenGamer, GTABase — Push Square says 300 or more; see the dispute on Vice Got a Price!). ' +
    'One playthrough, no mission replay, 15 manual save slots.</p>';
  for (const stage of guide.roadmap) {
    const items = guide.trophies.filter((t) => t.stage === stage.stage);
    const done = items.filter((t) => state.earned[t.id]).length;
    html += '<div class="stage"><div class="stage-head"><h2>Stage ' + stage.stage + ' — ' + esc(stage.title) + '</h2>' +
      '<span class="stage-hours">' + esc(stage.hours) + ' · ' + done + '/' + items.length + ' earned</span></div>' +
      '<p>' + esc(stage.text) + '</p>' +
      '<ul class="stage-trophies">' + items.map((t) =>
        '<li class="' + (state.earned[t.id] ? 'earned' : '') + '" data-trophy="' + t.id + '">' +
        (state.earned[t.id] ? '✓ ' : '○ ') + esc(t.name) + ' <span class="tag">' + t.grade.toUpperCase() + '</span></li>'
      ).join('') + '</ul></div>';
  }
  const long = guide.trophies.find((t) => t.id === 14);
  html += '<div class="stage"><div class="stage-head"><h2>100% Completion checklist (A Long Road)</h2></div>' +
    '<p>The checklist itself, from the cited claims on A Long Road — partial targets only. Most things are not required in full.</p>' +
    '<table class="check100"><tr><th>Requirement</th><th>Target</th></tr>' +
    long.claims.filter((c) => c.t.includes('for 100%')).map((c) =>
      '<tr><td>' + esc(c.t) + '</td><td>' + refChips(c.s, guide) + '</td></tr>'
    ).join('') + '</table></div>';
  return html;
}

export function renderSourcesView(guide, audit) {
  let html = '<h2>Sources — ' + guide.sources.length + ' read, every claim cited</h2>' +
    '<p>Guides are written in our own words for this entry. A source is cited, never copied. ' +
    'The official names, descriptions and grades are the exception: they are shown exactly as PlayStation publishes them.</p>';
  html += '<ul class="source-list">' + [...guide.sources].map((s) => {
    const n = audit.backing.get(s.id) || 0;
    return '<li><span class="src-num">[' + s.id + ']</span><b>' + esc(s.name) + '</b> — backs ' + n + ' claims<br>' +
      '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.title) + '</a></li>';
  }).join('') + '</ul>';
  html += '<h2>All disputes — shown both ways</h2>';
  for (const t of guide.trophies) {
    for (const d of t.disputes || []) {
      html += '<div class="dispute dispute-full"><div class="d-topic">' + esc(t.name) + ' — ' + esc(d.topic) + '</div>' +
        '<div class="d-side"><b>A:</b> ' + esc(d.a) + '</div>' +
        '<div class="d-side"><b>B:</b> ' + esc(d.b) + '</div>' +
        '<div class="d-call"><b>Our call:</b> ' + esc(d.call) + '</div></div>';
    }
  }
  const unconf = guide.trophies.filter((t) => (t.claims || []).some((c) => c.st === 'u'));
  html += '<h2>Unconfirmed — ' + audit.unconfirmed + ' claims flagged honestly</h2>' +
    '<p>Five trophies have no confirmed method in any source as of 21 Nov 2026. We list them as unconfirmed rather than inventing a method.</p>' +
    '<ul class="next-list">' + unconf.map((t) =>
      '<li data-trophy="' + t.id + '"><span class="t-name">' + esc(t.name) + '</span> — ' + esc(t.description) + '</li>'
    ).join('') + '</ul>';
  return html;
}
