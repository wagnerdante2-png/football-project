import type { Club, World } from './engine';
import { dailyWeatherFor, registerCityProfile, seedBrazilFoundation, cityProfile, type DailyWeather } from './world-geography-climate-v2';
import type { MatchCoreState } from './match-core-v2';
import { setMatchEnvironment } from './match-environment-v2';

const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const cityRules:[RegExp,string][]=[
 [/sao paulo|palmeiras|corinthians|santos|bragantino/,'SAO'],
 [/flamengo|fluminense|vasco|botafogo/,'RIO'],
 [/cuiaba/,'CUI'],
 [/cruzeiro|atletico mineiro|america mineiro/,'BHZ'],
 [/gremio|internacional/,'POA'],
 [/bahia|vitoria/,'SSA'],
 [/fortaleza|ceara/,'FOR'],
 [/sport|nautico|santa cruz/,'REC'],
 [/athletico|coritiba/,'CWB'],
 [/goias|atletico goianiense/,'GYN'],
];
function seedExtraCities(world:World){seedBrazilFoundation(world);const add=(id:string,name:string,lat:number,lon:number,climate:'tropical'|'subtropical',elevation:number)=>{if(!cityProfile(world,id))registerCityProfile(world,{countryId:'BRA',countryName:'Brasil',continent:'South America',cityId:id,cityName:name,latitude:lat,longitude:lon,timezone:'America/Sao_Paulo',climate,elevation,population:0})};add('BHZ','Belo Horizonte',-19.9167,-43.9345,'tropical',852);add('POA','Porto Alegre',-30.0346,-51.2177,'subtropical',10);add('SSA','Salvador',-12.9777,-38.5016,'tropical',8);add('FOR','Fortaleza',-3.7319,-38.5267,'tropical',21);add('REC','Recife',-8.0476,-34.877,'tropical',10);add('CWB','Curitiba',-25.4284,-49.2733,'subtropical',934);add('GYN','Goiânia',-16.6869,-49.2648,'tropical',749)}
export function homeCityForClub(world:World,club:Club){seedExtraCities(world);const name=normalize(club.name);for(const [rx,id] of cityRules)if(rx.test(name))return id;return'SAO'}
export function matchWeatherFor(world:World,home:Club,date:string):DailyWeather{return dailyWeatherFor(world,homeCityForClub(world,home),date)}
export function applyWorldWeatherToMatch(world:World,state:MatchCoreState,home:Club,date:string){const w=matchWeatherFor(world,home,date);state.weather={temperature:w.temperature,rain:w.rain,wind:w.wind,windDirection:w.windDirection};state.pitch.condition=Math.max(45,Math.round(96-w.rain*.42));setMatchEnvironment(state,{weather:w.condition,moisture:w.pitchMoisture,temperature:w.temperature,humidity:w.humidity,wind:w.wind,windDirection:w.windDirection});return w}
