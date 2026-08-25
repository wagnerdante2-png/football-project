# Match Engine V2 — Integration Status

## Status: CLOSED / FROZEN FOR NEW FEATURES

The Match Engine V2 is functionally concluded for the current project stage.

It is the primary simulation path used by the daily world calendar through `playCurrentRoundWithMedical()` -> `playCurrentRoundV2()`.

From this point forward, this module is **feature-frozen**. New match mechanics should not be added unless a future world/competition requirement exposes a genuine missing rule or a regression identifies a defect.

The only work still permitted inside this block without reopening it is:

- compile/runtime fixes;
- regression fixes;
- statistical tuning/calibration;
- compatibility fixes required by future competition rules;
- performance optimization that does not change intended behavior.

The legacy event simulator remains in `engine.ts` only as a compatibility rollback path and must not be treated as the authoritative official-match engine.

## Official match pipeline

1. Human/personal availability filters the squad.
2. Persistent medical availability filters injured players.
3. Effective medical attributes are applied.
4. Human-life, dressing-room, training and manager-relationship performance factors are applied.
5. Match Engine V2 creates the spatial match state.
6. Full match simulation runs: lifecycle, field geometry, ball physics, posts/crossbar, perception, decisions, collective tactics, action chains, fouls, referee/assistants/VAR, injuries, substitutions, set pieces, goalkeeper resolution and goal-line detection.
7. Match result is mapped back to the legacy-compatible `Fixture` contract.
8. Standings are updated.
9. Match physical load is carried back to persistent player condition.
10. Match injuries are converted into the persistent medical model.
11. Match ledger, ratings and career/season statistics are persisted.

## Functional scope completed

The current module contains the intended anatomy for official football matches:

- 105 x 68 m spatial field model and real goal dimensions;
- live ball physics, friction, bounce, wind, spin and free-ball trajectory;
- physical posts and crossbar plus complete-ball goal-line crossing;
- player perception, body orientation, limited information and bounded rationality;
- individual action utility and short action-chain planning;
- role-specific movement and coordinated attacking patterns;
- collective defending, marking, cover shadows, handoffs and defensive-line behavior;
- tactical learning/adaptation during the match;
- passing, carrying, dribbling, crossing, shooting, first touch and aerial duels;
- goalkeeper positioning, shot resolution, catches, parries, rebounds and errors;
- contextual defensive decisions and physical contact resolution;
- fouls, discipline, DOGSO, advantage, referee profiles, assistants and VAR;
- causal in-match injuries linked to the persistent medical/injury system;
- substitutions, fatigue, minimum-player continuation and competition rule hooks;
- corners, free kicks, penalties, throw-ins, goal kicks and set-piece routines;
- kickoff, halftime, side changes, added time, extra time and penalty shootouts;
- xG/post-shot xG, ratings, event ledger, action maps and match reports;
- persistent season/career statistics, records and match archive;
- deterministic seeds, edge-case checks, calibration, sensitivity and regression diagnostics;
- integration with official Fixtures, standings, world calendar, condition and career history.

## Mandatory readiness gates

The V2 must remain behind the following quality gates whenever future changes touch the module:

- deterministic replay for identical seeds;
- diversity across different seeds;
- aggregate statistical calibration;
- sensitivity to player quality and tactical styles;
- edge-case handling;
- causal event attribution consistency;
- world integration;
- world consistency across fixture, standings, history and physical carryover;
- state invariants;
- officiating sanity;
- lifecycle and goal-frame physics;
- valid player ratings.

## World consistency regression

`match-world-consistency-v2.ts` verifies that the same official match is consistent across all persistence layers:

- V2 score equals Fixture score;
- V2 xG equals Fixture xG;
- kickoff/fulltime events are preserved;
- causal goal ledger equals scoreboard;
- standings points and goal totals agree with fixtures;
- archived match agrees with fixture;
- players with minutes receive career appearances;
- match load reduces persistent condition;
- non-trivial injuries reduce persistent condition;
- re-persisting the same fixture is idempotent.

## Legacy engine policy

Do not delete `simulateMatch()` / `playCurrentRound()` from `engine.ts` until the project is executed in a runtime/build environment and the V2 readiness/regression suite is demonstrably passing there.

This is a rollback safeguard only. It is not the normal official-match path.

## Closure decision

No new domain is selected by this document.

The project should remain paused at this boundary until the next product direction is deliberately chosen. Plausible next domains include clubs, competition structures, national teams, user-facing match presentation, database/save architecture, or another systems layer, but none is considered the automatic next step.

Any future decision to expand Match Engine anatomy should explicitly reopen this module rather than silently adding scope to it.
