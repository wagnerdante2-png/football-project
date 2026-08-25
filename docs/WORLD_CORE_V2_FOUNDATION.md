# World Core V2 — Foundation

## Purpose

World Core is the authoritative foundation for long-running saves. It exists before detailed clubs, players, competitions and national teams so those domains share the same concepts of date, geography, climate, random streams, event ordering and save versioning.

## Implemented foundation

### Time and cadence
- authoritative ISO world date;
- season and day index;
- daily / weekly / monthly / yearly cadence detection;
- deterministic event ordering.

### Deterministic RNG streams
Independent named streams exist for world, players, transfers, matches, media, human life, finance, weather, youth and competitions. Stable-key random values can be reproduced without consuming mutable stream state.

### Geography
Country and city registries provide continent, coordinates, timezone, climate, elevation and population. The first Brazil foundation cities are only seed data for diagnostics and are not intended to be the final database.

### Climate
Each city owns monthly climate normals. Daily weather is generated deterministically from world seed + city + date, producing temperature, rain, humidity, wind, condition and pitch moisture. This can later feed match environment, travel, training and calendar decisions.

### Scheduled events
The scheduler supports one-off and recurring world events with daily, weekly, monthly and yearly recurrence, optional end date and remaining occurrence count. Events are emitted into the ordered World Core event ledger.

### Save schema
`world-save-schema-v2.ts` provides a versioned foundation snapshot covering World Core state, geography and scheduled events. Save migration is explicit and rejects saves created by a newer unsupported schema.

### Diagnostics
`world-core-diagnostics-v2.ts` checks deterministic stable-key RNG, event queue behavior, cadences, World Core snapshot restoration, deterministic daily weather, recurring scheduling, save validation and save round-trip.

## Architecture rule

Domain systems must not invent their own date, country, city, weather seed or save version. Players, clubs, competitions and national teams should reference World Core identities and services.

## Deliberately not implemented yet

This foundation does not yet define full football associations, club databases, competition structures, player identity/citizenship or the final global city/country dataset. Those are separate domain layers and should attach to World Core rather than expand it indiscriminately.

## Recommended next audit

Before creating thousands of clubs or competitions, audit and strengthen the Player domain: identity, birth data, citizenship and eligibility, anthropometrics, dominant/weak foot, hidden personality and consistency, dynamic potential, age curves, positional development, youth generation, retirement and post-playing transitions.
