# Match AI Research V2

## Public references studied

### DeltaBitsSystem/FootballEngine
Useful decomposition:
- player perception separated from decision and action;
- influence maps / spatial control;
- independent ball physics and contact resolution;
- manager agent and substitution intelligence;
- referee systems, advantage, handball and VAR;
- team orchestration and adaptive loops.

### helios-base/helios-base (RoboCup 2D)
Useful ideas adapted conceptually, not copied line-for-line:
- basic movement first compares interception times of self, teammate and opponent, then either attacks the ball or returns to strategic position;
- explicit scan/neck behavior demonstrates that perception should be incomplete rather than omniscient;
- action-chain planner generates candidates and searches several actions ahead using best-first search, with hard limits to keep computation bounded;
- field evaluation values progress, proximity to goal and shootable states rather than choosing the locally easiest action;
- planner separates direct pass, strict pass, self-pass, dribble, cross and shot generation;
- goalkeeper behavior predicts the future ball location and adjusts depth/angle rather than staying on a fixed line;
- set plays have dedicated behavior rather than being treated as generic open play.

## Architecture adopted in Football Project

### Bounded rationality
Players do not choose a deterministic globally-optimal action. Decision quality is affected by:
- Decisions attribute;
- morale;
- fatigue;
- body orientation and visible teammates;
- tactical mentality and risk appetite;
- game state (score/minute);
- pressure and territorial control;
- transition context;
- role.

The engine adds controlled cognitive noise. Better decision-makers have lower noise.

### Utility action candidates
On-ball candidates include:
- short pass;
- progressive pass;
- through ball;
- switch of play;
- long ball;
- cross;
- carry;
- dribble;
- shot;
- hold;
- clear.

Each candidate receives utility from spatial progress, pass-lane risk, receiver pressure, goal proximity, tactical risk appetite, attributes and a shallow future-state evaluation.

### Off-ball candidates
- preserve shape;
- support;
- press;
- cover;
- attack space;
- intercept;
- receive predicted loose ball.

Role movement and decision movement are blended so the player remains tactically recognisable while reacting to the local game state.

### Physical execution is separate from choice
A good decision can still fail. A bad decision can occasionally work.
Decision -> execution quality -> ball physics -> interception race -> next state.

### Goalkeepers
Goalkeeper positioning is angle- and trajectory-aware. The goalkeeper can:
- hold the line;
- set to a predicted shot trajectory;
- close the angle;
- claim a cross;
- sweep behind the defensive line;
- recover position.

### Decision trace
The engine stores recent candidate utilities and chosen decisions for diagnostics. This is essential for balancing: unrealistic football should be explainable from the decision trace rather than tuned blindly.

## Next realism targets
1. first touch and receiving orientation;
2. aerial duels and headers;
3. goalkeeper save animation state / rebounds / parries;
4. multi-action lookahead depth 2-4 for high-Decisions players only;
5. team tactical memory: detect opponent patterns and adapt;
6. coordinated pressing triggers and cover shadows;
7. marking assignments / zonal references;
8. dedicated restarts and rehearsed set-piece routines;
9. referee positioning and line officials;
10. calibration over thousands of simulated matches.
