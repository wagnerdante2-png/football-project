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
- simulação contínua de múltiplas temporadas;
- contratos com duração, salário semanal e status no elenco;
- valor de mercado dinâmico por CA, PA e idade;
- finanças por clube com saldo, orçamento de transferências e folha salarial;
- renovações, dispensas e jogadores livres;
- IA de mercado que identifica carências por posição, compra, vende e contrata autonomamente;
- registro histórico de transferências e movimentações financeiras;
- motor de scouting com conhecimento incompleto por clube;
- CA, PA, valor e atributos externos apresentados como intervalos estimados;
- scouts individuais, regiões de conhecimento e capacidade limitada de observação;
- IA de transferências orientada pelo próprio scouting, sem consultar diretamente CA/PA reais;
- motor médico com seis níveis de gravidade, anatomia, lateralidade e tecido lesionado;
- histórico físico persistente por jogador;
- vulnerabilidades anatômicas e risco de recorrência por região/lado;
- déficits funcionais pós-lesão que afetam temporariamente os atributos usados no match engine;
- lesões gravíssimas capazes de deixar sequelas permanentes;
- recuperação em fases: aguda, imobilização, reabilitação, retorno ao treino e retorno ao jogo;
- influência de idade, fadiga, intensidade tática, predisposição, durabilidade e histórico no risco de lesão.

## Mundo vivo

A virada de cada temporada executa um ciclo completo:

`fim do campeonato → registro histórico → envelhecimento → desenvolvimento/declínio → aposentadorias → nova fornada da base → contratos/mercado → ajuste dos elencos → novo calendário`

O objetivo é que o universo possa continuar indefinidamente. Jogadores envelhecem e deixam o futebol, enquanto novas gerações surgem para substituí-los e alterar gradualmente a força dos clubes.

A qualidade da base é influenciada pela reputação do clube e existe uma pequena chance de surgirem talentos excepcionais. O motor também verifica carências por posição antes de gerar a fornada anual, garantindo goleiros, defensores, meio-campistas e atacantes suficientes para manter a competição funcional.

O mercado também é contínuo: contratos expiram, clubes decidem renovar ou liberar jogadores, agentes livres podem ser contratados e a IA procura reforços de acordo com necessidade esportiva, orçamento disponível e valor de mercado. Clubes vendedores levam em conta profundidade do elenco, idade, importância do atleta e potencial antes de aceitar uma saída.

## Scouting e informação imperfeita

Jogadores de outros clubes não devem aparecer para o manager com CA, PA e atributos exatos. O sistema de scouting mantém um nível de conhecimento independente para cada clube observador.

Um jogador pouco conhecido pode aparecer, por exemplo, como `CA 61–79` e `PA 70–91`. Conforme o scout acompanha o atleta, a confiança sobe e os intervalos diminuem. Com conhecimento completo, a estimativa converge para os valores reais usados internamente pelo motor.

A qualidade da equipe de recrutamento interfere na precisão. Scouts melhores reduzem erro na leitura de habilidade atual e potencial, enquanto a adaptabilidade acelera o ganho de conhecimento. O clube também possui capacidade máxima de observações simultâneas.

## Motor médico

Lesões não são apenas um contador de dias fora. Cada ocorrência registra anatomia, lateralidade, tecido, gravidade, contexto e possíveis consequências funcionais.

Uma fratura grave na perna dominante, por exemplo, pode reduzir temporariamente finalização, técnica ou passe após o retorno. O déficit recupera-se em treinamento, mas a região lesionada pode permanecer mais suscetível a recorrências. Lesões críticas ou de ameaça à carreira podem deixar um piso permanente de sequela.

O histórico físico continua existindo após a recuperação e passa a interferir no risco futuro, na disponibilidade e no perfil de carreira do atleta.

Veja `docs/MEDICAL_ENGINE.md` para o modelo completo.

## Rodar

```bash
npm install
npm run dev
```

## Direção do projeto

A prioridade continua sendo aprofundar o motor antes da interface avançada. Próximas camadas previstas incluem persistência completa de save, integração completa do Centro Médico à navegação, múltiplas competições, estrutura de base mais detalhada, moral/relacionamentos e decisões de carreira do manager.

## Princípio técnico

O código deste repositório é implementação própria. Projetos open-source são usados como referência arquitetural e conceitual. Evitamos copiar código GPL diretamente para manter independência de licença.

Veja `docs/ARCHITECTURE.md`, `docs/RESEARCH.md`, `docs/SCOUTING.md` e `docs/MEDICAL_ENGINE.md`.
