<p align="center">
  <img src="assets/robusta-logo-v2.png" alt="Robusta logo" width="160">
</p>

# Robusta

Robusta is an installable plugin that bundles Drip, Pillow, and OCR Field Presentation for Claude Code and Codex. Coordinate engineering work or create interactive presentations that map document images to OCR JSON fields. The skills run within your agent session and use its available tools and permissions.

| Skill | Purpose | Requirements |
| --- | --- | --- |
| [Drip](#drip-requirements) | Coordinate supervised work across Claude and Codex workers, selecting a provider based on available quota | Orca Desktop, its CLI, and at least one supported agent CLI |
| [Pillow](#pillow-requirements) | Execute an approved work queue while you are away, with separate implementation and review steps | Claude Code or Codex with subagent and shell support |
| [OCR Field Presentation](#ocr-field-presentation) | Map receipt or document images to OCR JSON fields in one interactive offline HTML file | Claude Code or Codex with image and shell tools; Node.js |

## Install

Install `robusta` once to get all three skills. The commands below use the marketplace published from this repository.

### Claude Code

Run inside Claude Code:

```text
/plugin marketplace add encryptedarc/robusta
/plugin install robusta@robusta
```

Or run from a terminal:

```sh
claude plugin marketplace add encryptedarc/robusta
claude plugin install robusta@robusta
```

### Codex

Run from a terminal with a Codex CLI that provides `codex plugin`:

```sh
codex plugin marketplace add encryptedarc/robusta
codex plugin add robusta@robusta
```

In Codex Desktop, the registered marketplace is also available in the plugin browser. Start a new session after installation; restart the desktop app if the marketplace is not shown.

### Invoke the skills

| Agent | Drip | Pillow | Resume Pillow | OCR Field Presentation |
| --- | --- | --- | --- | --- |
| Claude Code | `/robusta:drip <task>` | `/robusta:pillow <task>` | `/robusta:pillow resume <run-folder>` | `/robusta:ocr-field-presentation <image/JSON pairs>` |
| Codex | `$drip <task>` | `$pillow <task>` | `$pillow resume <run-folder>` | `$ocr-field-presentation <image/JSON pairs>` |

If you previously copied these skills into your agent's skills directory, remove the old copies after verifying the plugin installation to avoid loading duplicate skills. For plugin installations, use the invocation above wherever a skill's instructions show the standalone `/pillow` shorthand.

### Update an existing Claude Code installation

```sh
claude plugin marketplace update robusta
claude plugin update robusta@robusta
```

Restart Claude Code after updating to load the new skills.

### Test from a local checkout

From the repository root, use a local marketplace instead of GitHub:

```sh
claude plugin validate .
claude plugin marketplace add .
claude plugin install robusta@robusta
```

```sh
codex plugin marketplace add .
codex plugin add robusta@robusta
```

Use either the local or GitHub source for the `robusta` marketplace in each agent. Local installation is useful for testing changes before pushing them.

The [Claude Code marketplace guide](https://code.claude.com/docs/en/plugin-marketplaces) and [OpenAI plugin packaging guide](https://developers.openai.com/plugins/build/plugins) describe the supported layouts. Both manifests load the same `skills/` directory, including each skill's reference files.

## Drip requirements

You need Orca Desktop with orchestration enabled, its CLI available, and at least one Claude Code or Codex CLI that Orca can launch.

Drip reads the installed Orca CLI's coordination guide at the start of each run. With the standard `orca` executable, you can inspect that guide using `orca skills get orchestration`. For quota data, Drip uses `orca account list --json` when the installed CLI supports it; otherwise it needs another trustworthy source or figures you provide.

## How Drip works

```mermaid
flowchart LR
    U[User request] --> C[Drip coordinator]
    C --> S[Define tasks and acceptance criteria]
    S --> Q[Check active-account quota]
    Q --> R[Select and dispatch workers through Orca]
    R --> W[Workers execute]
    W --> M[Receive status, questions, and results]
    M --> V[Coordinator reviews evidence]
    V --> I[Integrate accepted work]
    I --> O[Report outcomes]
    M -->|question or escalation| C
    V -->|needs correction| R
```

1. **Define the work.** Read the request and repository rules, then create tasks with file ownership, dependencies, and verifiable acceptance criteria.
2. **Select workers.** Check quota for the active accounts, reserve capacity for the coordinator, and choose Claude or Codex within your provider and model preferences.
3. **Dispatch and supervise.** Start independent tasks concurrently through Orca. Track completion, handle worker questions, and ask you to resolve decisions outside the approved scope.
4. **Review results.** Check the actual files and outputs against each task's acceptance criteria, and return incomplete work to its owner.
5. **Integrate and report.** Apply accepted changes under the repository's Git and approval rules, complete worker cleanup, and report verified results and unresolved blockers.

Example request:

```text
/robusta:drip Add CSV export to the orders page. Split independent work across available workers, verify the results, and report blockers before integration.
```

For detailed instructions, see the [Drip skill](skills/drip/SKILL.md) and [quota routing policy](skills/drip/references/usage-routing.md).

## Pillow requirements

You need Claude Code or Codex with permission to create subagents and run shell commands. Pillow uses subagents from the same provider as the coordinating session. Git is required for commits, pushes, and pull requests; a plain folder is supported at level `L0`.

GitHub issue access and draft pull requests require an authenticated `gh` CLI. Azure DevOps work items and draft pull requests require an authenticated `az` CLI with the relevant commands available.

Optional model configuration belongs in `~/.pillow/models.md`, which maps the `fast` and `strong` tiers to model IDs and effort settings. Without that file, Pillow uses the agent's configured defaults. Model choices are confirmed as part of run approval; see the [model and budget policy](skills/pillow/references/routing.md).

## How Pillow works

```mermaid
flowchart LR
    U[User request] --> I[Read requirements and repository rules]
    I --> P[Define tickets with you]
    P --> C[Approve scope, Git permissions, deadline, and budget]
    C --> G[Check quota and run limits]
    G --> M[Implementation subagent]
    M --> R[Reviewer subagent]
    R --> X[Integrate, verify, run log]
    X -->|tickets remain| G
    X -->|queue complete| O[Completion report]
    R -->|fix required, at most 2 rounds| M
    R -->|decision required or fixes exhausted| K[Save attempt and defer ticket]
    G -->|insufficient quota| H[Save handoff]
    H -->|eligible resume| G
    G -->|deadline or budget cap reached| O
```

An [interactive workflow diagram](assets/pillow-workflow.html) is also available.

1. **Read requirements.** Accept a prompt, file, issue, or work item, and read the repository rules that apply to the work.
2. **Define tickets.** Clarify scope with you and divide the request into small, independently verifiable changes. Each ticket specifies the behavior to implement, permitted files, constraints, dependencies, and acceptance criteria.
3. **Approve the run.** Record the tickets, Git permissions, deadline, usage budget, model choices, and decisions that require your input. Run baseline verification and check tool access before you leave. The host must remain awake and online for unattended execution.
4. **Implement and review.** Assign each ticket to an implementation subagent, then a separate reviewer that runs verification itself. Recheck the combined result before marking a ticket complete or pushing changes.
5. **Handle failures.** Allow at most two correction rounds with new implementation and review subagents. Defer unresolved decisions or repeated failures, save a recoverable attempt, and restore the pre-ticket state while preserving earlier accepted work.
6. **Save progress and report.** Record completed work, decisions awaiting your input, failures, and tickets not started. On resume, reconcile saved state with the actual files and commit history before continuing.

### Git permissions

Choose a level for each new run:

| Level | Authorized actions |
| --- | --- |
| `L0` | Leave reviewed changes in the working folder without commits; execute tickets sequentially |
| `L1` | Create local commits for reviewed tickets |
| `L2` | `L1` plus push the approved branch |
| `L3` | `L2` plus open a draft pull request |

Pillow does not merge pull requests, force-push, or change issue and work-item states. Run approval records the scope and permissions that apply while you are away.

### Quota and resume

Pillow checks quota before starting work and tracks a per-run usage cap against an agreed quota window. Quota resets do not replenish that cap. When a usage tool is available, Pillow refreshes its readings; otherwise it starts from figures you provide and estimates subsequent consumption.

Automatic continuation after a quota reset requires a scheduling capability in the host environment, a reset before the approved deadline, and remaining run budget. If automatic continuation is unavailable, Pillow saves a handoff; eligible runs can be resumed manually using the commands above. Reaching the deadline or usage cap ends the run.

The [routing policy](skills/pillow/references/routing.md) defines quota thresholds and reset accounting. The [run log reference](skills/pillow/references/runlog.md) describes handoff and report files.

Example request:

```text
/robusta:pillow Add slugify(text) and a CLI command that uses it, with tests for both. Use L1 with no push. Stop by 08:00 tomorrow and defer any change to existing CLI output for my review.
```

Pillow will confirm the remaining run details before starting. For the full procedure, see the [Pillow skill](skills/pillow/SKILL.md).

## OCR Field Presentation

Attach a receipt image and its OCR JSON, then ask for a presentation:

```text
/robusta:ocr-field-presentation Create one interactive HTML presentation from all attached image/JSON pairs. Clicking a highlighted region should focus it and show the JSON path and value.
```

In Codex, use `$ocr-field-presentation` with the same request. For a batch, pair filenames such as `receipt-01.png` / `receipt-01.json` and `receipt-02.png` / `receipt-02.json`, then attach all pairs in one request. JSON pasted into the chat is also supported when you label which image it belongs to.

The generated HTML embeds the images and supplied JSON, so it can be shared as one file and viewed offline. Click a box to spotlight it, show its JSON field and value, and emphasize the matching field row. The selection stays pinned until you choose another field; press Escape to remove the spotlight. Multiple documents have a document picker and previous/next controls. Hover, keyboard selection, and mobile layouts are supported.

The skill preserves the supplied OCR JSON. It distinguishes direct text evidence, transformed values, and inferred values; null or unlocated fields stay visible without invented boxes. When the OCR result has no bounding boxes, the agent places approximate visual annotations and labels them accordingly.

Node.js is required to generate the HTML; there are no npm dependencies. The person opening the completed file only needs a browser. See the [skill instructions](skills/ocr-field-presentation/SKILL.md) and [manifest contract](skills/ocr-field-presentation/references/manifest.md).

To verify the bundled generator from a checkout:

```sh
node --test skills/ocr-field-presentation/scripts/build.test.mjs
```

## Acknowledgements

Pillow's requirements interview and ticket-planning workflow were inspired by Matt Pocock's [grill-me](https://github.com/mattpocock/skills/tree/main/skills/productivity/grill-me) and [to-tickets](https://github.com/mattpocock/skills/tree/main/skills/engineering/to-tickets) skills.
