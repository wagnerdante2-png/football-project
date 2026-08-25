import type { Player, Position, World } from './engine';
import { detailedAttribute, effectiveAbilityAtPosition, positionFamiliarity, type DetailedPlayerAttributes } from './player-technical-profile-v2';

export type TacticalRole='goalkeeper'|'sweeperKeeper'|'fullback'|'wingback'|'centralDefender'|'ballPlayingDefender'|'stopper'|'anchor'|'deepLyingPlaymaker'|'ballWinningMidfielder'|'centralMidfielder'|'boxToBox'|'advancedPlaymaker'|'attackingMidfielder'|'shadowStriker'|'winger'|'insideForward'|'widePlaymaker'|'advancedForward'|'targetForward'|'falseNine';
export type RoleEvaluation={role:TacticalRole;position:Position;score:number;familiarity:number;effectiveAbility:number;strengths:{attribute:keyof DetailedPlayerAttributes;value:number}[];weaknesses:{attribute:keyof DetailedPlayerAttributes;value:number}[]};
type Weight=Partial<Record<keyof DetailedPlayerAttributes,number>>;
const roleWeights:Record<TacticalRole,Weight>={
goalkeeper:{goalkeeperReflexes:.24,goalkeeperHandling:.2,goalkeeperAerial:.16,goalkeeperOneOnOne:.15,goalkeeperCommunication:.1,concentration:.08,decisions:.07},
sweeperKeeper:{goalkeeperReflexes:.17,goalkeeperOneOnOne:.14,goalkeeperKicking:.16,shortPassing:.13,firstTouch:.09,anticipation:.11,decisions:.1,composure:.1},
fullback:{standingTackle:.16,marking:.12,interceptions:.11,stamina:.16,sprintSpeed:.12,crossing:.11,shortPassing:.08,decisions:.08,workRate:.06},
wingback:{sprintSpeed:.16,acceleration:.12,workRate:.13,crossing:.15,dribbling:.1,firstTouch:.07,shortPassing:.08,offBall:.09,standingTackle:.1},
centralDefender:{marking:.17,interceptions:.16,standingTackle:.15,heading:.13,strength:.11,jumping:.08,anticipation:.08,concentration:.07,decisions:.05},
ballPlayingDefender:{marking:.12,interceptions:.12,standingTackle:.12,heading:.08,shortPassing:.14,longPassing:.13,firstTouch:.09,vision:.08,composure:.07,decisions:.05},
stopper:{standingTackle:.19,slidingTackle:.12,aggression:.1,strength:.13,heading:.11,marking:.11,anticipation:.09,bravery:.08,concentration:.07},
anchor:{interceptions:.16,marking:.12,standingTackle:.13,positioning:.11,anticipation:.1,decisions:.1,concentration:.09,shortPassing:.08,strength:.06,teamwork:.05},
deepLyingPlaymaker:{shortPassing:.17,longPassing:.17,vision:.16,firstTouch:.11,technique:.1,decisions:.11,composure:.08,anticipation:.06,teamwork:.04},
ballWinningMidfielder:{standingTackle:.18,interceptions:.16,workRate:.14,aggression:.09,strength:.1,anticipation:.1,decisions:.08,shortPassing:.07,teamwork:.08},
centralMidfielder:{shortPassing:.16,firstTouch:.12,vision:.12,decisions:.12,workRate:.11,technique:.1,anticipation:.09,teamwork:.09,offBall:.05,interceptions:.04},
boxToBox:{workRate:.14,stamina:.13,sprintSpeed:.08,shortPassing:.1,offBall:.1,interceptions:.09,standingTackle:.08,finishing:.07,longShots:.07,teamwork:.14},
advancedPlaymaker:{vision:.18,shortPassing:.16,firstTouch:.14,technique:.13,dribbling:.09,decisions:.12,composure:.08,offBall:.05,longPassing:.05},
attackingMidfielder:{firstTouch:.13,dribbling:.12,vision:.14,shortPassing:.12,finishing:.11,longShots:.08,offBall:.11,decisions:.1,composure:.09},
shadowStriker:{finishing:.18,offBall:.17,acceleration:.11,sprintSpeed:.09,firstTouch:.1,composure:.1,anticipation:.1,longShots:.07,decisions:.08},
winger:{acceleration:.15,sprintSpeed:.15,dribbling:.15,crossing:.15,firstTouch:.1,offBall:.09,technique:.08,decisions:.07,workRate:.06},
insideForward:{acceleration:.13,sprintSpeed:.12,dribbling:.15,finishing:.16,offBall:.13,firstTouch:.1,technique:.08,composure:.07,decisions:.06},
widePlaymaker:{vision:.17,shortPassing:.15,firstTouch:.14,technique:.13,dribbling:.1,longPassing:.08,decisions:.1,composure:.07,crossing:.06},
advancedForward:{finishing:.19,offBall:.17,acceleration:.12,sprintSpeed:.1,firstTouch:.1,composure:.1,anticipation:.09,heading:.05,decisions:.08},
targetForward:{strength:.16,heading:.16,jumping:.11,firstTouch:.13,offBall:.11,finishing:.11,teamwork:.08,bravery:.08,composure:.06},
falseNine:{firstTouch:.15,shortPassing:.15,vision:.14,technique:.13,dribbling:.1,decisions:.11,offBall:.08,composure:.08,finishing:.06}
};
const rolePositions:Record<TacticalRole,Position[]>={goalkeeper:['GK'],sweeperKeeper:['GK'],fullback:['RB','LB'],wingback:['RB','LB'],centralDefender:['CB'],ballPlayingDefender:['CB'],stopper:['CB'],anchor:['DM'],deepLyingPlaymaker:['DM','CM'],ballWinningMidfielder:['DM','CM'],centralMidfielder:['CM'],boxToBox:['CM'],advancedPlaymaker:['CM','AM'],attackingMidfielder:['AM'],shadowStriker:['AM'],winger:['RW','LW'],insideForward:['RW','LW'],widePlaymaker:['RW','LW'],advancedForward:['ST'],targetForward:['ST'],falseNine:['ST']};
function attr(world:World,p:Player,k:keyof DetailedPlayerAttributes){return detailedAttribute(world,p.id,k,k==='stamina'?p.attributes.stamina:k==='positioning'?p.attributes.positioning:50)}
export function evaluateRole(world:World,p:Player,role:TacticalRole,position?:Position):RoleEvaluation{const pos=position??rolePositions[role][0],weights=roleWeights[role],parts=Object.entries(weights) as [keyof DetailedPlayerAttributes,number][],weighted=parts.reduce((s,[k,w])=>s+attr(world,p,k)*w,0),weightTotal=parts.reduce((s,[,w])=>s+w,0)||1,fam=positionFamiliarity(world,p.id,pos),effective=effectiveAbilityAtPosition(world,p,pos),base=weighted/weightTotal,famFactor=.62+fam*.0038,abilityFactor=.82+effective/500,score=Math.max(1,Math.min(99,base*famFactor*abilityFactor)),values=parts.map(([attribute])=>({attribute,value:attr(world,p,attribute)})).sort((a,b)=>b.value-a.value);return{role,position:pos,score:Number(score.toFixed(1)),familiarity:fam,effectiveAbility:effective,strengths:values.slice(0,3),weaknesses:[...values].reverse().slice(0,3)}}
export function bestRoles(world:World,p:Player,limit=5){const evaluations=(Object.keys(roleWeights) as TacticalRole[]).flatMap(role=>rolePositions[role].map(pos=>evaluateRole(world,p,role,pos)));return evaluations.sort((a,b)=>b.score-a.score).slice(0,limit)}
