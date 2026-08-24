# Pesquisa de referências open-source

Este documento registra referências conceituais/arquiteturais. O objetivo é estudar estruturas e reimplementar as ideias de forma própria quando conveniente.

## ZOXEXIVO/open-football

Referência principal para profundidade sistêmica. A árvore separa claramente módulos de `core`, `database`, `match`, `shared` e `web`. Dentro do core existem domínios específicos para clube, competições, continente, país, liga, partidas, simulador e transferências.

Pontos que queremos absorver como conceito:
- core desacoplado da interface;
- mundo dividido em domínios;
- simulador de longo prazo;
- transferências como subsistema;
- match engine isolável;
- possibilidade de web na mesma solução.

Não vamos copiar arquivos inteiros. A primeira implementação do nosso `engine.ts` foi escrita do zero.

## openfootmanager/openfootmanager

Boa referência para separação entre motor e experiência visual. O projeto usa licença GPL v3, portanto deve ser tratado principalmente como material de estudo arquitetural caso queiramos manter nosso código independente.

Pontos conceituais:
- separar simulação da UI;
- manter estado de jogo serializável;
- telas como projeções do estado, não como fonte das regras.

## Estratégia do Football Project

1. estudar referências;
2. mapear mecanismos interessantes;
3. desenhar contrato próprio de dados;
4. implementar clean-room;
5. calibrar com testes estatísticos;
6. só depois enriquecer a UI.

A prioridade não é reproduzir visualmente outro jogo, e sim obter a sensação de um universo futebolístico coerente e persistente.
