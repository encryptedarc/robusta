# Routing and budget

Pillow routes within a single provider — whichever AI the main session is. Routing therefore means choosing a model tier per ticket and deciding whether there is enough quota to start it at all.

## Tiers

| Tier | Used for | Why |
|------|----------|-----|
| fast | mechanical and bounded tickets: clear spec, one slice, rename, port, tests from a fixed spec | cheapest model that reliably follows a spec; the ticket already did the thinking |
| strong | cross-cutting tickets, investigation, design, conflict resolution, and **every reviewer** | a checker weaker than the maker rubber-stamps |
| coordinator | the main session | whatever the user opened; Pillow never changes it |

Concrete model ids and effort settings vary by machine and month, so they live outside the skill. At contract time look for a per-machine file (`~/.pillow/models.md`, or `pillow-models.md` beside the run root) that maps `fast` and `strong` to a model id and effort. If none exists, use the agent's configured default for both tiers and write that into the contract so the user sees it.

Frontier-class models — the largest reasoning tier a provider offers — run only when the user names them in the contract. They consume quota far out of proportion to most tickets, and at night nobody is watching the meter.

When a ticket runs on a tier other than the table's default, write `Routing: <tier → id/effort> — reason` into the ticket and the run log. That line is how the next contract's model choices get better.

## Usage

Numbers the user states in the request or the contract are the usage source for that run. Record them as user-supplied with their reset time and use them as-is; do not reopen the question because a tool disagrees or cannot answer. A tool that works is for refreshing the figure during the night, not for overruling the person who just read their own dashboard.

When the user gave nothing, use a documented usage tool exposed to the agent if one exists (for example an MCP usage tool returning `used_percent` per window with `reset_at` and `status`). If there is no tool either, ask at contract time. Never infer quota from context size, token counts in files, or a worker's silence, and never read credential files to find it.

Compute `remaining = 100 − used_percent` for every applicable window and take the **lowest**. Skip windows marked not applicable; a window the tool reports as `unknown` is skipped when the user supplied a figure and counts as below the floor otherwise; treat a reported limit as zero. Between readings, estimate consumption from the last known figure and the work since: a ticket's maker and reviewer typically cost a few points each, so a night that started at 70% and has merged three tickets is not still at 70%. Refresh with the tool, when one works, before every dispatch wave and after any reset you waited for.

**Per-run cap** is charged to one window named in the contract (weekly when available); the lowest remaining across all windows still controls dispatch. Keep a ledger in runlog.md: window identity and reset boundary, last remaining, reading source (measured or estimated), and cumulative spent. Do not subtract minima from different windows.

Within the same reset period add `max(0, previous remaining − current remaining)` to cumulative spent. At a confirmed reset carry spent forward and add `100 − first post-reset remaining` for the new period. Record a final pre-reset reading when available; if consumption before reset was not observed, retain its conservative estimate and mark that interval uncertain. An increase within the same period never refunds spent points. Account-wide consumption by other sessions counts conservatively too.

For example, 70% → 45% spends 25 points; after reset the first reading is 92%, adding 8, for 33 spent. With cap 40, only 7 points remain in the run budget. The bedtime stop line (30% for 70 minus 40) applies only before that reset; recompute it from the new reading and unspent cap. Reaching the cap ends this run even if account quota later resets. If a reset or window identity cannot be reconciled, hand off instead of assuming fresh budget.

## Budget gate — before every dispatch

| Lowest remaining | Action |
|------------------|--------|
| ≥ 30% | dispatch sequentially at 30–40%; above 40% independent L1–L3 tickets may run in parallel; L0 stays sequential |
| ≥ 15% and < 30% | run no new maker; finish reviews/integrations, including the required whole-run review of accepted work if the remaining reserve, cap and time can cover it; otherwise hand off |
| < 15%, limit reached, or unknown | stop dispatching; go to handoff |
| per-run cap reached (default 40 points of the contract's cap window) | end the run; a quota reset does not replenish this cap |

The 15-point reserve exists because the coordinator still has to finish ticket and whole-run reviews, integrate and write the report after the last maker finishes. Budget the final reviewer before spending the last maker allowance. The reserve permits no new correction maker below 30%, and never extends the cap/deadline or overrides the below-15% stop. A night that spends everything on makers ends with work nobody can account for.

A worker that dies mid-ticket loses what it spent; the gate is cheaper than the retry. Persist the ledger before handoff and load it on resume. For a quota wait, use the reset of the window actually blocking dispatch. Schedule a wake only if that reset is before the deadline and the run cap still permits work; otherwise write the final report with remaining tickets not started. Recheck every window after waking. A cap or deadline stop cannot auto-resume within this contract.
