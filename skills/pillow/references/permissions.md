# Unattended permissions

Git level is user authorization for work, not a host permission mode. Pillow uses the current agent's tools; it cannot dismiss approval dialogs or enforce a no-prompt policy through instructions. Apply this gate before first dispatch, on every resume, and before another wave when the host or policy changes.

## Preflight on this machine

1. Inventory the required actions, exact command forms and paths by role in the contract and each ticket. Include coordinator read/write access to the run folder, worker Result writes outside source Ownership, snapshots/attempt archives, build outputs, and ticket worktrees. Include Git setup, integration and recovery, plus push/PR only at the approved level. Ownership and Git level do not grant filesystem or tool access.
2. Read effective host/provider/version, approval policy, sandbox/path restrictions and worker policy from supported runtime metadata or documented read-only controls. Save only sanitized evidence or references to rules, never credential/settings dumps. Check coordinator, maker and reviewer separately: a worker can override or restrict inherited permissions. Unknown worker policy remains unknown.
3. Require evidence that unapproved calls **return a denial without waiting for a person**, for every role. Also verify coverage for the planned actions/paths using effective rules and bounded baseline/worker checks while the user is present. A successful build/test proves only those invocations; `acceptEdits`, `auto`, L1-L3 and an allowlist alone do not prove that a later call cannot prompt. Do not deliberately run a destructive command to test denial, and do not perform a real push/PR as a probe.
4. Record `Permission preflight: ready | blocked | unknown`, current host/path scope, per-role policy/evidence, required action coverage and missing setup in `contract.md`. Only `ready` permits ticket dispatch. Bounded preflight subagent checks while the user is present are setup probes, not ticket makers; they must stay within approved paths and stop on a prompt or denial. `blocked` or `unknown` produces a `blocked_permission` handoff before any maker starts. If artifact writes are denied, report in chat what could not be saved; do not claim a handoff file exists.

Use the host's actual policy, not guessed flags. For Claude Code, user-configured `dontAsk` with narrowly approved tools/commands is one possible setup: calls needing approval are denied. Confirm the effective policies of the actual workers too. For Codex, inspect the effective approval policy and sandbox/access scope; a no-approval policy still needs action/path coverage. On a host that cannot expose or configure no-prompt rejection, unattended readiness is unknown: have the user set up a supported host before starting.

Pillow reports missing setup with the action/path, evidence and the documented user control for that host/version. The user configures it and Pillow rechecks. Pillow never edits permission settings/hooks, switches to bypass mode, expands its sandbox, or copies another machine's settings automatically. An already permissive host does not require additional permission changes; all contract boundaries still apply.

## Returned denial during the night

When a tool returns a host approval/sandbox denial, stop that role's work immediately. A test assertion failure is still a normal review FAIL; a command that could not run is an environment blocker. Do not guess that every process error or filesystem error is a host permission denial; record the actual evidence.

| Where denied | Required outcome |
| --- | --- |
| Maker acceptance or edits | Fill Result with `Block reason: blocked_permission`, sanitized command/action and host reason, partial changes and last completed step; stop. If Result cannot be written, return this evidence to the coordinator. |
| Reviewer verification or reads | Return `BLOCKED_PERMISSION` with the command/action and evidence; never PASS. Do not repair code or spend a fix round on the denial. |
| Coordinator setup/snapshot | Do not dispatch; retain existing files and record the missing capability. |
| Coordinator integration/combined verification | Stop dispatch and preserve the reviewed worktree, source/target SHAs and any in-flight Git operation. Record pending integration/verification for reconciliation on resume; do not blindly retry, undo, push or mark done. |

The coordinator sets the affected ticket to `parked` with `Block reason: blocked_permission`, records it in runlog and Waiting for you, and marks dependents blocked. Do not send a reviewer or a replacement maker to fix the permission denial, retry it through a different tool/shell wrapper, or change permissions. Permission blocks consume no code-fix rounds; parked tickets still count toward the existing circuit breaker.

For a pre-integration attempt, use the normal archive/snapshot recovery in workers.md. Continue independent tickets only after recovery is verified and their own permission/budget gates are ready. If archive, restore or recovery verification is denied, preserve the live files/index and existing snapshots, stop dispatch, and hand off with recovery pending and the precise artifacts that exist. Never claim successful recovery or restore a shared folder to HEAD. An integration block requires Git-state reconciliation before choosing recovery.

## Pending approval dialog

A pending prompt is not a returned denial: the worker may still be alive and has no result to record. If the host exposes that state, stop dispatch and record `blocked_permission`, the pending action and live worker identity. Use supported cancellation/interrupt only when available and confirm the worker stopped before recovery. If cancellation or observation is unavailable, retain uncertainty and hand off; do not approve the dialog, start a duplicate worker, or restore files a live worker could still write.

There is no skill-only timeout that can unblock a host approval dialog. Preflight prevents starting with unverified prompt behavior; it cannot guarantee that a later policy change will never block the host.

## Resume and other machines

Retain approved scope and Git level, but recheck permissions on the current host before dispatch or mutating reconciliation. A new machine/session/provider, changed policy/path scope, or an old contract without permission fields has no reusable readiness evidence: mark it `unknown` until checked. Do not migrate allowlists or widen access to match the previous host. Read-only reconciliation may proceed where allowed; once readiness is established, reconcile live workers, snapshot recovery and Git integration before retrying a blocked ticket. A permission handoff does not schedule quota wakes to retry the same denied action.

Resolve the permissions.md reference from the skill installation loaded on the current host. Refresh the coordinator-owned absolute reference, execution paths and permission evidence in each ticket before dispatch; preserve approved Ownership and Acceptance. Locate and verify actual snapshot/worktree artifacts before updating their references. A missing local skill reference or recovery artifact is a blocker, not a reason to reuse computer A's paths or invent replacement evidence.

## Common mistakes

| Observation | What it establishes |
| --- | --- |
| Build and test passed on computer A | Those commands ran there; not worker coverage or readiness on computer B |
| User approved L1 or said "do not ask" | Scope authorization; not a host policy change |
| Worker is quiet | No evidence of completion, denial or cancellation |
| Run folder is outside the repository | Its read/write access must be checked separately |

Host documentation: [Claude Code permissions](https://code.claude.com/docs/en/permissions), [Claude Code subagent permissions](https://code.claude.com/docs/en/sub-agents), [Codex sandboxing and approvals](https://learn.chatgpt.com/docs/sandboxing). Verify the installed host's controls before proposing setup commands.
