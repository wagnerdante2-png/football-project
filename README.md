# Football Project

Projeto pessoal de um simulador/manager de futebol inspirado na profundidade sistêmica de jogos como Football Manager, mas com arquitetura própria e foco em rodar no navegador.

## Estado atual

O projeto já possui:
- clubes com elencos individuais;
- idade, CA, PA, condição, moral e atributos por jogador;
- seleção automática do onze inicial;
- calendário de ida e volta e classificação;
- match engine orientado a eventos;
- posse, passes, finalizações, chutes no alvo, xG, gols, defesas, cartões e substituições;
- desgaste físico entre rodadas;
- central da partida com linha do tempo e produção individual;
- sistema tático funcional com mentalidade, ritmo, pressão, linha defensiva, largura, estilo de passe e transição;
- presets táticos como Gegenpress, Posse, Contra-ataque e Bloco Baixo;
- papéis individuais que alteram o comportamento dos jogadores e a expressão tática;
- estatísticas individuais derivadas dos eventos reais do motor;
- progressão anual de jogadores por idade e potencial;
- declínio físico e técnico de veteranos;
- aposentadorias probabilísticas;
- geração anual de novos jogadores das categorias de base;
- controle de necessidades por posição para impedir que os clubes fiquem sem elenco;
- jovens raros com potencial de elite;
- histórico de campeões, artilheiros, evolução, novas gerações e aposentadorias;
- simulação contínua de múltiplas temporadas.

## Mundo vivo

A virada de cada temporada executa um ciclo completo:

`fim do campeonato → registro histórico → envelhecimento → desenvolvimento/declínio → aposentadorias → nova fornada da base → ajuste dos elencos → novo calendário`

O objetivo é que o universo possa continuar indefinidamente. Jogadores envelhecem e deixam o futebol, enquanto novas gerações surgem para substituí-los e alterar gradualmente a força dos clubes.

A qualidade da base é influenciada pela reputação do clube e existe uma pequena chance de surgirem talentos excepcionais. O motor também verifica carências por posição antes de gerar a fornada anual, garantindo goleiros, defensores, meio-campistas e atacantes suficientes para manter a competição funcional.

## Rodar

```bash
npm install
npm run dev
```

## Direção do projeto

A prioridade continua sendo aprofundar o motor antes da interface avançada. Próximas camadas previstas incluem persistência completa de save, contratos, mercado de transferências, IA dos clubes, staff, scouting, múltiplas competições e uma estrutura de base mais detalhada.

## Princípio técnico

O código deste repositório é implementação própria. Projetos open-source são usados como referência arquitetural e conceitual. Evitamos copiar código GPL diretamente para manter independência de licença.

Veja `docs/ARCHITECTURE.md` e `docs/RESEARCH.md`.
