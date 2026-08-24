# Football Project

Projeto pessoal de um simulador/manager de futebol inspirado na profundidade sistêmica de jogos como Football Manager, mas com arquitetura própria e foco em rodar no navegador.

## Estado atual

O projeto já possui:
- clubes com elencos individuais de 24 jogadores;
- idade, CA, PA, condição, moral e atributos por jogador;
- seleção automática do onze inicial;
- calendário de ida e volta e classificação;
- match engine orientado a eventos;
- posse, passes, finalizações, chutes no alvo, xG, gols, defesas, cartões e substituições;
- desgaste físico entre rodadas;
- central da partida com linha do tempo;
- sistema tático funcional com mentalidade, ritmo, pressão, linha defensiva, largura, estilo de passe e transição;
- presets táticos como Gegenpress, Posse, Contra-ataque e Bloco Baixo.

As escolhas táticas já modificam a força coletiva, a criação de chances, a posse, o volume de ataques, a incidência de cartões e a fadiga.

## Rodar

```bash
npm install
npm run dev
```

## Direção do projeto

A prioridade continua sendo aprofundar o motor antes de investir em interface avançada. Próximas camadas previstas: papéis individuais, contratos, mercado, IA dos clubes, evolução de jogadores, categorias de base, múltiplas competições e temporadas persistentes.

## Princípio técnico

O código deste repositório é implementação própria. Projetos open-source são usados como referência arquitetural e conceitual. Evitamos copiar código GPL diretamente para manter independência de licença.

Veja `docs/ARCHITECTURE.md` e `docs/RESEARCH.md`.
