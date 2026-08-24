# Arquitetura proposta

## 1. Princípio

O jogo será dividido em dois grandes blocos: **simulation core** e **interface**. O core deve funcionar sem interface para permitir testes, simulação acelerada de temporadas e eventual troca da camada visual.

## 2. Domínios

### Mundo
- países
- federações
- competições
- clubes
- calendários
- histórico

### Pessoas
- jogadores
- técnicos
- staff
- dirigentes
- atributos visíveis e ocultos
- reputação
- personalidade
- desenvolvimento e envelhecimento

### Clube
- elenco
- tática
- contratos
- finanças
- transferências
- scouting
- categorias de base
- instalações
- objetivos
- IA do clube

### Partida
Pipeline-alvo:

`posse -> construção -> zona -> duelo -> progressão -> criação -> finalização -> consequência`

Cada estágio poderá considerar atributos, função, posição, tática, adversário, fadiga, moral, entrosamento, contexto e aleatoriedade ponderada.

### Tempo
O mundo é dirigido por eventos e calendário. A interface apenas pede ao core para avançar o tempo.

## 3. Evolução em fases

### Fase 0 - executável mínimo
- campeonato ida/volta
- força de clubes
- partidas probabilísticas
- classificação
- avanço de rodada

### Fase 1 - jogadores reais no motor
- elenco por clube
- posições
- atributos 1-20 ou 1-100 internamente
- seleção de onze
- força calculada pelo elenco
- lesão/fadiga básica

### Fase 2 - match engine por eventos
- posse e território
- passes e duelos
- chances
- xG
- cartões
- substituições
- estatísticas individuais

### Fase 3 - universo persistente
- save/load
- calendário anual
- múltiplas competições
- temporadas
- histórico

### Fase 4 - mercado e contratos
- valor
- salário
- contrato
- proposta
- interesse
- IA de compra/venda

### Fase 5 - vida longa do mundo
- crescimento e declínio
- jovens/regens
- aposentadoria
- técnicos e demissões
- reputação dinâmica
- finanças e objetivos

## 4. Regra de engenharia

A simulação deve ser determinística quando executada com uma seed fixa. Isso permitirá reproduzir bugs e calibrar o motor estatisticamente.

Também será criado futuramente um `simulation-lab` para rodar milhares de partidas/temporadas e validar distribuições de gols, mando, favoritos, empates, cartões e evolução econômica.
