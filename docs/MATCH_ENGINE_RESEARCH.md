# Pesquisa para o próximo grande bloco: Match Engine

## Fonte principal identificada
`DeltaBitsSystem/FootballEngine` é especialmente relevante. O projeto público descreve um motor espacial 2D em campo 105x68m, com simulação em 40Hz, física de bola, steering de jogadores, percepção limitada, cognição, mapas de influência, adaptação tática, fadiga, bolas paradas, arbitragem, VAR e substituições por agente do treinador.

### Ideias arquiteturais aproveitáveis
- Campo contínuo 105x68, com posições reais em metros.
- Loop de simulação de alta frequência separado do mundo diário.
- Física de bola separada da tomada de decisão dos jogadores.
- Movimento por comportamentos: seek, arrive, pursuit, separation e manutenção de shape.
- Corridas sem bola emergentes: profundidade, overlap, underlap, diagonal, terceiro homem, falso 9.
- Percepção limitada por visão/posição; jogador não deve ser onisciente.
- Grid de influência territorial para segurança de passe, cobertura e controle de espaço.
- Pipeline de intenções ponderadas para escolher ação.
- Feedback tático durante a partida: taxa de sucesso de passes, pressão e corredores alteram o comportamento coletivo.
- Estado do placar e minuto alteram risco, compactação, pressão e ritmo.
- Fadiga de jogo conectada a carga de treino e condição pré-jogo.
- Agente dedicado a bolas paradas.
- Offside por snapshot no instante do passe.
- Arbitragem com falta, vantagem, mão, cartões e revisão VAR.
- ManagerAgent separado para substituições.

## O que não copiar literalmente
O nosso projeto é TypeScript e já possui uma arquitetura própria. A intenção é absorver princípios, algoritmos e decomposição do problema, não transplantar uma aplicação F# inteira. A compatibilidade de licença também deve ser respeitada antes de copiar trechos de código; arquitetura e ideias podem ser reimplementadas de forma própria.

## Repositórios secundários
`cwhelan16/FootballSimulationEngine` é um modelo estatístico de processo de Markov para placares. É útil como referência de validação probabilística agregada, mas não como base do nosso jogo espacial.

`p4welo/football-manager` possui uma arquitetura de domínio/serviço/web que pode ser vasculhada para regras e estrutura gerencial, mas não aparenta ser uma referência tão forte quanto o FootballEngine para o motor espacial.

## Ordem proposta para implementação
1. Regras e estado formal da partida: relógio, períodos, acréscimos, placar, cartões, substituições, impedimento, bolas paradas.
2. Geometria do campo e coordenadas 2D.
3. Formation/shape engine e posições de base.
4. Movimento sem bola e steering.
5. Bola e ações técnicas: passe, chute, cruzamento, domínio, condução.
6. Percepção e tomada de decisão individual.
7. Duelo, desarme, contato e faltas.
8. Árbitro, vantagem, cartões e VAR.
9. Tática coletiva e instruções.
10. Substituições e alterações táticas durante o jogo.
11. Fadiga, lesões durante partida e impactos psicológicos/contextuais.
12. Bolas paradas completas.
13. Estatísticas detalhadas e xG/eventos.
14. Renderização 2D e controles de velocidade/pausa.
15. Testes determinísticos e calibração estatística.

## Meta
O motor deve produzir uma partida cuja lógica seja explicável por atributos, decisões, espaço, tática, estado físico e contexto, evitando um simples sorteio de placar mascarado por animação.
