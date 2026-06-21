// A minimal Node dod-kit/1 dashboard — the R5 walking skeleton (Node kit ≡ Python kit).
const { serve } = require("./dod-kit");
let count = 0;
serve({
  meta: { name: "Node Counter", blurb: "Node kit demo (pure logic + actions)" },
  port: parseInt(process.argv[2] || "8097", 10),
  render: () => ({
    title: "Node Counter",
    panels: [
      { type: "stat", label: "count", value: count },
      { type: "actions", title: "controls", buttons: [
        { label: "+1", action: "increment" },
        { label: "+10", action: "add", payload: { n: 10 } }] },
    ],
  }),
  onAction: (a, p) => {
    if (a === "increment") count += 1;
    else if (a === "add") count += (p.n | 0);
    else return { ok: false, error: "unknown action" };
    return { ok: true, count };
  },
});
