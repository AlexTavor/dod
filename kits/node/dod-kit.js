// dod kit — the dod-kit/1 contract, Node reference (zero-dependency, CommonJS).
// Mirror of src/dod/kit.py for Node projects (e.g. jobsearch). A dashboard is pure
// logic: it derives state and emits a dashkit spec; dod renders it and routes actions.
//   GET  /api/meta    -> {contract:"dod-kit/1", render:"spec", accepts_actions, ...}
//   GET  /api/render  -> the spec                                    (render: up)
//   POST /api/action  -> {action,payload} -> onAction -> result      (interact: down)
// Security is at dod's edge; a kit binds 127.0.0.1 and carries no token.
const http = require("http");
const CONTRACT = "dod-kit/1";

function serve({ meta = {}, render, onAction = null, port, host = "127.0.0.1" }) {
  const fullMeta = {
    contract: CONTRACT, render: "spec", version: "1",
    accepts_actions: !!onAction, refresh_ms: meta.refresh_ms || 2000, ...meta,
  };
  const send = (res, code, obj, type = "application/json") => {
    const b = typeof obj === "string" ? obj : JSON.stringify(obj);
    res.writeHead(code, { "Content-Type": type, "Content-Length": Buffer.byteLength(b) });
    res.end(b);
  };
  const server = http.createServer(async (req, res) => {
    const p = req.url.split("?")[0];
    if (req.method === "GET" && p === "/")          // 200 shim → standalone + probe-friendly
      return send(res, 200, `<!doctype html><meta charset="utf-8"><title>${meta.name || "dashboard"}</title><body>dod-kit dashboard — rendered by dod.`, "text/html; charset=utf-8");
    if (req.method === "GET" && p === "/api/meta") return send(res, 200, fullMeta);
    if (req.method === "GET" && p === "/api/render") {
      let spec;
      try { spec = await render(); }
      catch (e) { spec = { title: meta.name || "dashboard", panels: [{ type: "log", title: "render error", text: String(e) }] }; }
      return send(res, 200, spec);
    }
    if (req.method === "POST" && p === "/api/action") {
      if (!onAction) return send(res, 405, { error: "this dashboard accepts no actions" });
      let body = "";
      req.on("data", (c) => { body += c; if (body.length > 5e6) req.destroy(); });
      req.on("end", async () => {
        let j = {};
        try { j = JSON.parse(body || "{}"); } catch (e) {}
        let r;
        try { r = await onAction(String(j.action || ""), j.payload || {}); }
        catch (e) { return send(res, 500, { ok: false, error: String(e) }); }
        send(res, 200, r && typeof r === "object" ? r : { ok: true });
      });
      return;
    }
    if (p === "/favicon.ico") return send(res, 204, "");
    send(res, 404, { error: "not found" });
  });
  server.listen(port, host, () =>
    console.log(`${meta.name || "dashboard"} → http://${host}:${port}  (dod-kit/1${onAction ? ", interactive" : ""})`));
  return server;
}

module.exports = { serve, CONTRACT };
