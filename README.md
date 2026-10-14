<p align="center">
  <img src="assets/robusta-logo-v2.png" alt="Robusta logo" width="160">
</p>

# Robusta

Robusta is a collection of agent skills. **Drip** is the first skill: a coordinator for supervised worker agents using [Orca orchestration](https://www.onorca.dev/docs/cli/orchestration).

## Install Drip

Prerequisites: Orca Desktop with its CLI available, orchestration enabled, and at least one agent CLI that Orca can launch. Current Orca builds can expose active-account usage through `orca account list --json`; older builds need another trustworthy usage source. Use `orca skills get orchestration` for your installed Orca's coordination guide.

Copy `skills/drip` into your agent's skill directory:

| Agent | Destination | Invocation |
| --- | --- | --- |
| Claude Code | `~/.claude/skills/drip/` | `/drip <task>` |
| Codex | `~/.codex/skills/drip/` | `$drip <task>` |

The destination must contain `SKILL.md` directly. Orca does not install Drip into the agent for you. Start a new agent session after copying if the skill does not appear immediately.

## How Drip works

```mermaid
flowchart LR
    U[User task] --> C[Drip coordinator]
    C --> S[Read context and split Tasks]
    S --> Q[Read Claude and Codex usage]
    Q --> R[Choose worker and create Orca Dispatches]
    R --> W[Workers execute]
    W --> M[Orca messages and worker_done]
    M --> V[Coordinator reviews evidence]
    V --> I[Integrate accepted work]
    I --> O[Report outcomes]
    M -->|question or escalation| C
    V -->|needs correction| R
```

1. **Scope:** Drip reads the request and repository rules, then writes self-contained Task specs with clear file ownership and observable acceptance.
2. **Route:** It reads account-matched usage, computes the lowest remaining percentage across applicable quota windows, reserves capacity for its coordinator, and chooses Claude or Codex for each Task. Unknown usage is never guessed.
3. **Dispatch:** It creates an Orca Run and starts the ready workers. Independent Tasks can run together; dependent Tasks wait for their prerequisites.
4. **Supervise:** It receives questions, escalations, and completion messages through Orca. A quiet terminal is not treated as a completed worker.
5. **Review:** It checks the real output against each Task spec and asks the owner to correct any gap.
6. **Integrate:** It applies accepted work under the repository's Git rules, settles worker terminals, and reports evidence and blockers.

Example request:

```text
/drip Split this feature into independent tasks, assign workers, review their results, and report blockers before integration.
```

Drip has no fixed model IDs, external quota-service dependency, or programming-language requirement. It reads the active account's Orca rate limits first; if no trustworthy usage source is available, it asks for the current numbers. It reads Orca's version-matched guide at the start of each run because the CLI may change.

## Pillow

**Pillow** runs a queue of engineering work while you sleep. It plans with you, then works alone through subagents of the same AI — no Orca and no second provider required. Install it the same way as Drip, copying `skills/pillow` to `~/.claude/skills/pillow/` or `~/.codex/skills/pillow/`.

An interactive version of the workflow lives at [assets/pillow-workflow.html](assets/pillow-workflow.html).

```mermaid
flowchart LR
    I[Intake: prompt, file, issue, WI] --> P[Plan with you: grill, tickets]
    P --> C[Contract: git level, deadline, budget]
    C --> G[Budget gate]
    G --> M[Maker subagent in a worktree]
    M --> R[Reviewer subagent, fresh context]
    R -->|pass| X[Merge, commit, run log]
    R -->|fail, max 2 rounds| M
    R -->|repeated finding| K[Park for a human]
    X --> G
    G -->|quota or deadline| H[Handoff, wait for reset]
    H -->|resume| G
    X -->|queue done| O[Morning report]
```

1. **Plan and contract:** Pillow interviews you until every ticket is unambiguous, slices the work into tracer-bullet tickets with blocking edges, and asks the Git question every run: `L0` no commits, `L1` one local commit per reviewed ticket, `L2` push, `L3` draft PR. The tracker (GitHub or Azure DevOps) is detected from the Git remote. You approve the contract before leaving.
2. **Night loop:** The main session stays a thin coordinator. Each ticket goes to a maker subagent, then to a fresh reviewer subagent that runs the build and tests itself. A failed review gets a brand-new maker, at most twice; a finding that repeats parks the ticket for you instead of looping. A budget gate before every dispatch keeps a 15-point reserve for the coordinator and waits out quota resets through a handoff file.
3. **Morning:** A one-screen report lists what was verified done, the questions waiting for you, failures with their patches, and the first thing to do. `/pillow resume <run-folder>` continues an interrupted run.

Example request:

```text
/pillow Port these four jobs, one commit each. I'm back at 8am.
```
