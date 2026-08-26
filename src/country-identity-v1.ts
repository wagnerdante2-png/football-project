import 'flag-icons/css/flag-icons.min.css';
import { countryIso2 } from './country-code-v1';
export { countryIso2, canonicalCountryId, canonicalCountryIds, fifaToIso } from './country-code-v1';

export function countryFlagMarkup(country?:string,className='country-flag'){
  const iso=countryIso2(country);
  if(!iso)return `<span class="${className} country-flag-fallback" aria-hidden="true">◈</span>`;
  return `<span class="${className} fi fi-${iso}" role="img" aria-label="Bandeira de ${String(country??'').replace(/[&<>\"']/g,'')}"></span>`;
}
export function nationalTeamIdentityMarkup(input:{name:string;countryId?:string;countryName?:string},className='national-team-identity'){
  const country=input.countryName??input.countryId??input.name;
  return `<span class="${className}">${countryFlagMarkup(country,'national-team-flag')}<span>${input.name}</span></span>`;
}
