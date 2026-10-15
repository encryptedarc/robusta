# Plan and contract

The plan phase is an interview, not a form. Ask one question at a time, give a recommended answer with each, and resolve dependencies between decisions in order — scope before slicing, slicing before Git level, Git level before tracker. Prefer exploring the repository over asking when the code can answer. Stop when every ticket is unambiguous or explicitly parked.

## Questions to cover

Scope
- What does "done" look like for the whole request, in one sentence the user would accept in the morning?
- Which parts are in, and which are deliberately out tonight?
- Is there existing uncommitted work in the tree? It belongs to the user: commit, stash, or branch it before anything else. Never discard it.

Risk
- Which tickets are high-risk: production data, sending anything, money, security controls, schema or data migrations, deletions, large ports with unclear behaviour? These are parked unless the user approves each by name.
- For each ticket, what is the verify command or check that proves it works without a human looking?

Decisions Pillow may make alone
- Which kinds of choices are implementation detail (free) and which need the user (park)? Examples: naming, file placement, library already in use = free; new dependency, API contract change, behaviour the spec leaves open = park.

Git
- Level L0 to L3 (see SKILL.md). Ask every run, recommend L1.
- Branch name, following the format the repository already uses if one is visible in `git branch -a`.
- Tracker, from `git remote get-url origin`. Ask only when the remote does not decide it.

Time and budget
- When is the user back? That is the deadline: no new ticket starts that cannot finish before it, and auto-resume stops there.
- Usage now and reset time: the user's figure wins if they gave one. Choose the window for the per-run cap (weekly when available), default 40 points; record its identity and the initial stop line. Carry spent points across resets per routing.md.
- Model tiers: if a per-machine model file exists, confirm it; otherwise the agent's configured default for every tier. Frontier models only if named here.

## Preflight checklist

Run while the user is still present. A failed item is reported now, not discovered at night.

- [ ] Every verify command ran once on the baseline; its output is saved in the run folder so a reviewer can diff existing behaviour byte-for-byte
- [ ] `gh auth status` or `az account show` succeeds when L3 or tracker intake needs it
- [ ] Permission inventory covers each role's actions/commands and all worktree, build, run-folder, Result, snapshot and recovery paths per [permissions.md](permissions.md)
- [ ] Current-host coordinator and worker policies have evidence of no-prompt rejection, planned action/path coverage and bounded checks; record ready, blocked or unknown. Only ready allows dispatch; a build/test dry-run alone is insufficient
- [ ] User confirmed the machine will stay awake and online until the deadline — ask; do not change power or sleep settings yourself
- [ ] Usage source answered, or the user supplied numbers and reset times
- [ ] Run folder created and, if inside the repo, excluded from Git

## contract.md template

```markdown
# Pillow contract — <date> <slug>

- Approved by user at: <time>
- Goal: <one sentence>
- Out of scope tonight: <list>
- Repository: <path> · Branch: <name> · Tracker: <github | azure-devops | none> (from origin)
- Git level: L<0-3>
- Permission host: <provider/version, machine/session reference, working/run-folder path scope; no secrets>
- Effective policies: coordinator = <approval/sandbox/access scope + evidence>; maker/reviewer = <effective policy + evidence, not assumed inheritance>
- Required permissions: <role -> action/exact command form -> paths; include worker creation, Result/run-folder writes, snapshots, recovery and Git operations at the approved level>
- Permission preflight: <ready | blocked | unknown> · Checked at: <time/current session> · Coverage/check evidence: <sanitized references/results> · Missing setup: <action/path and user control | none>
- Deadline: <time> · No new ticket after: <time>
- Usage at bedtime: <remaining>% of <window>, resets <time> (source: user-supplied | tool)
- Cap window: <identity/duration> · Cap: <n> points · Spent: 0 · Initial stop line: <remaining − n>% (reset accounting: routing.md)
- Models: fast = <id/effort> · strong = <id/effort> · reviewer = <id/effort>
- Pillow may decide alone: <list>
- Must park: <list>
- High-risk tickets approved by name: <ids or none>
- Verify commands: <commands>
- Baseline results: <command → result>

## Tickets (approved)
| # | Title | Blocked by | Risk |
|---|-------|------------|------|
```
