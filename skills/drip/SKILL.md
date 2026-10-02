---
name: drip
description: Coordinate supervised Claude or Codex workers through Orca orchestration, routing each Task by the active accounts' remaining quota while a coordinator waits for and reviews results. Use when the user asks to delegate, parallelize, or monitor work; use an Orca handoff when another agent should take full ownership without supervision.
---

# Drip

Drip is the Robusta skill for supervised work through Orca. The coordinator owns task boundaries, worker selection, review, integration, and the final report. Orca owns Run, Task, Dispatch, message, and worker lifecycle state.

## Before dispatch

1. Read the user's request, repository instructions, and relevant files. Confirm the task is real and identify any existing changes that must be preserved.
2. Resolve the Orca executable using `ORCA_CLI_COMMAND` when set; otherwise use `orca-dev` in an Orca development session, `orca-ide` on Linux outside Orca-managed terminals, or `orca` elsewhere. Use the same executable throughout this run. If it fails, report the exact error and stop.
3. Run `<orca> skills get orchestration` and follow the version-matched guide. Do not invent commands or flags from this skill. Check `<orca> status --json`; if the app is stopped, use the guide's startup path.
4. Decide whether supervised delegation fits. If the user requested a full handoff without monitoring, use Orca's handoff workflow. If the user explicitly invoked Drip, retain coordinator ownership even for one worker.
5. Check which Claude and Codex workers Orca can launch. Before each worker wave, read [references/usage-routing.md](references/usage-routing.md) and use `<orca> account list --json` when the installed CLI advertises it. Its active accounts and `rateLimits` are the primary quota source for workers on that Orca host. Select the worker provider per Task using its remaining quota and the coordinator reserve. Do not infer quota from model context size, token accounting files, or a worker's silence. Honor the user's provider, model, effort, and worker-count constraints within the verified capacity. Unless the user chose a model, inherit that agent's configured model and effort.

## Coordinate the work

1. Split the request into the smallest useful Tasks. Each Task spec must give **Target**, **Change**, **Constraints**, **Ownership**, and **Observable acceptance**. Make file ownership explicit, especially for concurrent edits. Create dependencies only when one Task truly needs another's result.
2. Create one Run for the user's objective. Record the Run ID, Task IDs, Dispatch IDs, worker placement, and pending decisions somewhere recoverable in the current project. Keep that record current as results arrive without requiring a particular note app or log path.
3. Route each ready Task using the fresh usage decision, record the provider and reason, then start the independent wave before waiting. Use the current workspace unless the user requested a worktree or concurrent edits would conflict. Read Orca's placement reference before creating a worktree. Do not require Git for folder workspaces.
4. Wait for `worker_done`, `escalation`, and `question` through Orca's consuming `check` loop. Process every delivered message before acknowledging it. Answer worker questions within the user's authority; bring material product or scope decisions to the user.
5. Treat timeouts, idle terminals, missing output, and `unverifiable` liveness as checkpoints, not completion or failure. Refresh usage before starting more workers; exhausted quota blocks new Dispatches but does not prove an active worker has exited. Inspect the Dispatch and follow Orca's recovery reference before stopping, abandoning, or retrying. Never launch a duplicate attempt merely because a worker is quiet.
6. For each accepted `worker_done`, inspect the actual files, diff, or output against the Task's acceptance criteria and repository rules. Do not rely on the worker's summary alone. Route fixes to the owner of that work; the coordinator should edit only when the user assigned that responsibility.
7. After settlement, decide whether to reuse, explicitly retain, or release each worker terminal before acknowledging the Delivery. Integrate accepted results into the requested target using the project's Git and approval rules. Do not commit, push, publish, or open a PR solely because Drip was invoked.
8. Finish only after every expected Dispatch has an outcome and Orca reports no worker terminal awaiting a cleanup decision. Report each Task's outcome, evidence, integrated result, and unresolved blocker.

## Task-spec example

```text
Target: <component and relevant files>
Change: <specific result to produce>
Constraints: <repository rules and behavior to preserve>
Ownership: <files this worker may edit; coordination boundary>
Observable acceptance: <evidence that proves completion>
```

## Boundaries

- A Run is coordination state; a Dispatch is the authoritative attempt. Address a started worker by Dispatch ID, never by a guessed terminal or copied identifier.
- Use the live injected preamble for worker-side lifecycle commands. Do not fabricate `worker_done` for a worker or substitute another agent system for Orca when Orca supervision was requested.
- An accepted `worker_done` settles its Task automatically. A successful send only proves enqueue, not that the recipient read it.
- Follow the user's and repository's permissions, secrets policy, and validation requirements. Do not pass secrets into Task specs or logs.
