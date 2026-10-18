# Tickets

A ticket is the single artifact a worker receives. It must stand alone: a fresh subagent with no conversation history reads it and knows exactly what to build, where it may write, what rules apply, and what proves it is done. Anything you would otherwise put in a prompt belongs in the ticket.

## Slicing rules

- Each ticket is a **tracer bullet**: a narrow but complete path through every layer the change touches, demoable or verifiable on its own. Not one layer of many things.
- Each ticket fits one fresh context window. If you cannot describe it in a screen, split it.
- Declare **Blocked by**: only tickets whose result this one genuinely needs. A ticket with no blockers can start immediately, and independent tickets may run in parallel.
- **Ownership must be disjoint** between tickets that can run at the same time. Two makers editing one file is the most common way a night produces nothing mergeable. Shared files (a DI registry, a JSON context) get an append-only rule under a comment naming the ticket.
- Prefactoring that makes the real change easy is its own ticket, first.
- A wide mechanical refactor whose blast radius spans the codebase is sequenced expand → migrate in batches → contract, each batch its own ticket blocked by the expand, rather than forced into one slice.

Avoid file paths and code snippets in **What to build**; they go stale. Put paths only in **Ownership**, where they are a contract, and verify each one exists before writing it.

## Decisions and coverage

The coordinator owns the decision register in runlog.md. Before accepting a ticket, copy **every** maker "Needs a human decision" and reviewer "Spec question" into it with a stable ID, source, question/options, affected tickets and status. Keep the original question and history. A reviewer PASS or recommended workaround does not resolve it. Resolve only with a user answer or an exact already-approved contract/decision reference that actually settles that question; retain the authority and resolution instead of asking again. An unsupported interpretation stays open in Waiting for you and parks the ticket/dependents under the existing recovery rules. Reviewers still ignore Result as evidence of code correctness; the coordinator extracts question metadata separately.

For each user answer, map the affected paths before dispatch: explicit/absent/null/empty inputs, existing/missing data, create/update/read and user scope where relevant. Record expected behavior or N/A with a reason, plus the owning ticket and authority for each row. If the answer illustrated one path but might change an earlier "legacy/create unchanged" decision, record the conflict and ask the user before amending scope; do not silently limit the answer to the illustrated path or extend it to others.

Once resolved, put the approved rule and coverage in **every** affected ticket, including done tickets. Retire affected review evidence to history, mark re-verification pending and hold dependent work until it passes; preserve existing accepted commits/files and use a bounded follow-up ticket for any new edits. Do not undo integrated work merely because its spec changed. Fresh makers receive approved decisions in the ticket, never a conversation transcript.

## Source evidence and conditional write-order checks

Briefs describe behavior from the actual implementation with source/command evidence, not memory. An accepted exception names its finding ID, exact behavior/location, evidence and user/contract authority; it suppresses only that issue, never a category or neighboring code.

Only when a ticket moves a write or other side effect, record the before/after operation order, every remaining validation/return/throw/catch path after each write, and expected persistent state on rejection. Trace called helpers and all affected item/input subsets. Unsettled failure behavior is a Spec question; do not invent transactions or rollback requirements.

## Ticket template — `tickets/NN-<slug>.md`

```markdown
# NN: <Title>

**What to build:** the end-to-end behaviour this ticket makes work, from the user's point of view.

**Blocked by:** <numbers and titles> | None (can start immediately)

**Risk:** low | high (approved by name in contract)

**Status:** ready | running | review | done | parked | failed | blocked

**Block reason:** none | blocked_permission | <decision or dependency>

**Execution:** <absolute working directory> · Git level: L<n>

**Baseline:** <base commit or none> · Snapshot: <absolute snapshots/NN-before/ path>

**Integration:** <pending | source SHA → integrated SHA | L0 accepted manifest path>

**Decision coverage:** <decision IDs + approved rule/authority and affected-path rows | none with reason> · Unresolved: <IDs | none> · Review validity: <pending | current for this spec/candidate>

## Ownership
Files and folders this worker may create or edit. Everything else is read-only, except that the maker fills only the Result section of this assigned ticket; the coordinator owns its baseline, acceptance and integration fields.
- <path>
- <shared file> — append-only under `// ticket NN`

## Constraints
- Follow <CLAUDE.md / AGENTS.md / ADR …>; read it before starting
- <repository rule that commonly breaks here>
- Do not commit, push, install dependencies, or change configuration
- Do not read or print credential files or environment values that look like secrets
- Routing: <tier → model/effort> — reason
- Source evidence / accepted exceptions: <source or command references; exact finding ID/scope/authority | none>

## Write-order analysis (only when moving side effects)
- Before → after: <operations and helper calls>
- Failure paths after each write: <validation/return/throw/catch, all affected item/input subsets, source evidence>
- State on rejection: <approved expectation and authority | unresolved decision ID>

## Permission requirements
- <role -> required action/exact command form -> paths, including build outputs and this ticket's Result write>
- Current-host check: <ready | blocked | unknown> · Evidence: <contract permission entry and bounded check results>
- On host denial: stop, record blocked_permission below and return; do not change permissions or retry through another tool. See <absolute path to permissions.md supplied by coordinator>

## Acceptance
- [ ] <verify command> passes
- [ ] <observable behaviour the reviewer can point to in the diff>
- [ ] Result section below is filled in
- [ ] Approved decision coverage is satisfied; coordinator records all questions and their authority/status separately

## Result
_(written by the maker; the reviewer never reads it as evidence)_
- Did:
- Verified by:
- Did not do, and why:
- Block reason: <none | blocked_permission> · Action/command: <sanitized | none> · Host reason/evidence: <sanitized | none> · Last completed step: <step>
- Needs a human decision: <none | question with options>

## Review
_(appended by the coordinator per round)_
- Round 1: PASS | FAIL | BLOCKED_PERMISSION — <finding file:line or command evidence — rule; permission blocks consume no fix round>
```
