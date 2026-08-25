import 'flag-icons/css/flag-icons.min.css';

const norm=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const isoByName:Record<string,string>={
  brasil:'br',brazil:'br',argentina:'ar',uruguai:'uy',uruguay:'uy',paraguai:'py',paraguay:'py',chile:'cl',colombia:'co',equador:'ec',ecuador:'ec',peru:'pe',bolivia:'bo',venezuela:'ve',
  portugal:'pt',espanha:'es',spain:'es',franca:'fr',france:'fr',alemanha:'de',germany:'de',italia:'it',italy:'it',inglaterra:'gb-eng',england:'gb-eng',escocia:'gb-sct',scotland:'gb-sct','pais de gales':'gb-wls',wales:'gb-wls',irlanda:'ie',ireland:'ie','irlanda do norte':'gb-nir',
  holanda:'nl','paises baixos':'nl',netherlands:'nl',belgica:'be',belgium:'be',suica:'ch',switzerland:'ch',austria:'at',dinamarca:'dk',denmark:'dk',suecia:'se',sweden:'se',noruega:'no',norway:'no',finlandia:'fi',finland:'fi',islandia:'is',iceland:'is',
  polonia:'pl',poland:'pl',croacia:'hr',croatia:'hr',servia:'rs',serbia:'rs',eslovenia:'si',slovenia:'si',eslovaquia:'sk',slovakia:'sk','republica tcheca':'cz',czechia:'cz',romenia:'ro',romania:'ro',hungria:'hu',hungary:'hu',grecia:'gr',greece:'gr',turquia:'tr',turkey:'tr',ucrania:'ua',ukraine:'ua',russia:'ru',
  'estados unidos':'us','united states':'us',usa:'us',canada:'ca',mexico:'mx','costa rica':'cr',panama:'pa',jamaica:'jm',honduras:'hn',guatemala:'gt',haiti:'ht',cuba:'cu',
  japao:'jp',japan:'jp','coreia do sul':'kr','south korea':'kr',china:'cn',australia:'au','nova zelandia':'nz','new zealand':'nz','arabia saudita':'sa','saudi arabia':'sa',catar:'qa',qatar:'qa',ira:'ir',iran:'ir',iraque:'iq',iraq:'iq','emirados arabes unidos':'ae','united arab emirates':'ae',
  marrocos:'ma',morocco:'ma',argelia:'dz',algeria:'dz',tunisia:'tn',egito:'eg',egypt:'eg',senegal:'sn',gana:'gh',ghana:'gh',nigeria:'ng',camaroes:'cm',cameroon:'cm','costa do marfim':'ci','ivory coast':'ci',mali:'ml','africa do sul':'za','south africa':'za',
  'republica democratica do congo':'cd','democratic republic of the congo':'cd',congo:'cg',angola:'ao','cabo verde':'cv','cape verde':'cv',mocambique:'mz',mozambique:'mz'
};
const fifaToIso:Record<string,string>={BRA:'br',ARG:'ar',URU:'uy',PAR:'py',CHI:'cl',COL:'co',ECU:'ec',PER:'pe',BOL:'bo',VEN:'ve',POR:'pt',ESP:'es',FRA:'fr',GER:'de',ITA:'it',ENG:'gb-eng',SCO:'gb-sct',WAL:'gb-wls',NIR:'gb-nir',IRL:'ie',NED:'nl',BEL:'be',SUI:'ch',AUT:'at',DEN:'dk',SWE:'se',NOR:'no',FIN:'fi',ISL:'is',POL:'pl',CRO:'hr',SRB:'rs',SVN:'si',SVK:'sk',CZE:'cz',ROU:'ro',HUN:'hu',GRE:'gr',TUR:'tr',UKR:'ua',RUS:'ru',USA:'us',CAN:'ca',MEX:'mx',CRC:'cr',PAN:'pa',JAM:'jm',HON:'hn',GUA:'gt',HAI:'ht',CUB:'cu',JPN:'jp',KOR:'kr',CHN:'cn',AUS:'au',NZL:'nz',KSA:'sa',QAT:'qa',IRN:'ir',IRQ:'iq',UAE:'ae',MAR:'ma',ALG:'dz',TUN:'tn',EGY:'eg',SEN:'sn',GHA:'gh',NGA:'ng',CMR:'cm',CIV:'ci',MLI:'ml',RSA:'za',COD:'cd',CGO:'cg',ANG:'ao',CPV:'cv',MOZ:'mz'};

export function countryIso2(input?:string):string|undefined{
  if(!input)return;
  const raw=input.trim();
  const upper=raw.toUpperCase();
  if(fifaToIso[upper])return fifaToIso[upper];
  const n=norm(raw).replace(/^country /,'').replace(/^national team /,'');
  if(isoByName[n])return isoByName[n];
  const tail=n.split(/[-_:]/).at(-1)?.trim();
  return tail&&isoByName[tail]?isoByName[tail]:undefined;
}
export function countryFlagMarkup(country?:string,className='country-flag'){
  const iso=countryIso2(country);
  if(!iso)return `<span class="${className} country-flag-fallback" aria-hidden="true">◈</span>`;
  return `<span class="${className} fi fi-${iso}" role="img" aria-label="Bandeira de ${String(country??'').replace(/[&<>\"']/g,'')}"></span>`;
}
export function nationalTeamIdentityMarkup(input:{name:string;countryId?:string;countryName?:string},className='national-team-identity'){
  const country=input.countryName??input.countryId??input.name;
  return `<span class="${className}">${countryFlagMarkup(country,'national-team-flag')}<span>${input.name}</span></span>`;
}
