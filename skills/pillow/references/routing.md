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

Compute `remaining = 100 − used_percent` for every applicable window and take the **lowest**. Skip windows marked not applicable; a window the tool reports as `unknown` is skipped when the user supplied a figure and counts as below the floor otherwise; treat a reported limit as zero. Refresh with the tool, when one works, before every dispatch wave and after any reset you waited for. Between readings, use a conservative estimate for work since the last confirmed reading. Record its basis and uncertainty. Token counts alone cannot establish quota points.

If an estimate would tighten the gate or trigger handoff, refresh the affected window first. When the tool is unavailable and the user is present, ask once for the current reading and reset time, and hold the affected dispatch while waiting. If the user is away or no fresh reading is available, apply the conservative estimate within the existing cap and deadline.

**Per-run cap** is charged to one window named in the contract (weekly when available); the lowest remaining across all windows still controls dispatch. In runlog.md record window identity and reset boundary, last confirmed remaining and its source (tool or user), cumulative spend through that reading, and estimated spend since. The gate uses the sum of the two spend figures. Track each window separately.

For a fresh confirmed reading in the same reset period, add `max(0, previous confirmed remaining − current confirmed remaining)` to cumulative spend through the reading and clear the estimate for that interval. Applying a measured decrease of 2 points replaces a 15-point estimate for the same interval. An increase never refunds prior confirmed spend. At a confirmed reset carry spent forward and add `100 − first post-reset remaining` for the new period. Use a final pre-reset reading when available; otherwise carry the previous interval's conservative estimate forward and label it uncertain. Account-wide consumption by other sessions counts conservatively too.

On resume from a legacy ledger, reconstruct the last confirmed reading and cumulative spend at that point from the saved evidence. If either cannot be recovered, preserve its recorded spend as an uncertain carry-forward. Hand off if that spend and the current reading cannot be reconciled without charging the same interval twice.

For example, 70% → 45% spends 25 points; after reset the first reading is 92%, adding 8, for 33 spent. With cap 40, only 7 points remain in the run budget. The bedtime stop line (30% for 70 minus 40) applies only before that reset; recompute it from the new reading and unspent cap. Reaching the cap ends this run even if account quota later resets. If a reset or window identity cannot be reconciled, hand off instead of assuming fresh budget.

## Budget gate — before every dispatch

| Lowest remaining | Action |
|------------------|--------|
| ≥ 30% | dispatch sequentially at 30–40%; above 40% independent L1–L3 tickets may run in parallel; L0 stays sequential |
| ≥ 15% and < 30% | run no new maker; finish reviews/integrations, including the required whole-run review of accepted work if the remaining reserve, cap and time can cover it; otherwise hand off |
| < 15%, limit reached, or unknown | stop dispatching; go to handoff |
| per-run cap reached (default 40 points of the contract's cap window) | end the run; a quota reset does not replenish this cap |

Before each maker wave, budget the wave and in-flight work plus the remaining required reviews, integration and cleanup. Set aside the contract's whole-run review allowance first. Shrink the wave or finish pending reviews if the planned work would exhaust the cap, cross a phase's quota floor or miss the deadline. Recalculate at every dispatch. The 15-point reserve permits finishing reviews and integration within the cap and deadline; no correction maker starts below 30%, and no new worker starts below 15%.

A worker that dies mid-ticket loses what it spent; the gate is cheaper than the retry. Persist the ledger before handoff and load it on resume. For a quota wait, use the reset of the window actually blocking dispatch. Schedule a wake only if that reset is before the deadline and the run cap still permits work; otherwise write the final report with remaining tickets not started. Recheck every window after waking. A cap or deadline stop cannot auto-resume within this contract.
