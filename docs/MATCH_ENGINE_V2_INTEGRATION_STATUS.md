# Match Engine V2 — Integration Status

## Status

The Match Engine V2 is now the primary simulation path used by the daily world calendar through `playCurrentRoundWithMedical()` -> `playCurrentRoundV2()`.

The legacy event simulator remains in `engine.ts` only as a compatibility fallback and must not be treated as the authoritative official-match engine.

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

## Mandatory readiness gates

The V2 is only considered release-ready when all gates pass simultaneously:

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

Do not delete `simulateMatch()` / `playCurrentRound()` from `engine.ts` until the readiness suite is demonstrably passing in a runtime/build environment. They are retained solely as rollback/fallback during migration.

Once V2 passes all gates under repeated regression runs, the legacy path can be marked deprecated and later removed.

## Next development block

After runtime validation of this integration, the next major domain is world structure rather than more match anatomy:

1. Clubs and club identity/data model.
2. National teams and eligibility/call-ups.
3. Competition framework, rules, calendars, qualification, promotion/relegation and continental/international tournaments.

The Match Engine should remain extensible for competition-specific rules rather than embedding competition logic directly into the match simulation.
