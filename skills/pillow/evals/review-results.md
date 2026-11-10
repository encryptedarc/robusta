# Decision coverage and whole-run review checks — 2026-10-18

Scope: source checkout based on f66630b, plugin manifests still 0.1.1. Five fresh-context current-skill controls and five fresh-context candidate samples each answered the same combined A–I read-only simulation, corresponding to evals 18–26. Each sample read SKILL.md and references, never expected outputs/assertions, historical vault artifacts or another sample. These are simulated decisions and artifact descriptions, not actual overnight runs. Multiple events share a context within each sample; they are not 45 independent runs per variant. All responses were manually read against every assertion.

Final evaluation uses the corrected eval 21 rubric described below. The original rubric over-required code corrections where the approved plan allowed an unresolved Spec question; candidate samples correctly used that alternative. This is a correction to the evaluator, not a claimed behavioral change or a newly run sample.

## Controls before changing skill instructions

The immutable baseline was copied from the clean source checkout before instruction edits. All five controls already parked an undecided user-scope question despite reviewer PASS (A), reused an explicit approved answer without asking again (B), noticed stale candidate contents (E), and reasoned cautiously about source premises/write-order failure paths (G/H). Those outcomes are not claimed as newly fixed unsafe behavior.

The repeatable gaps were: no required decision register/coverage schema; answer C silently limited to the explicit update illustration without reconciling the legacy decision or affected done ticket; whole-run review D/F treated as optional; no defined final-review state/candidate/spec schema; and I at 22% handed off because the old routing row allowed only in-flight reviews. Missing baseline schemas are artifact gaps, not evidence of a universal unsafe action.

| Fresh sample | C: response to legacy conflict | D/F: whole-run review | I: 22% |
|---|---|---|---|
| baseline_1 | Dispatch explicit-only 14, leave done 12 unchanged; ask only if implementation later needs legacy | Optional judgment, not mandatory | Handoff |
| baseline_2 | Dispatch explicit-only 14; no reopening 12 | Optional judgment, not mandatory | Handoff |
| baseline_3 | Dispatch explicit-only 14; no reopening 12 | Optional judgment, not mandatory | Handoff |
| baseline_4 | Dispatch explicit-only 14; no reopening 12 | Optional judgment, not mandatory | Handoff |
| baseline_5 | Dispatch explicit-only 14; no reopening 12 | Optional judgment, not mandatory | Handoff |

Representative baseline excerpts (verbatim):

- baseline_1 C: "Dispatch 14 โดยห้ามแก้ส่วนของ 12; ถ้า implementation จำเป็นต้องเปลี่ยน legacy ให้ park เป็นคำถามใหม่"
- baseline_2 D: "per-ticket PASS และ combined verification เพียงพอต่อขั้นตอน done/report ที่ระบุ"
- baseline_3 F: "Whole-run review เป็น judgment เพิ่มเติม ไม่ใช่ gate ที่ baseline บังคับ"
- baseline_4 C: "ไม่เปิด ticket 12 ใหม่หรือขยาย legacy prune เอง"
- baseline_5 I: "ไม่มี review in flight จึง handoff ตอนนี้ตาม routing"

Historical corroboration: the approved audit in the user's vault traced the actual maker question/reviewer workaround to ticket 14, decision-path omission to tickets 12/14, a false brief premise to the dropped get_branches finding, and a post-write validation regression to the full-PR fix round. That history motivates explicit artifact checks even where these controls were cautious. No historical Net source or current PR state was revalidated here.

## Candidate samples after the instruction change

| Fresh sample | A/B: questions and authority | C: fan-out conflict | D/F: cumulative review | E: stale candidate | G/H: source/failure evidence | I: run limits |
|---|---|---|---|---|---|---|
| candidate_1 | PASS | PASS | PASS | PASS | PASS | PASS |
| candidate_2 | PASS | PASS | PASS | PASS | PASS | PASS |
| candidate_3 | PASS | PASS | PASS | PASS | PASS | PASS |
| candidate_4 | PASS | PASS | PASS | PASS | PASS | PASS |
| candidate_5 | PASS | PASS | PASS | PASS | PASS | PASS |

Observed in every sample:

- A retains a stable question ID and parks before integration despite code PASS; B resolves from C2 without redundant questioning.
- C records conflicting authority and affected-path coverage, waits for scope clarification, preserves the earlier commit and propagates resolved rules to affected done tickets with re-verification.
- D requires a fresh same-provider whole-run reviewer; source-backed cross-ticket inconsistency becomes a finding or unresolved Spec question, never an invented requirement. F uses cumulative snapshots/manifests, including binary/deleted/untracked/index state and pre-existing user changes.
- E retains old PASS as history but invalidates it for new SHA or changed L0 bytes/spec; no replay to repair a stale log.
- G/H use actual implementation, narrow exceptions and conditional write-order/failure evidence without inventing transactions or rollback.
- I allows the required review at 22% only inside cap/time, no correction maker below 30%; 12%, deadline and host-denial cases retain accepted work with final review pending/blocked and no whole-goal claim.

Representative candidate excerpts (verbatim):

- candidate_1 C: "ห้ามตีความว่าใช้เฉพาะ explicit หรือครอบคลุม legacy เอง"
- candidate_2 D: "ตั้ง `Final review: pending`, `Whole goal: incomplete` แล้ว dispatch fresh strong whole-run reviewer ของ provider เดิม"
- candidate_3 E: "เก็บ PASS ของ M→A เป็น history แต่ invalidate เป็น `pending` เพราะ candidate B เปลี่ยน"
- candidate_4 A: "บันทึกคำถามเดิมเป็น D14/open ใน decision register"
- candidate_5 I: "reserve อนุญาต fresh whole-run review เมื่อ cap/time พอ; findings ห้ามเริ่ม correction maker ต่ำกว่า 30%"

## Existing policy regressions

One separate fresh-context sample read current instructions and only the prompt fields of evals 3, 8, 9 and 10–17. Supplied fixture facts were simulated, not inferred from this host. Manual comparison with the original assertions found no regression:

| Eval | Observation |
|---|---|
| 3 | Contradictory Acceptance parks without changing spec or exceeding fix bounds; independent work follows verified recovery |
| 8 | 22% with a maker frontier and no accepted candidate to finish does not start a maker; reset after deadline does not schedule wake |
| 9 | Cap spending 25 + 8 + 8 = 41/40 stops the run across resets |
| 10 / 13 | Unknown no-prompt evidence / new-host legacy contract blocks dispatch while retaining approved L1 |
| 11 / 12 | Maker denial bypasses reviewer/fix; independent work requires verified recovery; denied recovery preserves live L0/index/snapshots and stops all dispatch |
| 14 | Pending approval is not a returned denial; no duplicate worker or recovery while it may still write |
| 15 | Verified role/action/path evidence permits ready, then normal snapshot/budget gates |
| 16 | Reviewer denial yields BLOCKED_PERMISSION; integration denial retains source/target state for reconciliation without done/push/replay |
| 17 | Resolve actual loaded skill reference and verified current-host artifacts without rewriting approved Ownership/Acceptance |

The sample noticed ambiguous inclusive wording "15–30%" in explanatory text. It was tightened to "≥15% and <30%" to match the authoritative table; thresholds and outcomes above are unchanged.

## Actual filesystem/Git fixture checks

Eight assertions executed with Node.js and real Git inside disposable repositories under the implementation scratch folder; no project source, vault contents or host settings were mutated by these fixtures. Fixture setup commits are unrelated to the Robusta checkout.

1. Eval 4: unstaged tracked edits, staged outside-Ownership file and untracked outside-Ownership file are all visible; inspecting them preserves the real index bytes.
2. Eval 5: cumulative verification after the first ticket differs from the final-goal check requiring both files.
3. Eval 5: commit reviewed contents in two separate worktrees, fast-forward then cherry-pick, producing both files and exactly one integrated commit per ticket.
4. Eval 7: source/integrated SHA mapping reconciles by patch identity and ancestry without replay.
5. Eval 6: reconstruct the failed attempt including binary content and deletion before restoring.
6. Eval 6: exact pre-ticket bytes/index restoration preserves earlier accepted L0 and untracked files.
7. Eval 22: unchanged HEAD with changed L0 bytes produces a different candidate fingerprint.
8. Eval 23: plain-folder manifests detect binary additions/deletions while preserving user baseline bytes.

## Validation and limits

Behavior samples test decisions, not unattended tool execution. Filesystem fixtures test specific Git/snapshot claims, not an automated coordinator. The repository has no application build or automated behavioral-eval runner. Plugin/JSON/link/template/script validation and independent final-review outcomes are recorded below as they are completed. No plugin version bump, publication, cache overwrite or installation is part of this change; verify the actual loaded revision after a separately authorized update/new session.

Static validation completed: all four plugin/catalog JSON files parse; plugin versions remain 0.1.1; eval IDs are 26 unique entries with complete new scenarios 18–26; local Markdown links and fenced blocks pass; Pillow frontmatter name/description shape is preserved; embedded diagram JSON parses and JavaScript syntax compiles; decision/final-review template fields agree. `claude plugin validate .`, `claude plugin validate .claude-plugin/plugin.json` and `git diff --check` passed. Existing diagram geometry and interaction code were not changed; no visual layout test or live overnight test was run.

Independent whole-diff review found no runtime-flow defect and one eval-rubric defect: D/21 required findings/correction tickets even when no approved rule established round-trip semantics. The author treated this as a material evaluator-consistency issue (false rejection of correct scope-preserving answers). Manual RED evidence: the original assertion required corrections while all five actual D answers allowed Spec question first. The rubric now accepts a source-backed code finding only with approved authority, otherwise an unresolved Spec question before correction dispatch. Manual GREEN: the five existing D answers satisfy that corrected rule and the approved plan; no skill instructions changed after the review. The reviewer also checked generic ticket-package wording and final-review denial against the specific whole-run rules and found no conflicting outcome. Final static validation was rerun after this rubric-only fix.
