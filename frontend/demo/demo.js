// Mock-data playground for dashkit. Loads window.dashkit (../dist/dashkit.js) and renders a
// spec that exercises every atom + chart kind. The action buttons run the interact-down path
// client-side: they mutate local state and re-render. No server, no build of its own.
(function () {
  'use strict';
  const root = document.getElementById('dk-demo-root');
  const state = { count: 7, history: ['booted'] };

  function trend() {
    const out = [];
    let v = 8;
    for (let i = 0; i < 12; i++) {
      v += Math.round(Math.sin(i / 1.5) * 4);
      out.push(Math.max(1, v + (i === 11 ? state.count : 0)));
    }
    return out;
  }

  function spec() {
    const t = trend();
    return {
      title: 'dashkit demo (mock data)',
      panels: [
        { type: 'section', title: 'Overview' },
        { type: 'stat', label: 'Count', value: state.count, sub: 'clicks', spark: t },
        { type: 'stat', label: 'Throughput', value: 12840, sub: 'req/min' },
        { type: 'stat', label: 'Error rate', value: 0.42, sub: '%' },
        { type: 'progress', label: 'Disk', value: Math.min(100, state.count * 7), max: 100 },
        { type: 'badge', tone: 'ok', text: 'healthy' },
        { type: 'badge', tone: 'warn', text: 'degraded' },
        { type: 'badge', tone: 'err', text: 'down' },

        { type: 'section', title: 'Charts' },
        {
          type: 'chart', kind: 'line', title: 'Latency p50 (line + marker)',
          x: t.map((_, i) => 'd' + i), series: [{ name: 'p50', values: t }],
          markers: [{ x: 'd6', label: 'deploy', tone: 'accent' }],
        },
        {
          type: 'chart', kind: 'bars', title: 'By region (grouped bars)',
          x: ['us', 'eu', 'ap'], series: [{ name: 'in', values: [9, 6, 4] }, { name: 'out', values: [5, 8, 3] }],
        },
        {
          type: 'chart', kind: 'stacked', title: 'Mix (stacked)',
          x: ['mon', 'tue', 'wed'], series: [{ name: 'a', values: [3, 5, 2] }, { name: 'b', values: [4, 2, 6] }],
        },
        { type: 'chart', kind: 'area', title: 'Volume (area)', x: t.map((_, i) => i), series: [{ name: 'v', values: t }] },
        {
          type: 'chart', kind: 'hbar', title: 'Top endpoints (hbar)',
          x: ['/api/state', '/api/render', '/api/action', '/healthz'], series: [{ values: [120, 80, 45, 12] }],
        },
        {
          type: 'chart', kind: 'diverging', title: 'Sentiment (diverging)',
          x: ['speed', 'cost', 'docs', 'support'], series: [{ values: [0.6, -0.3, 0.2, -0.7] }], left: 'them', right: 'you',
        },

        { type: 'section', title: 'Tables & text' },
        {
          type: 'table', title: 'Recent runs', columns: ['id', 'status', 'ms'], align: ['left', 'left', 'num'],
          rows: [['run-1', 'ok', 1240], ['run-2', 'ok', 980], ['run-3', 'fail', 4102]],
        },
        { type: 'kv', title: 'Build', items: [{ k: 'commit', v: 'e6acdbd' }, { k: 'node', v: 22 }, { k: 'lit', v: '3.x' }] },
        { type: 'log', title: 'Events', lines: state.history.slice(-6) },
        {
          type: 'prose', title: 'Notes',
          text: 'This dashboard is fed with mock data.\n\nEvery atom and chart kind on this page is rendered by the ported Lit dashkit. The buttons below run the interact-down path client-side.',
        },

        { type: 'section', title: 'Forms & lenses (W4b)' },
        {
          type: 'form', title: 'Edit target', action: 'save', submitLabel: 'Save', cancelAction: 'cancel',
          context: { id: 'svc-1' },
          fields: [
            { key: 'name', label: 'Name', value: 'web' },
            { key: 'replicas', label: 'Replicas', kind: 'number', value: 3 },
            { key: 'tier', label: 'Tier', kind: 'select', value: 'prod', options: [{ value: 'dev' }, { value: 'staging' }, { value: 'prod' }] },
            { key: 'autoscale', label: 'Autoscale', kind: 'checkbox', value: true },
            { key: 'notes', label: 'Notes', kind: 'textarea', value: 'mock note' },
          ],
        },
        {
          type: 'wordcloud', title: 'Topics (toggle lens + cloud/bars)',
          facets: [
            {
              key: 'errors', label: 'Errors', terms: [
                { text: 'timeout', weight: 18 }, { text: 'ECONNRESET', weight: 11 }, { text: '500', weight: 9 },
                { text: 'oom', weight: 7 }, { text: 'panic', weight: 5 }, { text: 'EADDRINUSE', weight: 4 }, { text: 'dns', weight: 3 },
              ],
            },
            {
              key: 'paths', label: 'Paths', terms: [
                { text: '/api/state', weight: 22 }, { text: '/api/render', weight: 16 }, { text: '/api/action', weight: 9 },
                { text: '/healthz', weight: 6 }, { text: '/app.js', weight: 4 },
              ],
            },
          ],
        },

        { type: 'section', title: 'Fix-dependency DAG' },
        {
          type: 'dag', title: 'Remediation units — what unblocks what (hover a node)',
          nodes: [
            { id: 'atlas', label: 'Atlas baseline', status: 'committed', sub: 'baseline' },
            { id: 'ports', label: 'Remediate ports', status: 'committed', sub: 'S · low · 2 findings', dependsOn: ['atlas'] },
            { id: 'registry', label: 'Remediate registry', status: 'green', sub: 'M · med · 5 findings', dependsOn: ['atlas'] },
            { id: 'sampler', label: 'Remediate sampler', status: 'queued', sub: 'S · low · 1 finding', dependsOn: ['ports'] },
            { id: 'supervisor', label: 'Remediate supervisor', status: 'queued', sub: 'L · high · 7 findings', dependsOn: ['ports', 'registry'] },
            { id: 'cli', label: 'Remediate cli', status: 'in-progress', sub: 'M · med · 3 findings', dependsOn: ['registry'] },
            { id: 'server', label: 'Remediate server', status: 'blocked', sub: 'M · high · 4 findings', dependsOn: ['supervisor'] },
            { id: 'web', label: 'Remediate web', status: 'error', sub: 'S · med · 2 findings', dependsOn: ['cli', 'atlas'] },
          ],
        },

        { type: 'section', title: 'Actions (interact-down)' },
        {
          type: 'actions', title: 'Try it',
          buttons: [
            { label: 'Increment', action: 'inc', tone: 'accent' },
            { label: 'Add 5', action: 'add', payload: { n: 5 } },
            { label: 'Reset', action: 'reset', tone: 'err' },
          ],
        },
      ],
    };
  }

  function onAction(action, payload) {
    if (action === 'inc') state.count += 1;
    else if (action === 'add') state.count += (payload && payload.n) || 0;
    else if (action === 'reset') state.count = 0;
    else if (action === 'save') { state.history.push('save ' + JSON.stringify((payload && payload.values) || {})); render(); return; }
    else if (action === 'cancel') { state.history.push('cancel'); render(); return; }
    state.history.push(action + (payload && payload.n ? ' ' + payload.n : '') + ' -> count=' + state.count);
    render();
  }

  function render() {
    window.dashkit.renderSpec(spec(), root, onAction);
  }
  render();
})();
