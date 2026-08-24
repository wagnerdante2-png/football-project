import './styles.css';
import { createWorld, playCurrentRound, sortedStandings, type World } from './engine';

let world: World = createWorld();

const app = document.querySelector<HTMLDivElement>('#app')!;

function clubName(id: string) {
  return world.clubs.find((club) => club.id === id)?.name ?? id;
}

function render() {
  const currentRound = world.fixtures.filter((fixture) => fixture.round === world.round);
  const lastRound = world.fixtures.filter((fixture) => fixture.round === world.round - 1 && fixture.played);
  const table = sortedStandings(world);

  app.innerHTML = `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand">FP</div>
        <div class="game-name">Football Project</div>
        <nav>
          <button class="nav active">Visão Geral</button>
          <button class="nav">Elenco</button>
          <button class="nav">Táticas</button>
          <button class="nav">Competições</button>
          <button class="nav">Mercado</button>
          <button class="nav">Finanças</button>
        </nav>
      </aside>
      <main>
        <header>
          <div>
            <span class="eyebrow">TEMPORADA ${world.season}</span>
            <h1>Centro do Manager</h1>
            <p>Primeiro núcleo jogável: mundo, calendário, partidas e classificação.</p>
          </div>
          <div class="actions">
            <button id="reset" class="secondary">Reiniciar</button>
            <button id="advance" class="primary">Simular rodada ${world.round}</button>
          </div>
        </header>

        <section class="cards">
          <article class="card metric"><span>Clubes ativos</span><strong>${world.clubs.length}</strong></article>
          <article class="card metric"><span>Rodada atual</span><strong>${world.round}</strong></article>
          <article class="card metric"><span>Jogos realizados</span><strong>${world.fixtures.filter(f => f.played).length}</strong></article>
          <article class="card metric"><span>Líder</span><strong>${table[0] ? clubName(table[0].clubId) : '—'}</strong></article>
        </section>

        <div class="grid">
          <section class="card standings">
            <div class="section-title"><h2>Classificação</h2><span>Pontos corridos · ida e volta</span></div>
            <table>
              <thead><tr><th>#</th><th>Clube</th><th>J</th><th>V</th><th>E</th><th>D</th><th>SG</th><th>Pts</th></tr></thead>
              <tbody>
                ${table.map((row, index) => `<tr><td>${index + 1}</td><td>${clubName(row.clubId)}</td><td>${row.played}</td><td>${row.wins}</td><td>${row.draws}</td><td>${row.losses}</td><td>${row.gf - row.ga}</td><td><b>${row.points}</b></td></tr>`).join('')}
              </tbody>
            </table>
          </section>

          <section class="stack">
            <article class="card fixtures">
              <div class="section-title"><h2>Próxima rodada</h2><span>Rodada ${world.round}</span></div>
              ${currentRound.length ? currentRound.map(f => `<div class="fixture"><span>${clubName(f.home)}</span><b>×</b><span>${clubName(f.away)}</span></div>`).join('') : '<p>Temporada concluída.</p>'}
            </article>
            <article class="card fixtures">
              <div class="section-title"><h2>Últimos resultados</h2><span>${lastRound.length ? `Rodada ${world.round - 1}` : 'Nenhum jogo ainda'}</span></div>
              ${lastRound.length ? lastRound.map(f => `<div class="fixture"><span>${clubName(f.home)}</span><b>${f.homeGoals}–${f.awayGoals}</b><span>${clubName(f.away)}</span></div>`).join('') : '<p>Simule a primeira rodada.</p>'}
            </article>
          </section>
        </div>
      </main>
    </div>`;

  document.querySelector<HTMLButtonElement>('#advance')?.addEventListener('click', () => {
    playCurrentRound(world);
    render();
  });
  document.querySelector<HTMLButtonElement>('#reset')?.addEventListener('click', () => {
    world = createWorld();
    render();
  });
}

render();
