// dod admin UI — list-first. The left nav IS the spawn surface: click a dashboard to
// open it (starting it if stopped); inline icons stop/restart/forget without leaving the
// list. No header tab-strip, no "+ add" — adoption happens via `probe`/discovered + CLI.
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let STATE = [], DISC = [], SEL = null, FRAMED = null, MOUNT = null;
const LIVE = s => ['ready', 'external', 'running', 'starting', 'unhealthy', 'launched', 'port-busy-foreign'].includes(s);
const byId = id => STATE.find(e => e.id === id);
function stopMount() { if (MOUNT) { try { MOUNT.stop(); } catch (e) {} MOUNT = null; } }

async function post(action, payload) {
  const r = await fetch('/api/' + action, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Dod-Token': TOKEN },
    body: JSON.stringify(payload || {})
  });
  return r.json().catch(() => ({}));
}
async function tick() {
  let d; try { d = await (await fetch('/api/state')).json(); } catch (e) { return; }
  STATE = d.entries || []; DISC = d.discovered || [];
  if (SEL && !byId(SEL)) SEL = null;
  render();
}
function render() { renderNav(); renderStage(); renderDrawer(); renderCount(); }

function renderCount() {
  const live = STATE.filter(e => LIVE(e.state) && e.state !== 'archived').length;
  $('#count').textContent = `${live} live / ${STATE.length}`;
}

function rowActs(e) {
  let h = '';
  if (e.controllable && LIVE(e.state) && e.stop !== 'leave')
    h += `<span class="ico stop" title="stop" onclick="event.stopPropagation();act('stop','${e.id}')">■</span>`;
  if (e.controllable)
    h += `<span class="ico go" title="restart" onclick="event.stopPropagation();act('restart','${e.id}')">↻</span>`;
  if (e.source === 'local')   // only the writable tier can be forgotten; durable/provider → archive
    h += `<span class="ico warn" title="forget (remove from list)" onclick="event.stopPropagation();forget('${e.id}','${esc(e.name)}')">🗑</span>`;
  return h ? `<span class="acts">${h}</span>` : '';
}
function rowHtml(e, archived) {
  return `<div class="row ${e.id === SEL ? 'sel' : ''}" onclick="pick('${e.id}')">
    <span class="dot ${esc(e.state)}"></span>
    <span class="nm">${esc(e.name)}<small>${esc(e.blurb || e.state)}</small></span>
    ${archived ? `<span class="acts" style="display:flex"><span class="ico go" title="restore" onclick="event.stopPropagation();act('unarchive','${e.id}')">↺</span></span>` : rowActs(e)}
  </div>`;
}
function discHtml(d) {
  return `<div class="row" title="${esc(d.why || '')}">
    <span class="dot external"></span>
    <span class="nm">${esc(d.name)}<small>:${d.port} · ${esc(d.blurb || 'contract-speaker')}</small></span>
    <span class="acts" style="display:flex">
      <span class="ico go" title="pin" onclick="event.stopPropagation();post('pin',{id:'${d.id}'}).then(tick)">📌</span>
      <span class="ico warn" title="ignore" onclick="event.stopPropagation();post('ignore',{id:'${d.id}'}).then(tick)">✕</span>
    </span></div>`;
}
function renderNav() {
  const groups = {};
  STATE.filter(e => e.state !== 'archived').forEach(e => {
    (e.tags[0] || 'other').split(',').forEach(t => { (groups[t] = groups[t] || []).push(e); });
  });
  let h = '';
  Object.keys(groups).sort().forEach(g => {
    h += `<div class="grp"><span>${esc(g)}</span><span>${groups[g].length}</span></div>`;
    groups[g].forEach(e => h += rowHtml(e));
  });
  const arch = STATE.filter(e => e.state === 'archived');
  if (arch.length) { h += `<div class="grp"><span>archived</span><span>${arch.length}</span></div>`; arch.forEach(e => h += rowHtml(e, true)); }
  if (DISC.length) { h += `<div class="grp"><span>discovered</span><span>${DISC.length}</span></div>`; DISC.forEach(d => h += discHtml(d)); }
  $('#nav').innerHTML = h;
}

function renderStage() {
  const st = $('#stage');
  const cur = byId(SEL);
  const wantSpec = cur && (cur.state === 'ready' || cur.state === 'external') && cur.render === 'spec' && window.dashkit;
  if (!wantSpec) stopMount();
  if (!SEL) { st.outerHTML = '<div id="stage" class="cards">' + STATE.filter(e => e.state !== 'archived').map(cardHtml).join('') + '</div>'; return; }
  const e = byId(SEL); if (!e) { st.innerHTML = ''; return; }
  if (e.type === 'terminal') { st.outerHTML = `<div id="stage" class="pane"><h2>${esc(e.name)}</h2><div>Terminal dashboard — launched ${e.launched_at ? new Date(e.launched_at * 1000).toLocaleTimeString() : ''}. dod can't see its window state (accepted gap).</div><button class="btn" onclick="act('start','${e.id}')">Re-launch</button></div>`; return; }
  if (e.state === 'ready' || e.state === 'external' || e.state === 'running') {
    if (e.render === 'spec' && window.dashkit) {
      if (FRAMED !== 'spec:' + e.id) {
        st.outerHTML = '<div id="stage" class="dk-host"></div>'; FRAMED = 'spec:' + e.id;
        MOUNT = window.dashkit.mount({ renderUrl: '/api/render?id=' + encodeURIComponent(e.id), mount: $('#stage') });
      }
      return;
    }
    if (e.embeddable) {
      if (FRAMED !== e.id) { st.outerHTML = `<iframe id="stage" src="http://127.0.0.1:${e.port}/"></iframe>`; FRAMED = e.id; }
      return;
    }
    st.outerHTML = `<div id="stage" class="pane"><h2>${esc(e.name)} can't be embedded</h2><div>It sends frame-blocking headers.</div><a class="btn" href="http://127.0.0.1:${e.port}/" target="_blank">open in new tab ↗</a></div>`; FRAMED = null; return;
  }
  FRAMED = null;
  if (e.state === 'starting') { st.outerHTML = `<div id="stage" class="pane"><h2>starting ${esc(e.name)}…</h2><pre>${esc(e.log_tail || '')}</pre></div>`; return; }
  if (e.state === 'crashed' || e.state === 'unhealthy') { st.outerHTML = `<div id="stage" class="pane"><h2 style="color:var(--err)">${esc(e.name)} — ${e.state}${e.exit != null ? ' (exit ' + e.exit + ')' : ''}</h2>${e.crash_note ? `<div>${esc(e.crash_note)}</div>` : ''}<pre>${esc(e.log_tail || '')}</pre><button class="btn" onclick="act('restart','${e.id}')">Restart</button></div>`; return; }
  if (e.state === 'port-busy-foreign') { st.outerHTML = `<div id="stage" class="pane"><h2 style="color:var(--err)">port ${e.port} busy (foreign)</h2><div>Something dod didn't launch holds this port.</div></div>`; return; }
  st.outerHTML = `<div id="stage" class="pane"><h2>${esc(e.name)}</h2><div>${esc(e.why)}</div><button class="btn" onclick="act('start','${e.id}')">Start</button></div>`;
}
function cardHtml(e) {
  return `<div class="card" onclick="pick('${e.id}')"><div class="nm"><span class="dot ${esc(e.state)}"></span> ${esc(e.name)}</div>
    <small>${esc(e.blurb)}</small><div style="margin-top:7px;color:var(--muted);font-size:11px">${esc(e.state)}${e.port ? ' · :' + e.port : ''}</div></div>`;
}
function renderDrawer() {
  const e = SEL && byId(SEL); if (!e) { $('#drawer').innerHTML = '<span style="color:var(--muted)">Select a dashboard.</span>'; return; }
  const canStop = e.controllable && LIVE(e.state) && e.stop !== 'leave';
  const canStart = !LIVE(e.state) || e.state === 'stopped';
  $('#drawer').innerHTML = `<div class="why">${esc(e.why)}</div>
    <div class="meta">${esc(e.state)} · ${e.port ? ':' + e.port : '(no port)'} · ${esc((e.cmd || []).join(' ') || '—')} · ${esc(e.source)}${e.provider ? ' · ' + esc(e.provider) : ''}</div>
    <div class="drawer-acts">
      <button class="btn" ${canStart ? '' : 'disabled'} onclick="act('start','${e.id}')">Start</button>
      <button class="btn warn" ${canStop ? '' : 'disabled'} onclick="act('stop','${e.id}')">Stop</button>
      <button class="btn" ${e.controllable ? '' : 'disabled'} onclick="act('restart','${e.id}')">Restart</button>
      <button class="btn" onclick="act('archive','${e.id}')">Archive</button>
      ${e.source === 'local' ? `<button class="btn warn" onclick="forget('${e.id}','${esc(e.name)}')">Forget</button>` : ''}
      ${e.port ? `<a class="btn" href="http://127.0.0.1:${e.port}/" target="_blank">open ↗</a>` : ''}
    </div>
    ${e.log_tail ? `<pre>${esc(e.log_tail)}</pre>` : ''}`;
}

async function pick(id) {
  const e = byId(id);
  if (e && !LIVE(e.state) && e.type !== 'terminal') { await post('start', { id }); }
  SEL = id; FRAMED = null; render();
}
async function act(action, id) {
  const r = await post(action, { id });
  if (r && r.ok === false && r.error) alert(`${action} failed: ${r.error}${r.detail ? '\n' + r.detail : ''}`);
  if (action === 'stop' && SEL === id) { SEL = null; FRAMED = null; }
  setTimeout(tick, 250);
}
async function forget(id, name) {
  if (!confirm(`Forget "${name}"? Removes it from the list (does not stop it if running).`)) return;
  const r = await post('forget', { id });
  if (r && r.ok === false) alert(`forget failed: ${r.error || ''}`);
  if (SEL === id) SEL = null;
  tick();
}
async function probe() { await post('probe', {}); tick(); }

tick(); setInterval(tick, 2000);
