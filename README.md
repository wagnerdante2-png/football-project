# Football Project

Projeto pessoal de um simulador/manager de futebol inspirado na profundidade sistêmica de jogos como Football Manager, mas com arquitetura própria e foco em rodar no navegador.

## Objetivo da fase atual

Construir primeiro o núcleo do mundo e da simulação, antes de investir em interface complexa.

A primeira versão contém:
- clubes e força agregada;
- calendário simples;
- simulador probabilístico de partidas;
- classificação;
- avanço de rodada;
- arquitetura preparada para evolução de jogadores, mercado, contratos e temporadas longas.

## Rodar

```bash
npm install
npm run dev
```

## Princípio técnico

O código deste repositório é implementação própria. Projetos open-source são usados como referência arquitetural e conceitual. Evitamos copiar código GPL diretamente para manter independência de licença.

Veja `docs/ARCHITECTURE.md` e `docs/RESEARCH.md`.
