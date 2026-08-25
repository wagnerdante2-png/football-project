# World Football Data Layer V1

## Goal

Build a large, data-driven football universe without hardcoding thousands of clubs, competitions, stadiums and historical records in TypeScript.

The World Football Data Layer sits between public football datasets and the simulation domains. It normalizes source records into stable canonical entities used by clubs, national teams, competitions, calendars, history and saves.

## Primary public source

OpenFootball repositories are the first validated upstream source. The `openfootball/leagues` and `openfootball/clubs` repositories expose their database content under CC0 1.0. Source provenance is stored on every imported record.

Important: CC0 applies to the database content supplied by the source. It does not waive third-party trademark, logo or publicity rights. Logos and other protected visual assets must use separately-cleared sources or remain outside the imported dataset.

## Canonical entities

`world-football-data-v1.ts` defines:

- confederations;
- national associations/federations;
- countries/national teams;
- clubs;
- stadiums;
- competitions/divisions/cups/qualifiers;
- promotion and relegation rules;
- qualification rules;
- historical memberships;
- historical matches;
- titles.

Names are not IDs. Every entity has a canonical stable ID and aliases. This allows `Palmeiras`, `SE Palmeiras` and `Sociedade Esportiva Palmeiras` to resolve to the same club.

## Historical cutover

The database has a `cutoverDate`.

Before the cutover, records can originate from historical datasets. After the cutover, competition results, titles, promotions, relegations and records are written by the simulation itself.

The intended model is:

`real/imported football history -> NEW GAME DATE -> simulated football history`

rather than maintaining separate history systems.

## Import pipeline

`openfootball-importer-v1.ts` parses OpenFootball league, club and stadium text formats. It keeps provenance, aliases, founding years, ceased clubs, capacities and commercial stadium names where available.

`world-football-source-catalog-v1.ts` contains validated source paths. It starts with Brazil, England, Germany and international/continental league files and is designed to expand without changing the domain model.

`scripts/sync-openfootball-data.mjs` downloads validated CC0 files into `data/openfootball/` and writes a synchronization manifest. The game should consume normalized data rather than reaching GitHub during normal gameplay.

## Competition rules

Imported competition identity and structure are source data. Detailed regulation is a second normalization layer because rules vary by season and country.

Do not assume a universal `top N promoted / bottom N relegated` rule. `CompetitionRules` supports automatic slots, playoffs, registration restrictions, qualification slots and ordered tie-breakers.

## Current state

Implemented:

- canonical football database schema;
- aliases and canonical resolution;
- provenance and source confidence;
- historical/simulated cutover;
- league parser;
- club parser;
- stadium parser;
- domestic pyramid linking;
- FIFA/confederation/CBF foundation;
- Brazil senior national team foundation;
- save schema V6 persistence;
- diagnostics;
- CC0 source sync script.

Next data-layer tasks should focus on breadth rather than inventing entities manually: expand the source catalog, ingest historical seasons/matches/titles, then map current competition membership and season-specific regulations.
