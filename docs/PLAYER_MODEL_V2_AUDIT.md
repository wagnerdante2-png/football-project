# Player Model V2 — Audit and Migration Plan

## Why this block exists

The original `Player` contract in `engine.ts` is intentionally small: identity, one position, age, current/potential ability, condition, morale and nine broad attributes. It was enough to bootstrap the rest of the game, but not enough for a living multi-decade football world.

The legacy `lifecycle.ts` already contains useful continuity mechanics — annual aging, development, retirement and youth intake — but they are mostly scalar/probabilistic and use `Math.random()`. They should be migrated, not deleted abruptly.

## Public-repository findings

The audit compared the current project with public football-manager/simulation projects, especially OpenFootManager and FCManager.

Useful patterns observed:

- player data should be rich and data-driven rather than a single overall number;
- hidden traits such as consistency, big-match tendency, ambition, loyalty and injury proneness create long-term differentiation;
- development should depend on game time, facilities/coaching, age and hidden personality;
- youth generation needs nationality-aware identity and hidden potential uncertainty;
- peak/decline curves differ by position and attribute domain;
- national-team pools require stable nationality/eligibility data;
- retirement should preserve career history and feed Hall-of-Fame/staff-transition systems;
- saves must preserve evolving player identity instead of regenerating hidden traits on load.

## New V2 modules

### `player-profile-v2.ts`
Persistent identity layer without breaking the existing `Player` interface.

Contains:
- birth date and birthplace;
- nationality/citizenship;
- national-team eligibility and cap-tie state;
- height/weight/body type;
- preferred foot and weak-foot quality;
- hidden traits;
- non-deterministic potential envelope (floor/projection/ceiling/certainty);
- late-bloomer and volatility values;
- positional familiarity;
- retirement state and interest in a staff career.

### `player-development-v2.ts`
Development is split into physical, technical, mental and goalkeeper domains.

Inputs include:
- age/position curve;
- minutes played;
- training/facilities/coaching quality;
- professionalism and ambition;
- injury burden;
- current distance from potential;
- player-specific deterministic volatility.

The model explicitly allows different curves: physical decline may start while mental development continues.

### `player-generation-v2.ts`
Deterministic living-world youth generation.

The same world seed + club + season + serial produces the same prospect, which is important for debugging and save integrity. Rarity tiers are descriptive only; the actual player is still controlled by attributes and potential envelope.

### `player-lifecycle-v2.ts`
Retirement now considers age, position, recent use, ability, condition, ambition, professionalism and physical risk. Retired players are preserved as records and can later become staff candidates.

### `player-model-diagnostics-v2.ts`
Checks profile completeness, bounded traits, coherent potential envelopes, deterministic development, deterministic youth generation, retirement probabilities and snapshot/restore.

## Save schema

World foundation schema version 3 persists player profiles and player lifecycle records. Hidden traits and identity must never be silently re-rolled after loading a save.

## Migration policy

Do not delete the legacy `lifecycle.ts` aging/development/youth/retirement functions immediately.

Migration order:

1. Run Player Model V2 diagnostics against the current world.
2. Route new youth intake through `player-generation-v2.ts` while preserving existing intake records.
3. Route seasonal player development through `player-development-v2.ts`.
4. Route retirement through `player-lifecycle-v2.ts`.
5. Compare multiple simulated seasons for population stability and ability distribution.
6. Only then deprecate the legacy scalar lifecycle functions.

## Still deliberately deferred

These depend on later World/Club/Competition data and should not be hardcoded now:

- real country/name pools beyond the initial Brazilian fallback;
- parent/grandparent birthplace generation;
- residency clocks and naturalisation law per country;
- registration/homegrown rules;
- academy catchment geography;
- club-specific youth facilities and academy reputation;
- formal national-team cap-tie rules by era;
- player contracts and transfer value as part of the richer profile;
- Hall of Fame thresholds and retired-player staff jobs.

The Player Model V2 should become the authoritative identity/lifecycle layer, while `engine.Player` remains a compatibility projection until the rest of the world model is migrated.
