# Run log, handoff and report

These three files are the coordinator's memory. The conversation is not: it gets compacted, the session gets restarted, the quota runs out. Write to the run folder at the moment something happens, never "at the end".

## runlog.md — append as events occur

| When | Write |
|------|-------|
| run created | contract summary, usage before start, ticket table with empty result columns |
| permission preflight / recheck | host/session and path scope, coordinator/worker policies and sanitized evidence, ready/blocked/unknown, missing action/path coverage |
| permission blocked | blocked_permission, ticket/role, sanitized action/command and host reason, returned denial or pending approval, live worker identity, last completed step, saved artifacts and recovery/integration pending |
| ticket dispatched | ticket, tier/model actually used, working directory, base commit, snapshot/manifest, time |
| each review round | round number, PASS or the findings in one line each |
| decision raised / answered | stable ID, source question/options, status, affected tickets/paths, user answer or exact approved authority; retain history even when already answered |
| decision propagated | approved rule/coverage, conflicts waiting for user, all affected tickets including done ones, review evidence invalidated and re-verification pending |
| final review / invalidation | fixed scope/base, candidate/spec identities, verdict/evidence, stable finding IDs and correction counts; change after PASS returns it to pending |
| integration pending | reviewed content manifest, source commit SHA, target work-branch base before integration |
| integrated / L0 accepted | source/integrated SHA or L0 manifest, every contract verify result; only then mark done |
| parked | the question, options, recommendation, which tickets it blocks |
| failed | last findings, where the patch is saved |
| quota reading / wait | per-window remaining/reset, measured or estimated source, cap ledger (last reading and cumulative spent), what was in flight |
| breaker tripped | which rule, what was running |
| run closed | usage after, lessons for the next contract |

```markdown
# Pillow run — <date> <slug>
- Contract: contract.md · Branch: <name> · Git level: L<n>
- Usage at start: <window> <remaining>% (source) · Cap: <n>%
- Cap ledger: <window identity/reset boundary> · Last remaining: <n>% · Cumulative spent: <n> points · Source: <measured | estimated; uncertain intervals>
- Permission preflight: <ready | blocked | unknown> · Current-host evidence: <contract reference> · Blocked actions: <none | sanitized list>
- Final review: <pending | pass | findings | blocked> · Scope/base: <reference> · Candidate: <HEAD + live-content inventory | cumulative manifest> · Spec/decisions: <fingerprints> · Evidence: <reference | none>

| # | Ticket | Tier (effective) | Round 1 | Round 2 | Round 3 | Status | Commit |
|---|--------|------------------|---------|---------|---------|--------|--------|

## Decisions
| ID | Source / question / options | Status | Answer / exact user or contract authority | Affected tickets / coverage |
|---|---|---|---|---|
| D01 | <maker Result or reviewer Spec question> | open / conflict / resolved | <answer/reference or pending> | <IDs, including done tickets; path matrix reference> |

## Final findings
| ID | Evidence / rule | Correction attempts | Status / follow-up ticket |
|---|---|---|---|

## Events
- <time> ▶ 02 dispatched · strong · worktree ../repo-02
- <time> ✔ 02 PASS round 1 → merged a1b2c3d · build ok
- <time> ⏸ 04 parked: <question> → blocks 05
- <time> ⏳ quota 14% → handoff · reset 05:00

## Lessons for the next contract
- <routing line that should change, slicing that was too coarse, a question that should have been asked>
```

## handoff.md — written whenever the loop stops early

```markdown
# Pillow handoff — <date> <slug>
- Stopped at: <time> · Reason: quota (<remaining>%, reset <time>) | cap (<spent>/<cap> points) | deadline | breaker: <rule> | repository changed | blocked_permission
- Resume no later than: <deadline>
- Permission state: <ready | blocked | unknown> · Host/policy evidence: <reference> · Missing capability: <role/action/path | none>
- Pending approval/live worker: <identity/action | none | unknown> · Recovery/integration: <verified | pending steps and actual saved artifacts>
- Decisions: <open/conflicting IDs and coverage references | none> · Final review: <state, reviewed vs actual candidate/spec identities, evidence and correction counts>

## Frontier
- Done: 01, 02
- Running: 03 — worktree <path>, baseline <commit/snapshot>, review round <n>, source/integrated SHA <sha/pending>, verification <pending/passed> | none
- Parked: 04 (see report Waiting for you)
- Blocked: 05 (by 04)
- Not started: 06, 07

## Next steps, in order
1. Recheck current-host permissions per permissions.md; retain approved Git level. Refresh usage; apply routing.md (new maker requires ≥ 30%; required final review may use the reserve), within cap/deadline
2. Review 03 with a fresh reviewer (round 2)
3. Dispatch 06

## Read first
contract.md · runlog.md · tickets/03-*.md
```

Resume reads this file, the contract and runlog's cap ledger. Recheck permissions per [permissions.md](permissions.md) before dispatch or mutating reconciliation, even on an unchanged repository or an old contract without permission fields. Read-only reconciliation may proceed where allowed. Reconcile live workers, the actual working directory, snapshots, commit history and pending integration per workers.md before continuing Next steps. Do not re-ask the Git question unless the repository changed from outside. A recorded done ticket is never blindly replayed; cap and deadline stops remain stopped.

Reconcile the decision register and affected-ticket coverage too. Missing legacy final-review identity/evidence means pending, not an assumed PASS; compare the actual base/candidate/spec with reviewed fingerprints before reusing a verdict. Preserve ticket acceptance history while re-verifying affected work.

## report.md — written last, shown in chat

One screen. Verified facts only; a ticket without a reviewer PASS and resolved decision coverage is not in Done. Done counts accepted tickets, not whole-goal completion. Claim the whole goal verified only when all approved tickets are done, decisions resolved, combined verification passes and final PASS covers the current candidate/spec; otherwise show the remaining work and final review pending/findings/blocked.

```markdown
# Pillow report — <date> <slug>

**First thing to do:** <one action>

**Done** <n> · **Waiting for you** <n> · **Failed** <n> · **Not started** <n>
Time <start>–<end> · Quota waits <count> (<minutes>) · Usage now <remaining>%

**Whole goal:** <verified | incomplete> · **Final review:** <pending | pass | findings | blocked> · Candidate/base/spec: <identities> · Evidence / remaining action: <reference>

## Done
| # | Ticket | Commit | Evidence |
|---|--------|--------|----------|

## Waiting for you
| # | Question or block reason | Evidence / saved attempt / recovery pending | Options | Recommendation | Unblocks |
|---|--------------------------|---------------------------------------------|---------|----------------|----------|
| <decision ID> | <original question, including one still open despite code PASS> | <source/coverage and saved attempt> | <options> | <recommendation, not approval> | <tickets> |

## Failed
| # | Cause (last findings) | Patch |
|---|-----------------------|-------|

## Not started
- <#> — <reason: blocked by, deadline, quota>

## Noticed, not fixed
- <file:line — observation>
```
