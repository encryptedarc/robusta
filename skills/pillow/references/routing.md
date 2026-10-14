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

**Per-run cap** means points spent in this run: `remaining at contract time − remaining now`, summed across any reset you waited through. A cap of 40% with 70% remaining at bedtime closes the gate at 30% remaining. Write the resulting stop line into the contract so nobody has to interpret it at night.

## Budget gate — before every dispatch

| Lowest remaining | Action |
|------------------|--------|
| ≥ 30% | dispatch; above 40% independent tickets may run in parallel |
| 15–30% | the coordinator reserve: run no new maker; finish reviews and merges already in flight |
| < 15%, limit reached, or unknown | stop dispatching; go to handoff |
| per-run cap reached (default 40 points of the weekly window spent this run) | stop dispatching; go to handoff |

The 15-point reserve exists because the coordinator still has to review, merge and write the report after the last maker finishes. A night that spends everything on makers ends with work nobody can account for.

A worker that dies mid-ticket loses what it spent; the gate is cheaper than the retry. When the gate closes, write the handoff with the earliest `reset_at`, then wait for it if the agent can, or stop and say so.
