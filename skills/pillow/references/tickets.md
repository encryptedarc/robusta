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

## Ticket template — `tickets/NN-<slug>.md`

```markdown
# NN: <Title>

**What to build:** the end-to-end behaviour this ticket makes work, from the user's point of view.

**Blocked by:** <numbers and titles> | None (can start immediately)

**Risk:** low | high (approved by name in contract)

**Status:** ready | running | review | done | parked | failed | blocked

## Ownership
Files and folders this worker may create or edit. Everything else is read-only.
- <path>
- <shared file> — append-only under `// ticket NN`

## Constraints
- Follow <CLAUDE.md / AGENTS.md / ADR …>; read it before starting
- <repository rule that commonly breaks here>
- Do not commit, push, install dependencies, or change configuration
- Do not read or print credential files or environment values that look like secrets
- Routing: <tier → model/effort> — reason

## Acceptance
- [ ] <verify command> passes
- [ ] <observable behaviour the reviewer can point to in the diff>
- [ ] Result section below is filled in

## Result
_(written by the maker; the reviewer never reads it as evidence)_
- Did:
- Verified by:
- Did not do, and why:
- Needs a human decision: <none | question with options>

## Review
_(appended by the coordinator per round)_
- Round 1: PASS | FAIL — <finding file:line — rule>
```
