# Usage-based worker routing

Use this guide before every wave of new workers. Remaining quota means the available percentage of a provider's applicable subscription usage windows, **not** remaining context-window tokens. Quota percentages are a routing signal, not a prediction of the exact tokens a Task will consume.

## Get trustworthy numbers

1. Check the selected Orca executable's help. When it supports `account list --json`, use that as the primary source for local workers. Its `result` contains active Claude/Codex account information and `rateLimits`; inspect only the relevant providers. Older Orca versions may omit `rateLimits`. For a worker on another Orca host, obtain usage from that execution host rather than reusing the local account snapshot.
2. From each provider's `rateLimits`, require `status: "ok"` and an `updatedAt` no older than 15 minutes. Read `session.usedPercent` and `weekly.usedPercent` when those windows are present. A null session window with a valid weekly window is not a zero quota; no usable window at all is unknown. Include model-specific windows only when the chosen model uses them. Compute `remaining = 100 - usedPercent` and take the **lowest** remaining percentage across applicable windows. If Orca reports a limit reached, capacity is zero. Missing, stale, failed, or unknown applicable windows make that provider unknown. Do not count paid credits as free quota or spend them without user authorization.
3. Confirm that the quota snapshot corresponds to the active account and runtime where Orca will launch the worker. An active managed account or Orca's `systemDefault` auth can establish this for local workers. If the account may differ, mark that provider **unknown**. Never read, print, or copy credential files to obtain usage.
4. If Orca lacks usable quota data, use another documented, account-matched usage tool exposed to the coordinator. Discover its schema; accept `used_percent` or an explicitly documented `remaining_percent`, ignore windows explicitly marked `not_applicable`, and apply the same lowest-applicable-window rule.
5. Refresh immediately before a new worker wave and after a reported reset or suspected quota exhaustion. Record only the source, observation time, per-provider remaining percentage, and chosen route in the Run log. The raw Orca response may contain account identifiers or email addresses; do not copy it into logs or Task specs.

If no trustworthy source covers either provider, ask the user for current Claude and Codex usage percentages or wait for a source. Do not silently route by guessed quota. If one provider is known and eligible while the other is unknown, use the known provider when the Task fits; disclose the missing comparison. If the user gives numbers, label them user-supplied and refresh before later waves when possible.

## Choose a provider for each Task

1. Exclude unavailable agents, providers with `limit_reached`, and providers with less than **15%** remaining. Keep any user-specified provider restriction; if its capacity is insufficient, pause that Task and explain why rather than silently changing providers.
2. Reserve **15 percentage points** for the coordinator on its own provider. For a Claude coordinator, Claude is eligible as a worker only at **30% or more** remaining; its worker headroom is `Claude remaining - 15`. Codex headroom is its remaining percentage. Reverse this reserve when Codex is the coordinator.
3. Among eligible providers that can do the Task, choose the one with greater worker headroom. If the difference is under **10 percentage points**, use task fit as the tie-breaker: prefer Codex for bounded code edits and Claude for synthesis or open-ended analysis, unless the user's preference says otherwise. If still tied, choose the provider with fewer active workers.
4. At **15–40%** remaining, start at most one worker at a time on that provider. Above **40%**, parallelize only when Task ownership and the user's worker limit permit it. Recalculate before dispatching dependent or correction Tasks.
5. Keep model and effort separate from provider routing. Pass `--model` only if the user specified a supported model; otherwise inherit the selected agent's configured default. Pass `--effort` only with a supported explicit model. Check Orca's `launch.effective` receipt before reporting what actually ran.

If both providers are ineligible, pause new Dispatches and report the known reset times. Continue supervising already running workers. A quota result alone never authorizes stopping, abandoning, releasing, or retrying an active worker; follow Orca's liveness and recovery guide for those actions.

## Example

With Claude coordinating, Claude at 35% and Codex at 50% gives worker headroom of 20% and 50%. Route the next suitable Task to Codex. If Claude is at 70% and Codex at 45%, the headroom is 55% and 45%; the 10-point difference routes to Claude. Record the numbers and the decision so the user can review it.
