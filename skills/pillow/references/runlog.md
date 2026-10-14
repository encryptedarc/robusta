# Run log, handoff and report

These three files are the coordinator's memory. The conversation is not: it gets compacted, the session gets restarted, the quota runs out. Write to the run folder at the moment something happens, never "at the end".

## runlog.md — append as events occur

| When | Write |
|------|-------|
| run created | contract summary, usage before start, ticket table with empty result columns |
| ticket dispatched | ticket, tier/model actually used, worktree, time |
| each review round | round number, PASS or the findings in one line each |
| merged | commit sha, build result after merge |
| parked | the question, options, recommendation, which tickets it blocks |
| failed | last findings, where the patch is saved |
| quota wait | lowest remaining, reset time, what was in flight |
| breaker tripped | which rule, what was running |
| run closed | usage after, lessons for the next contract |

```markdown
# Pillow run — <date> <slug>
- Contract: contract.md · Branch: <name> · Git level: L<n>
- Usage at start: <window> <remaining>% (source) · Cap: <n>%

| # | Ticket | Tier (effective) | Round 1 | Round 2 | Round 3 | Status | Commit |
|---|--------|------------------|---------|---------|---------|--------|--------|

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
- Stopped at: <time> · Reason: quota (<remaining>%, reset <time>) | deadline | breaker: <rule> | repository changed
- Resume no later than: <deadline>

## Frontier
- Done: 01, 02
- Running: 03 — worktree <path>, uncommitted work present | none
- Parked: 04 (see report Waiting for you)
- Blocked: 05 (by 04)
- Not started: 06, 07

## Next steps, in order
1. Refresh usage; continue only if ≥ 30% remaining and before the deadline
2. Review 03 with a fresh reviewer (round 2)
3. Dispatch 06

## Read first
contract.md · runlog.md · tickets/03-*.md
```

Resume reads this file and the contract, then continues at step 1 of Next steps. It does not re-ask the Git question unless the repository changed from outside.

## report.md — written last, shown in chat

One screen. Verified facts only; a ticket without a reviewer PASS is not in Done.

```markdown
# Pillow report — <date> <slug>

**First thing to do:** <one action>

**Done** <n> · **Waiting for you** <n> · **Failed** <n> · **Not started** <n>
Time <start>–<end> · Quota waits <count> (<minutes>) · Usage now <remaining>%

## Done
| # | Ticket | Commit | Evidence |
|---|--------|--------|----------|

## Waiting for you
| # | Question | Options | Recommendation | Unblocks |
|---|----------|---------|----------------|----------|

## Failed
| # | Cause (last findings) | Patch |
|---|-----------------------|-------|

## Not started
- <#> — <reason: blocked by, deadline, quota>

## Noticed, not fixed
- <file:line — observation>
```
