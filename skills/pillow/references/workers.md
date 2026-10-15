# Workers

Workers are subagents of the same AI as the main session. Pillow does not launch another provider's CLI; a machine may have only one agent installed. Every worker receives a ticket path and a working directory, nothing else, and every worker ends by writing into the ticket and stopping. There is no question channel at night, so a worker that needs a decision records it and finishes. The ticket carries required actions/paths, current-host permission evidence and the absolute permissions.md reference. Before dispatch, verify the worker's effective policy per [permissions.md](permissions.md); do not assume the coordinator's policy is inherited.

## Maker

Spawn with the strong tier for cross-cutting or investigative tickets, the fast tier for mechanical ones, per routing.md. At L0 use the work folder and run sequentially. At L1–L3 use a dedicated ticket branch and worktree based on the current work-branch commit; parallel tickets may share that base. Record the absolute working directory and baseline in the ticket before dispatch.

```
You are implementing one ticket in isolation. Read <ticket path> in full, then the repository instructions it names.
Work only inside the files listed under Ownership. Do not commit, push, install anything, or change configuration.
Run every Acceptance command yourself before you finish. If one fails and you cannot make it pass inside Ownership, stop.
If a tool returns a host permission denial, stop immediately and record Block reason: blocked_permission, the sanitized action/command and host reason, partial work and last completed step in Result. Return this evidence if writing Result is also denied. Do not retry via another tool, request approval, change policy, or restore files with git checkout/restore; the coordinator owns recovery against the saved snapshot.
If you hit a decision the ticket does not settle, do not guess: finish what is unambiguous and write the question under "Needs a human decision".
Finish by filling the ## Result section of the ticket: what you did, how you verified it, what you did not do and why, and any question. Then stop.
```

For a fix round, spawn a **new** maker and add: `A reviewer rejected the previous attempt. The worktree already contains that attempt. Fix exactly these findings and nothing else: <findings>.` Do not hand it the previous maker's Result or transcript; a maker carrying a wrong assumption fixes around it instead of through it.

## Reviewer

Always a fresh subagent, always the strong tier, never the maker. The reviewer's job is to find out whether the work is actually done, not to read the maker's claim that it is.

```
You are reviewing one ticket. Read <ticket path> but ignore its ## Result section: your evidence is the worktree, not the maker's summary.
Worktree: <path>. Base: <ref>.
1. Run every Acceptance command yourself and record the real output.
2. Compare the actual working tree with the saved pre-ticket baseline, including additions, deletions and binary files. In Git inspect `git diff <base>`, `git diff --cached <base>`, `git diff`, and `git ls-files --others --exclude-standard`; inspect the contents of new files too. A commit-to-commit diff alone misses the maker's uncommitted work. At L0 compare with the pre-ticket snapshot, so earlier accepted diffs are not attributed to this ticket. In a plain folder use the snapshot manifest and file comparisons. Every changed path must be under Ownership; an outside path is a finding.
3. For each behavioural Acceptance line, cite the changed file:line that satisfies it. For command checks, deletions, binary changes and Result completion, record the relevant command output, path or artifact instead of inventing a line number.
4. Check the diff against the repository rules the ticket names.
5. Check the tracked diff, staged changes and newly created files for secrets, tokens and connection strings. Report only the location and kind of secret; never reproduce its value.
6. If a call-graph or impact tool is available, check whether the touched symbols are used outside Ownership.
If a read or verification tool returns a host permission denial, stop and return BLOCKED_PERMISSION with the sanitized action/command and host evidence. Do not repair code or request/change permissions. A test assertion failure remains FAIL.
Return exactly one of:
PASS
FAIL
- <file:line or command/artifact evidence> — <rule or acceptance line> — <what it must be instead>
BLOCKED_PERMISSION
- <sanitized action/command and host denial evidence>
A finding needs a rule and evidence: file:line for source changes, or command output / artifact path for checks and non-text changes. A failed command or unreadable baseline is FAIL unless a host permission denial explains it, in which case use BLOCKED_PERMISSION; never PASS because it has no line number. If you disagree with the ticket's spec itself, say so as a separate "Spec question" rather than a finding.
```

## The review loop, and how it stops

Review loops spiral when the same maker keeps re-interpreting the same finding. These rules make the spiral impossible, not just unlikely:

1. One maker run, then at most **two** fix rounds. The third reviewer verdict is final: FAIL means park.
2. Every fix round uses a **new maker** with fresh context and only the findings.
3. Every review uses a **new reviewer**. A reviewer that has seen the earlier round defends its earlier findings.
4. A finding that **repeats** (same `file:line`, same rule) in round two ends the loop immediately: the spec allows two readings, and that is a human question, not a code problem. Park with both readings as options.
5. A finding without evidence is dropped, not counted; command output and artifact paths count as evidence. A reviewer's disagreement with the spec is parked as a decision, not counted as FAIL.
6. A fix round that grows the diff outside Ownership is a FAIL on its own; widening scope to make a finding go away is the signature of a lost maker.
7. A maker that reports done while an Acceptance command fails counts as a failed round; the reviewer's run is the truth.
8. Three consecutive tickets ending parked or failed trips the night's circuit breaker: the problem is upstream in the contract or the slicing, and more tickets will not fix it.

Record each round in the ticket's `## Review` and in `runlog.md` as it happens, so rule 4 can be checked and so the morning report can explain what was tried.

`BLOCKED_PERMISSION` bypasses the code-fix loop: park with that block reason and follow permissions.md. Do not dispatch a reviewer for a maker's permission denial or a fix maker for a reviewer's denial.

## Pre-ticket snapshot and parking

Before the maker writes, save `snapshots/NN-before/` in the coordinator's run folder, outside worker Ownership and outside any ticket worktree. Record the base commit (if Git), the existing paths under Ownership, their bytes and file types/modes, absent paths, and the real Git index state. Include existing untracked files and deletions from earlier L0 tickets. Keep a working-tree path/status inventory and content fingerprints for existing project files outside Ownership, excluding credentials, the run folder and ignored build outputs, so the reviewer can detect new writes without blaming earlier L0 changes. A snapshot must be recoverable without a commit; if it cannot be captured, do not dispatch.

On park or final FAIL:

Confirm the worker has stopped before changing its files. If any archive, restore or recovery check is denied, preserve the live attempt and snapshots, stop dispatch, and record recovery pending per permissions.md. Never replace snapshot recovery with `git checkout -- <path>` or `git restore <path>` against HEAD; that can discard pre-existing changes.

1. Save `patches/NN-roundK.patch` for tracked text and binary changes relative to that snapshot, plus an archive/manifest containing new or untracked files and any content the patch cannot represent. An ordinary `git diff` omits untracked files. Verify the saved attempt can reconstruct the changed files in a temporary directory before restoring anything.
2. Restore only the current ticket's changes from `snapshots/NN-before/`, including deleted files and the original index state. Remove only exact paths proven to have been created by this ticket, after archiving them. Do not use a broad clean/reset or restore the shared L0 folder to HEAD. A changed path outside Ownership or an unexplained external edit trips the circuit breaker; preserve it and hand off instead of overwriting it.
3. Compare bytes, file existence/types and index state with the snapshot. Earlier accepted L0 changes and pre-existing untracked files must remain intact. If recovery does not match, stop the run with the snapshots and attempt archive retained.

## Integration by Git level

The coordinator performs Git operations; workers never commit. A reviewer PASS covers the exact candidate contents, so any change after review requires another review.

- **L0:** keep the accepted changes in the work folder, with no commits or branch merges. Run every contract verify command against the cumulative folder, then record the snapshot, accepted content manifest and evidence as done. The next ticket snapshots this cumulative state, including untracked files. Keep snapshots until the user integrates the run.
- **L1–L3:** after PASS, stage only the reviewed paths in the ticket worktree and verify the staged contents match the reviewed candidate, including new files. Commit there, then immediately record its SHA and the target work-branch base before integration. Fast-forward the work branch to that commit when possible; if another accepted ticket has advanced it, cherry-pick the reviewed ticket commit onto the work branch. This keeps one ticket commit on the work branch without an extra merge commit. Record both the source and integrated SHA when they differ.

Run all contract verify commands on the combined result, not just the build. Only then mark the ticket done, push at L2, or update the draft PR at L3. Keep the ticket worktree and recovery artifacts until integration and verification succeed. If integration conflicts, preserve the in-flight operation and dispatch a subagent with the ticket, both bases and the same Ownership; review the resolved candidate before the coordinator completes it. A combined-result regression stops the run without pushing or claiming done.

Before resuming a pending integration, reconcile the recorded source/integrated SHA with the work branch and Git's in-flight state. An already integrated, verified ticket gets its log repaired, not another cherry-pick. If a crash left the SHA mapping incomplete, compare the candidate patch and target history to establish what was applied; uncertain or externally changed state goes to handoff. At L0 reconcile the accepted manifest with the live snapshot before dispatching anything. Never replay a completed ticket from handoff text alone.
