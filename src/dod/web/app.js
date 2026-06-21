// dod — project control panel. The left list is the catalog: each row is a project with
// an explicit status word and a start/stop button. Clicking a row SELECTS it (shows its
// dashboard on the right); it never starts anything — only the buttons do.
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let STATE = [], SEL = null, FRAMED = null, MOUNT = null;
const byId = id => STATE.find(e => e.id === id);
const isLive = e => e.status === 'live';
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
  STATE = (d.entries || []).filter(e => e.state !== 'archived');
  if (SEL && !byId(SEL)) SEL = null;
  render();
}
function render() { renderList(); renderDetail(); $('#count').textContent = `${STATE.filter(isLive).length} live / ${STATE.length}`; }

// status → one human word + a pill class
function statusWord(e) {
  if (e.state === 'starting') return ['starting…', 'starting'];
  if (e.state === 'unhealthy') return ['unhealthy', 'unhealthy'];
  if (isLive(e)) return ['live', 'live'];
  const r = e.last_stop_reason;
  if (r && r.kind === 'crash') return [`crashed${r.exit != null ? ` (exit ${r.exit})` : ''}`, 'crash'];
  if (r && r.kind === 'port-busy') return ['port busy', 'crash'];
  return ['stopped', 'stopped'];
}
const canStart = e => !isLive(e) && (e.cmd || []).length > 0;
const canStop = e => isLive(e) && e.controllable && e.stop !== 'leave';

function rowButton(e) {
  if (canStop(e)) return `<button class="btn stop" onclick="event.stopPropagation();act('stop','${e.id}')">Stop</button>`;
  if (canStart(e)) return `<button class="btn" onclick="event.stopPropagation();act('start','${e.id}')">Start</button>`;
  return '';
}
function renderList() {
  $('#list').innerHTML = STATE.map(e => {
    const [word, cls] = statusWord(e);
    return `<div class="item ${e.id === SEL ? 'sel' : ''}" onclick="pick('${e.id}')">
      <div class="nm">${esc(e.name)}</div>
      <div class="right"><span class="pill ${cls}">${esc(word)}</span>${rowButton(e)}</div>
      <div class="desc">${esc(e.blurb || '')}</div>
    </div>`;
  }).join('') || '<div class="empty" style="padding:30px">No projects. Add a dod.project.json to a project, or register one with the CLI.</div>';
}

function renderDetail() {
  const host = $('#detail');
  const e = SEL && byId(SEL);
  const wantSpec = e && isLive(e) && e.render === 'spec' && window.dashkit;
  if (!wantSpec) stopMount();
  if (!e) { host.innerHTML = '<div class="empty">Select a project on the left.</div>'; FRAMED = null; return; }

  const [word, cls] = statusWord(e);
  const head = `<div class="dhead"><h2>${esc(e.name)}</h2><span class="pill ${cls}">${esc(word)}</span>
    <span class="why">${esc(e.blurb || '')}</span>
    <div class="acts">
      ${canStart(e) ? `<button class="btn" onclick="act('start','${e.id}')">Start</button>` : ''}
      ${canStop(e) ? `<button class="btn stop" onclick="act('stop','${e.id}')">Stop</button>` : ''}
      ${e.controllable ? `<button class="btn" onclick="act('restart','${e.id}')">Restart</button>` : ''}
      ${e.port ? `<a class="btn" href="http://127.0.0.1:${e.port}/" target="_blank">open ↗</a>` : ''}
    </div></div>`;

  let body;
  if (e.type === 'terminal') {
    body = `<div class="pane"><h3>Terminal project</h3><div>dod can launch it but can't observe its window (accepted gap).</div></div>`;
  } else if (e.state === 'starting') {
    body = `<div class="pane"><div class="spin"></div><h3>starting ${esc(e.name)}…</h3><pre>${esc(e.log_tail || '')}</pre></div>`;
  } else if (e.state === 'crashed' || e.state === 'unhealthy') {
    body = `<div class="pane"><h3 style="color:var(--err)">${esc(word)}</h3><pre>${esc(e.log_tail || '')}</pre><button class="btn" onclick="act('restart','${e.id}')">Restart</button></div>`;
  } else if (!isLive(e)) {
    body = `<div class="pane"><h3>${esc(word)}</h3><div>${esc(e.why || '')}</div>${canStart(e) ? `<button class="btn" onclick="act('start','${e.id}')">Start</button>` : '<div>Start it yourself; dod will adopt the port.</div>'}</div>`;
  } else if (e.render === 'spec' && window.dashkit) {
    body = '<div class="dk-host" id="dkhost"></div>';
  } else if (e.embeddable) {
    body = `<iframe id="frame" src="http://127.0.0.1:${e.port}/"></iframe>`;
  } else {
    body = `<div class="pane"><h3>Can't embed ${esc(e.name)}</h3><a class="btn" href="http://127.0.0.1:${e.port}/" target="_blank">open in new tab ↗</a></div>`;
  }

  // Only rebuild the DOM when the rendered target changes, so the spec/iframe doesn't flicker every tick.
  const key = `${e.id}:${e.state}:${e.render}`;
  if (FRAMED !== key) {
    host.innerHTML = head + `<div class="body">${body}</div>`;
    FRAMED = key;
    if (e.render === 'spec' && isLive(e) && window.dashkit) {
      MOUNT = window.dashkit.mount({
        renderUrl: '/api/render?id=' + encodeURIComponent(e.id),
        mount: $('#dkhost'),
        onAction: (action, payload) => postAction(e.id, action, payload),
      });
    }
  } else {
    host.querySelector('.dhead').outerHTML = head;   // refresh controls/status without remounting the body
  }
}

async function pick(id) { SEL = id; FRAMED = null; render(); }   // select only — never starts
async function act(verb, id) {
  const r = await post(verb, { id });
  if (r && r.ok === false && r.error) alert(`${verb} failed: ${r.error}${r.detail ? '\n' + r.detail : ''}`);
  FRAMED = null;
  setTimeout(tick, 250);
}
async function postAction(id, action, payload) {        // interact-down from a rendered dashboard
  const r = await post('action', { id, action, payload });
  if (r && r.ok === false && r.error) alert(`action failed: ${r.error}`);
  setTimeout(tick, 150);
}

tick(); setInterval(tick, 2000);
