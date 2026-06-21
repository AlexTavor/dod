# Derisk gate — dod v2 Wave 0 (the kit)

**Verdict: GREEN** (pending operator sign-off) · 2026-06-21
Reached GREEN only after an adversarial scrutiny pass (5 lenses) returned **RED twice** and
caught two real blockers the first skeleton hid — both now fixed and re-proven.

Architecture: projects are separate processes; the **kit** (`dod-kit/1`) is a protocol over
that boundary — `render` (display, up) + `action` (interact, down) — discovered via a
per-project manifest *file*. dod supervises the process and proxies the protocol same-origin.

Walking skeleton (evidence, not product): [tests/test_kit_roundtrip.py](../../tests/test_kit_roundtrip.py)
exercises the seam with **real processes**, through the **real discriminator path**
(`fetch_meta` → `supervisor.state` → `render:'spec'`), not a raw id+port bypass.

## What the scrutiny caught (and the fix)

| Blocker (RED) | Fix |
|---|---|
| Kit advertised `dod-kit/1` but the engine gated on `dashkit/1` → a real kit dashboard was invisible to discovery | `config.CONTRACTS = {dod-kit/1, dashkit/1}`; `fetch_meta`/announce gate on membership |
| Kit never emitted `render:'spec'` + served `404` on `/` → rendered as a raw-JSON iframe, `/`-probe failed | kit `/api/meta` now sets `render:'spec'`; kit serves a `/` shim + `/dashkit.js` (standalone + probe-friendly) |
| Green-by-omission: 405 / throw / wrong-token / cross-origin / dead-502 asserted by prose, not tests | all added to the skeleton |

## Ranked risks (post-fix)

| # | Risk | Status | Evidence / mitigation |
|---|---|---|---|
| R1 | Action round-trip closes through the **real** render path | **RETIRED** | `test_discriminator_resolves_kit_to_spec` (render→spec via real `fetch_meta`) + round-trip 0→1→6 |
| R2 | Mutating action POST is fully guarded | **RETIRED** | no-token / wrong-token / foreign-Origin all → 403, state untouched |
| R4 | A dead/misbehaving child can't crash the proxy | **RETIRED** | dead→502, throwing handler→500 (child survives), ghost→404; sampler structurally isolated |
| R6 | Additive over the proven engine | **RETIRED** | `proxy_post` sibling of `proxy_get`; one route; discriminator reconciled; 59 tests green |
| R3 | Contract is sufficient as a full **control surface** | **RESIDUAL** | transport+no-op+405+throw proven; completeness (below) is named Wave-1/2 decisions |
| R5 | Contract is language-agnostic (Node kit, Wave 1) | **RESIDUAL** | plain HTTP+JSON; **re-run this gate at Wave 1** before building jobsearch |
| R7 | Spec stays semantic (text/sound later) | **ACCEPTED (out of scope)** | dashkit atoms; not built in v1 |

## Residual Constitution decisions (settle before the code that needs them)

1. **Action concurrency** — `on_action` runs on per-request threads with no lock (the reference
   counter lost 37/50 concurrent updates). Decide: kit serializes actions, or the contract
   requires `on_action` to be thread-safe. (Wave 1, before real control actions.)
2. **Result shape + size** — `proxy_post`/`proxy_get` silently truncate >2 MB to corrupt JSON
   served as `200`. Decide ack-vs-poll-after-ack, a size budget, and **fail loudly** on overflow
   (413/502, never silent). (Wave 1.)
3. **Long-running actions** — a >4 s action returns `502` while the child keeps running. Decide a
   `202 + job-handle` / async convention before PDD builds "kick a run" actions. (Wave 2.)
4. **Admission control / overload** — explicitly *deferred*, not retired (HOL is retired by the
   threading model; overload is not). (Wave 1+.)

## Deferred — explicitly, not silently

- **Runtime dashboard spawn** ("a project spawns a dashboard in dod"): Wave 0/1 use **static
  per-project manifests** (the locked catalog decision), which need no runtime spawn. The
  spawn/register mechanism is a **Wave 2 (PDD) gate** — re-run derisk there. Recorded, not skipped.
- **Manifest is a discovered file, not a wire endpoint** — `dod.project.json` read by the
  generalized provider; resolves the scrutiny's "manifest-over-wire" concern (it was a misread of
  the design).

## Carve decision carried into Wave 0

- **Status model:** implement `live | stopped` + `last_stop_reason` (clean | crash+code). Today
  crash is durable but a clean stop leaves no trace, and `crashed` is its own state. Wave-0 unit:
  capture clean-stop reason; project `crashed` as `stopped`+reason for the top-level model while
  keeping running sub-states (`starting/healthy/unhealthy`).
