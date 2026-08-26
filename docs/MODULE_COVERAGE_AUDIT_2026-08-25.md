# Auditoria de cobertura de módulos — 2026-08-25

## Resultado automático

A varredura estática percorreu todos os módulos TypeScript em `src/`, construiu o grafo de imports a partir dos entrypoints realmente carregados por `index.html` e cruzou o resultado com o CI/E2E.

- Módulos TypeScript em `src`: **273**
- Entrypoints ativos carregados pela aplicação: **16**
- Módulos alcançáveis pela aplicação ativa: **165**
- Módulos não alcançáveis pela aplicação ativa: **108**
- Raízes não alcançáveis sem importadores: **59**
- Candidatos de domínio/engine fora do grafo ativo: **83**
- Candidatos claros de UI/legado fora do grafo ativo: **13**

O CI permaneceu verde após a auditoria, incluindo build, smoke de avanço diário e E2E de estresse. Portanto os módulos fora do grafo não são automaticamente bugs; vários são diagnósticos, suites de regressão, implementações antigas ou ferramentas de bootstrap. Porém existem blocos funcionais que precisam ser classificados e, em alguns casos, integrados antes de afirmar cobertura total.

## Confirmados como ativos/reachables

Entre os sistemas alcançáveis estão: mundo diário, World Core V2, calendário, partidas domésticas, runtime continental, seleções/ranking, convocação e janelas internacionais, manager character, criação do treinador, emprego, mercado de treinadores V2, entrevistas, evolução do treinador, vida humana/social, vestiário, treino, medicina/lesões, scouting, negociação, economia, recrutamento/governança, staff, player model V2, geração V3, potencial, integridade de roster, importação real de jogador/staff, Football School V1, finanças pessoais, Sport News, press room, analytics, match engine V2 principal, save Foundation e UIs canônicas da beta.

## Legado/diagnóstico que não deve ser conectado ao runtime automaticamente

Exemplos claros:

- `game-ui-v1.ts`
- `main.ts`
- `player-profile-ui-v1.ts`
- `transfer-beta-ui-v1.ts`
- `visual-bootstrap-v1.ts`
- `staff-ui.ts`
- `inbox-workspace-v2.ts`
- `manager-job-market.ts` (substituído por V2)
- `manager-creation-preview.ts` / `manager-creation-ui.ts` (fluxos antigos)
- arquivos `*-diagnostics-*`
- `match-regression-suite-v2.ts`
- `match-engine-readiness-v2.ts`

Esses arquivos devem permanecer fora do runtime ou ser arquivados/removidos somente depois de confirmar que não guardam regra única ainda necessária.

## Blocos funcionais que ficaram fora e exigem decisão/integração

### 1. Bootstrap global de futebol

`world-football-bootstrap-v1.ts` está sem importador no app ativo. Ele agrega:

- fundação de governança global;
- registro estendido de seleções;
- competições internacionais;
- fundação/temporada de competições de clubes;
- registros de elenco;
- resolução de congestionamento de calendário;
- qualificatórias de Copa do Mundo;
- rankings históricos;
- histórico internacional;
- catálogo/fontes OpenFootball;
- pirâmides domésticas e resultados históricos.

Parte desses subsistemas é usada por outros caminhos, mas o bootstrap completo não é executado pela beta.

### 2. Transição completa de temporada de clubes

`club-season-transition-v1.ts` está fora do grafo ativo. Ele implementa a passagem de temporada com:

- checagem de ligas/copas/continentais completas;
- promoção/rebaixamento/pirâmide;
- classificação continental;
- nova temporada doméstica;
- evolução de cultura de torcida;
- atualização de reputação;
- sincronização/decay de memória institucional.

É um candidato forte a integração no fluxo oficial de virada de temporada.

### 3. Histórico factual de futebol

`football-history-v1.ts` e o bootstrap histórico associado estão fora do grafo ativo. Eles importam campeões/finais históricos e expõem honours por clube/competição. O World Football Data ativo já possui estruturas de títulos/histórico, mas esse importador específico não está em uso.

### 4. Clima mundial específico por cidade

`world-weather-v2.ts` está fora do grafo ativo. Ele gera clima diário determinístico por cidade/clima/latitude e produz temperatura, umidade, chuva, vento e condição do gramado. O match engine possui `match-environment-v2.ts`, mas hoje essa geração mundial por cidade não está ligada diretamente ao contexto da partida.

`world-time-v2.ts` também está fora, porém boa parte da responsabilidade de relógio já é exercida pelo `daily-simulation` + `world-core-v2`, portanto provavelmente é utilitário substituído e não deve ser ligado sem necessidade.

### 5. Aprendizado tático durante a partida

`match-tactical-learning-v2.ts` está fora do grafo ativo. Ele observa padrões ofensivos do adversário, calcula ameaça por canal/ação e recomenda adaptações de pressão, compactação, linha e proteção de profundidade. É funcionalidade real e não apenas diagnóstico.

### 6. Livro de recordes

`match-record-book-v2.ts` está fora do grafo ativo. Ele usa o histórico de temporada/carreira já existente para construir leaderboards e recordes de gols, assistências, ratings, clean sheets, hat-tricks, jogos, minutos e placares. O histórico-base está ativo; a camada de recordes não está conectada à experiência.

### 7. Loader público 2026 alternativo

`real-world-2026-loader-v1.ts` está fora do grafo ativo. Ele faz importação em lote de jogadores/staff reais, resolve clube/seleção, deduplica roster e inicializa perfil médico. Entretanto `real-world-player-import-v2`, `real-world-staff-import-v1`, `verified-rosters-v1` e a hidratação atual estão alcançáveis. O loader V1 deve ser tratado como pipeline alternativo/legado até provar que contém cobertura única necessária.

## Match engine — órfãos a revisar antes de conectar

Há módulos não alcançáveis que podem ser implementações substituídas ou wrappers antigos, por exemplo:

- `match-context-bridge-v2.ts`
- `match-contact-resolution-v2.ts`
- `match-set-piece-execution-v2.ts`
- `match-action-map-v2.ts`

O runtime ativo já alcança `match-contact-resolver-v2`, `match-set-piece-runtime-v2`, `match-set-pieces-v2`, `match-environment-v2`, `match-advantage-v2`, `match-handball-v2` e o restante do pipeline principal. Portanto esses arquivos não devem ser importados cegamente; precisam ser comparados função por função para evitar dupla execução.

## Conclusão

A beta atual **não cobre literalmente todo arquivo criado**. Ela cobre o núcleo jogável e os motores principais, mas a auditoria encontrou funcionalidades reais fora do grafo ativo. As prioridades de integração são:

1. revisar/integrar `club-season-transition-v1`;
2. decidir como inicializar o `world-football-bootstrap-v1` sem reintroduzir fetch pesado/duplicação no desktop;
3. ligar `world-weather-v2` ao contexto de partida se não duplicar `world-geography-climate-v2`;
4. integrar `match-tactical-learning-v2` ao match engine assistido/IA;
5. expor `match-record-book-v2` em Analytics/História;
6. revisar o histórico factual (`football-history-v1`) e a cobertura mundial;
7. classificar e posteriormente remover/arquivar implementações antigas e diagnostics que não devem chegar ao bundle final.

A auditoria foi adicionada ao CI via `npm run audit:coverage` para que futuras funcionalidades órfãs possam ser detectadas continuamente.
