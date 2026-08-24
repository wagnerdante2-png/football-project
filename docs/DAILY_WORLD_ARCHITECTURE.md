# Arquitetura de mundo diário e orientado a eventos

O jogo deixa de tratar a rodada como unidade fundamental. A unidade fundamental passa a ser **o dia**.

## Relógio

Cada temporada possui calendário próprio. As partidas ficam associadas a datas e os dias intermediários processam treinamento, recuperação, scouting, promessas, imprensa, pressão institucional e demais sistemas.

Fluxo simplificado:

`dia → promessas/prazos → jogo ou treino → recuperação → scouting → eventos → reações → próximo dia`

## Event bus

`src/event-bus.ts` funciona como diário causal do universo. Sistemas publicam fatos e outros sistemas podem reagir sem acoplamento direto.

Exemplos:

- `MatchCompleted`
- `PlayerInjured`
- `NegotiationLeaked`
- `PromiseBroken`
- `PlayerRetired`
- `YouthPlayerGenerated`
- `ManagerRelationshipChanged`
- `MediaStoryPublished`

Um evento guarda data, temporada, rodada, clubes, jogadores, importância, tags, resumo e payload estruturado.

O histórico é serializável e limitado operacionalmente para impedir crescimento infinito em memória.

## Memória institucional

`src/institutional-memory.ts` mantém estado persistente de longo prazo:

- promessas feitas e seus prazos;
- confiança, respeito, alinhamento, comunicação e credibilidade entre manager e diretoria;
- pressão de torcida, imprensa, vestiário, finanças e board;
- notícias derivadas de fatos reais do save.

A intenção é evitar eventos descartáveis. Uma promessa quebrada hoje pode deteriorar credibilidade e influenciar uma decisão meses depois.

## Reações causais

O event bus permite que um mesmo fato afete vários sistemas.

Exemplo:

`NegotiationLeaked`

pode gerar:

`notícia → pressão da torcida → pressão da imprensa → mudança de board pressure → alteração de poder de barganha`

O módulo de negociação não precisa conhecer diretamente cada consequência.

## Treinamento diário

`src/daily-simulation.ts` inclui foco e intensidade por clube. Treino interfere em condição e pode produzir pequenos ganhos de atributos conforme idade e intensidade. Descanso e recuperação possuem comportamento diferente.

Esta primeira versão é propositalmente uma infraestrutura. A evolução prevista inclui microciclos, sessões manhã/tarde, treinadores especializados, carga aguda/crônica, treino individual, retorno pós-lesão e preparação específica para adversário.

## Save versionado

`src/save-game.ts` cria a fundação do save JSON versionado. O snapshot V1 já inclui:

- mundo esportivo;
- calendário diário;
- event log;
- relações institucionais;
- promessas;
- pressões;
- notícias.

Os demais subsistemas com estado em `WeakMap` deverão aderir gradualmente ao mesmo contrato de snapshot/restore. Isso evita um save impossível de migrar no futuro.

## Princípio de realismo

Nenhuma decisão relevante deve existir apenas como resultado final. Sempre que possível, o jogo deve preservar:

1. o fato ocorrido;
2. quem participou;
3. quais sistemas reagiram;
4. por que a decisão foi tomada;
5. quais efeitos permanecem no mundo.

Isso permite que o universo tenha memória, causalidade e histórias emergentes em vez de eventos isolados.