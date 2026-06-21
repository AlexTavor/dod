# Derisk gate — dod v2 Wave 0 (the kit)

**Verdict: GREEN** (pending operator sign-off) · 2026-06-21
Architecture: projects are separate processes; the **kit** (`dod-kit/1`) is a protocol over
that boundary — `manifest` (find/run) + `render` (display, up) + `action` (interact, down).
dod supervises the process and proxies the protocol same-origin.

Walking skeleton (evidence, not product): [tests/test_kit_roundtrip.py](../../tests/test_kit_roundtrip.py)
exercises the riskiest seam with **two real processes** (a `dod-kit/1` counter +
[src/dod/kit.py](../../src/dod/kit.py), and a real dod server) — no mocking on the risk path.

## Ranked risks

| # | Risk (failure ⇒ re-architect) | Class | Status | Evidence / mitigation |
|---|---|---|---|---|
| R1 | Action round-trip closes: UI → dod `POST /api/action` proxy → project `on_action` → state mutates → next `render` reflects it | Integration+Semantic | **RETIRED** | skeleton: count 0 → `increment` → 1 → `add n=5` → 6, via the real proxy |
| R2 | The mutating action POST is loopback + token guarded (read-only render was already safe; a mutating channel is not) | Security | **RETIRED** | skeleton: action **without** token → 403, state untouched (reuses `_guard`) |
| R3 | Contract is sufficient as a *control surface*: `{action,payload}`+dict result; project owns meaning; unknown action = project no-op | Semantic | **RETIRED** | skeleton: payload carried (`add n`); unknown action → `{ok:false}`, **no** mutation |
| R4 | A dead/unknown project can't crash the proxy | Robustness | **RETIRED** | skeleton: ghost id → 404; `proxy_post` traps upstream errors → 502 |
| R6 | Additive over the proven engine (supervisor/registry/proxy), no re-architecture | Structural | **RETIRED** | `proxy_get`→added `proxy_post`; one new route; full suite 54 green, engine untouched |
| R5 | Contract is language-agnostic — a Node project (jobsearch, Wave 1) implements it identically | Integration | **RESIDUAL** | plain HTTP+JSON; **mitigation:** Wave 1 adds a JS kit and proves it. Low. |
| R7 | Spec stays semantic so text/sound rendering is *possible* later | Semantic | **ACCEPTED (out of scope)** | spec = dashkit atoms (already semantic); not built in v1; no architectural debt |

## Decisions carried forward (Constitution deltas)

- **Security is enforced at dod's edge, not in each project.** dod's `/api/action` is loopback+token
  guarded; dod→child is trusted loopback. Kit projects bind 127.0.0.1 and carry **no** token.
- **Kit owns transport; project owns meaning.** The kit routes `{action,payload}`→`on_action`; an
  unknown action is the project's call to no-op. dod never interprets an action.
- **Status model:** `live | stopped`, plus a **last-stop reason** (clean | crash+exit code). No "planned".
- **R5 (Node kit) is the gate to re-run at Wave 1** before building jobsearch against the contract.

## Skip notes

No performance or concurrency risk taken on in Wave 0 (threaded server + supervised processes are
the already-proven model). Re-run this gate at Wave 1 (Node kit) and Wave 2 (PDD control surfaces).
