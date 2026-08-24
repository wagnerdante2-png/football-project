import './styles.css';
import { createWorld, playCurrentRound, playerById, selectStartingEleven, sortedStandings, teamStrength, type Fixture, type World } from './engine';

let world: World = createWorld();
let selectedClubId = world.clubs[0].id;
let selectedFixture: Fixture | null = null;
let activeView: 'overview' | 'squad' | 'match' = 'overview';

const app = document.querySelector<HTMLDivElement>('#app')!;

function clubName(id: string) { return world.clubs.find(c => c.id === id)?.name ?? id; }
function navButton(label: string, view: 'overview' | 'squad') { return `<button class="nav ${activeView === view ? 'active' : ''}" data-view="${view}">${label}</button>`; }

function renderOverview() {
  const currentRound = world.fixtures.filter(f => f.round === world.round);
  const lastRound = world.fixtures.filter(f => f.round === world.round - 1 && f.played);
  const table = sortedStandings(world);
  const totalPlayers = world.clubs.reduce((sum, club) => sum + club.players.length, 0);
  return `
    <header><div><span class="eyebrow">TEMPORADA ${world.season}</span><h1>Centro do Manager</h1><p>As partidas agora são construídas evento a evento: posse, finalizações, defesas, gols, cartões e substituições.</p></div>
    <div class="actions"><button id="reset" class="secondary">Reiniciar</button><button id="advance" class="primary" ${currentRound.length ? '' : 'disabled'}>${currentRound.length ? `Simular rodada ${world.round}` : 'Temporada concluída'}</button></div></header>
    <section class="cards">
      <article class="card metric"><span>Clubes ativos</span><strong>${world.clubs.length}</strong></article>
      <article class="card metric"><span>Jogadores</span><strong>${totalPlayers}</strong></article>
      <article class="card metric"><span>Jogos realizados</span><strong>${world.fixtures.filter(f => f.played).length}</strong></article>
      <article class="card metric"><span>Líder</span><strong>${table[0] ? clubName(table[0].clubId) : '—'}</strong></article>
    </section>
    <div class="grid">
      <section class="card standings"><div class="section-title"><h2>Classificação</h2><span>Pontos corridos · ida e volta</span></div>
      <table><thead><tr><th>#</th><th>Clube</th><th>J</th><th>V</th><th>E</th><th>D</th><th>SG</th><th>Pts</th></tr></thead><tbody>${table.map((row,index)=>`<tr><td>${index+1}</td><td><button class="club-link" data-club="${row.clubId}">${clubName(row.clubId)}</button></td><td>${row.played}</td><td>${row.wins}</td><td>${row.draws}</td><td>${row.losses}</td><td>${row.gf-row.ga}</td><td><b>${row.points}</b></td></tr>`).join('')}</tbody></table></section>
      <section class="stack">
        <article class="card fixtures"><div class="section-title"><h2>Próxima rodada</h2><span>Rodada ${world.round}</span></div>${currentRound.length ? currentRound.map(f=>`<div class="fixture"><span>${clubName(f.home)}</span><b>×</b><span>${clubName(f.away)}</span></div>`).join('') : '<p>Temporada concluída.</p>'}</article>
        <article class="card fixtures"><div class="section-title"><h2>Últimos resultados</h2><span>${lastRound.length ? `Rodada ${world.round-1}` : 'Nenhum jogo ainda'}</span></div>${lastRound.length ? lastRound.map((f,index)=>`<button class="fixture result match-link" data-match="${index}"><span>${clubName(f.home)}</span><b>${f.homeGoals}–${f.awayGoals}</b><span>${clubName(f.away)}</span><small>xG ${f.homeXg} · ${f.awayXg}</small></button>`).join('') : '<p>Simule a primeira rodada.</p>'}</article>
      </section>
    </div>`;
}

function renderSquad() {
  const club = world.clubs.find(c => c.id === selectedClubId) ?? world.clubs[0];
  const xi = selectStartingEleven(club); const starterIds = new Set(xi.map(p => p.id)); const strength = teamStrength(club);
  const avgAge = club.players.reduce((s,p)=>s+p.age,0)/club.players.length; const avgCondition = club.players.reduce((s,p)=>s+p.condition,0)/club.players.length;
  return `
    <header><div><span class="eyebrow">ELENCO · ${club.name.toUpperCase()}</span><h1>${club.name}</h1><p>24 jogadores. O onze inicial é escolhido automaticamente por função, atributos, condição e moral.</p></div><select id="club-select">${world.clubs.map(c=>`<option value="${c.id}" ${c.id===club.id?'selected':''}>${c.name}</option>`).join('')}</select></header>
    <section class="cards"><article class="card metric"><span>Força geral</span><strong>${strength.overall.toFixed(1)}</strong></article><article class="card metric"><span>Média de idade</span><strong>${avgAge.toFixed(1)}</strong></article><article class="card metric"><span>Condição média</span><strong>${avgCondition.toFixed(0)}%</strong></article><article class="card metric"><span>Reputação</span><strong>${club.reputation}</strong></article></section>
    <div class="squad-grid"><section class="card"><div class="section-title"><h2>Onze inicial automático</h2><span>4-2-3-1 base</span></div><div class="strength-strip"><span>Ataque <b>${strength.attack.toFixed(0)}</b></span><span>Meio <b>${strength.midfield.toFixed(0)}</b></span><span>Defesa <b>${strength.defense.toFixed(0)}</b></span><span>Goleiro <b>${strength.goalkeeper.toFixed(0)}</b></span></div><div class="xi-list">${xi.map((p,index)=>`<div><span class="shirt">${index+1}</span><b>${p.position}</b><span>${p.name}</span><small>CA ${p.currentAbility} · Cond. ${p.condition}%</small></div>`).join('')}</div></section>
    <section class="card squad-table"><div class="section-title"><h2>Plantel completo</h2><span>CA = habilidade atual · PA = potencial</span></div><table><thead><tr><th></th><th>Jogador</th><th>Pos</th><th>Idade</th><th>CA</th><th>PA</th><th>Cond.</th><th>Moral</th></tr></thead><tbody>${[...club.players].sort((a,b)=>b.currentAbility-a.currentAbility).map(p=>`<tr class="${starterIds.has(p.id)?'starter':''}"><td>${starterIds.has(p.id)?'●':''}</td><td>${p.name}</td><td>${p.position}</td><td>${p.age}</td><td><b>${p.currentAbility}</b></td><td>${p.potentialAbility}</td><td>${p.condition}%</td><td>${p.morale}</td></tr>`).join('')}</tbody></table></section></div>`;
}

function renderMatch() {
  const f = selectedFixture;
  if (!f || !f.played || !f.stats || !f.events) return `<header><div><h1>Central da Partida</h1><p>Nenhuma partida selecionada.</p></div></header>`;
  const s = f.stats;
  const important = f.events.filter(e => ['goal','yellow','substitution','fulltime'].includes(e.type));
  const eventIcon = (type: string) => type === 'goal' ? '⚽' : type === 'yellow' ? '🟨' : type === 'substitution' ? '↔' : '■';
  return `
    <header><div><span class="eyebrow">RODADA ${f.round} · CENTRAL DA PARTIDA</span><h1>${clubName(f.home)} ${f.homeGoals}–${f.awayGoals} ${clubName(f.away)}</h1><p>xG ${f.homeXg} – ${f.awayXg}</p></div><button id="back-overview" class="secondary">Voltar</button></header>
    <section class="score-hero card"><div><strong>${clubName(f.home)}</strong><span>${f.homeGoals}</span></div><div class="score-meta"><b>ENCERRADO</b><small>xG ${f.homeXg} · ${f.awayXg}</small></div><div><span>${f.awayGoals}</span><strong>${clubName(f.away)}</strong></div></section>
    <div class="match-grid">
      <section class="card"><div class="section-title"><h2>Estatísticas</h2><span>90 minutos</span></div><div class="stats-list">
        <div><span>${s.possessionHome}%</span><b>Posse</b><span>${s.possessionAway}%</span></div>
        <div><span>${s.shotsHome}</span><b>Finalizações</b><span>${s.shotsAway}</span></div>
        <div><span>${s.shotsOnTargetHome}</span><b>No alvo</b><span>${s.shotsOnTargetAway}</span></div>
        <div><span>${s.passesHome}</span><b>Passes</b><span>${s.passesAway}</span></div>
        <div><span>${s.yellowHome}</span><b>Amarelos</b><span>${s.yellowAway}</span></div>
        <div><span>${f.homeXg}</span><b>xG</b><span>${f.awayXg}</span></div>
      </div></section>
      <section class="card"><div class="section-title"><h2>Linha do tempo</h2><span>${f.events.length} eventos simulados</span></div><div class="timeline">${important.map(e=>{ const p=playerById(world,e.playerId); return `<div class="timeline-event ${e.type}"><span class="minute">${e.minute}'</span><span class="event-icon">${eventIcon(e.type)}</span><div><b>${e.text}</b>${p ? `<small>${p.position} · CA ${p.currentAbility}</small>` : ''}</div></div>`; }).join('')}</div></section>
    </div>
    <section class="card all-events"><div class="section-title"><h2>Log completo do motor</h2><span>Finalizações e defesas incluídas</span></div><div class="event-log">${f.events.map(e=>`<div><span>${e.minute}'</span><b>${e.type.toUpperCase()}</b><p>${e.text}${e.xg ? ` · xG ${e.xg}` : ''}</p></div>`).join('')}</div></section>`;
}

function render() {
  app.innerHTML = `<div class="shell"><aside class="sidebar"><div class="brand">FP</div><div class="game-name">Football Project</div><nav>${navButton('Visão Geral','overview')}${navButton('Elenco','squad')}<button class="nav disabled">Táticas</button><button class="nav disabled">Competições</button><button class="nav disabled">Mercado</button><button class="nav disabled">Finanças</button></nav></aside><main>${activeView==='overview'?renderOverview():activeView==='squad'?renderSquad():renderMatch()}</main></div>`;
  document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(btn=>btn.addEventListener('click',()=>{activeView=btn.dataset.view as 'overview'|'squad';render();}));
  document.querySelectorAll<HTMLButtonElement>('.club-link').forEach(btn=>btn.addEventListener('click',()=>{selectedClubId=btn.dataset.club??selectedClubId;activeView='squad';render();}));
  document.querySelector<HTMLSelectElement>('#club-select')?.addEventListener('change',e=>{selectedClubId=(e.target as HTMLSelectElement).value;render();});
  document.querySelector<HTMLButtonElement>('#advance')?.addEventListener('click',()=>{playCurrentRound(world);render();});
  document.querySelector<HTMLButtonElement>('#reset')?.addEventListener('click',()=>{world=createWorld();selectedClubId=world.clubs[0].id;selectedFixture=null;activeView='overview';render();});
  const lastRound = world.fixtures.filter(f=>f.round===world.round-1&&f.played);
  document.querySelectorAll<HTMLButtonElement>('.match-link').forEach(btn=>btn.addEventListener('click',()=>{selectedFixture=lastRound[Number(btn.dataset.match)];activeView='match';render();}));
  document.querySelector<HTMLButtonElement>('#back-overview')?.addEventListener('click',()=>{activeView='overview';render();});
}
render();
