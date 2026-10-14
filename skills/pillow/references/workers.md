# Workers

Workers are subagents of the same AI as the main session. Pillow does not launch another provider's CLI; a machine may have only one agent installed. Every worker receives a ticket path and a working directory, nothing else, and every worker ends by writing into the ticket and stopping. There is no question channel at night, so a worker that needs a decision records it and finishes.

## Maker

Spawn with the strong tier for cross-cutting or investigative tickets, the fast tier for mechanical ones, per routing.md. Working directory is the ticket's worktree when the ticket runs in parallel, or the work branch when it runs alone.

```
You are implementing one ticket in isolation. Read <ticket path> in full, then the repository instructions it names.
Work only inside the files listed under Ownership. Do not commit, push, install anything, or change configuration.
Run every Acceptance command yourself before you finish. If one fails and you cannot make it pass inside Ownership, stop.
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
2. `git diff --name-only <base>...HEAD`: every file must be under Ownership. Any file outside it is a finding.
3. For each Acceptance line, point to the file:line in the diff that satisfies it. A line you cannot point to is a finding.
4. Check the diff against the repository rules the ticket names.
5. Grep the diff for secrets, tokens, connection strings.
6. If a call-graph or impact tool is available, check whether the touched symbols are used outside Ownership.
Return exactly one of:
PASS
FAIL
- <file:line> — <rule or acceptance line> — <what it must be instead>
A finding without file:line and a rule is not a finding; leave it out. If you disagree with the ticket's spec itself, say so as a separate "Spec question" rather than a finding.
```

## The review loop, and how it stops

Review loops spiral when the same maker keeps re-interpreting the same finding. These rules make the spiral impossible, not just unlikely:

1. One maker run, then at most **two** fix rounds. The third reviewer verdict is final: FAIL means park.
2. Every fix round uses a **new maker** with fresh context and only the findings.
3. Every review uses a **new reviewer**. A reviewer that has seen the earlier round defends its earlier findings.
4. A finding that **repeats** (same `file:line`, same rule) in round two ends the loop immediately: the spec allows two readings, and that is a human question, not a code problem. Park with both readings as options.
5. A finding without evidence is dropped, not counted. A reviewer's disagreement with the spec is parked as a decision, not counted as FAIL.
6. A fix round that grows the diff outside Ownership is a FAIL on its own; widening scope to make a finding go away is the signature of a lost maker.
7. A maker that reports done while an Acceptance command fails counts as a failed round; the reviewer's run is the truth.
8. Three consecutive tickets ending parked or failed trips the night's circuit breaker: the problem is upstream in the contract or the slicing, and more tickets will not fix it.

Record each round in the ticket's `## Review` and in `runlog.md` as it happens, so rule 4 can be checked and so the morning report can explain what was tried.

## Merge

After PASS the coordinator merges with `git merge --no-ff <ticket-branch>`, runs the repository's build once, and commits per the Git level. A conflict is a ticket for a subagent (ticket, both branches, Ownership unchanged) followed by a new review. The coordinator reads results; it does not edit code.
