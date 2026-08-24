# Dressing Room Engine + próximos blocos de realismo

## O que esta rodada implementa

O vestiário agora é tratado como uma sociedade interna persistente, e não como uma única nota de moral.

### Hierarquia social
- capitão e vice com seleção estável e margem de histerese;
- líderes, influentes, núcleo, periféricos, isolados e jovens;
- influência combina liderança, profissionalismo, idade, qualidade esportiva e alcance social;
- mudança de capitão gera evento próprio e pode mexer com a pressão interna.

### Cultura do clube
Cada clube mantém uma cultura lenta, com eixos de disciplina, confiança na base, tolerância a estrelas, coletivismo, competitividade, pressão por resultado, tradição, abertura e força de identidade. A cultura muda devagar ao longo dos anos; ela não reinicia a cada temporada.

### Satisfação individual
O motor acompanha, por jogador:
- tempo de jogo esperado x real;
- salário relativo aos pares;
- status prometido no elenco;
- adaptação social;
- confiança no treinador;
- aderência à cultura;
- influência interna;
- risco de conflito;
- dias consecutivos de insatisfação.

Uma reclamação não nasce em um dia ruim. Ela precisa persistir. Isso evita comportamento artificial e cria problemas que amadurecem.

### Facções e isolamento
O grafo de relações é transformado em grupos sociais. Amizades fortes formam componentes conectados; o motor mede quantidade de facções, isolamento, coesão interna e hostilidade. Isso permite diferenciar um elenco unido de um elenco fragmentado em panelas rivais.

### Mentoria
Veteranos com liderança/profissionalismo adequados podem orientar jovens de posição compatível. A relação pode gerar benefício ou fricção. A intenção é conectar essa camada futuramente à evolução técnica, personalidade, adaptação e cultura.

### Turnover social
O sistema guarda o elenco anterior. Entradas e saídas provocam choque de turnover; saída de capitão ou de jogador com amizades fortes pesa muito mais. Portanto vender um jogador de rotação socialmente central pode ser mais disruptivo do que vender um titular isolado.

### Impacto esportivo
Química, liderança, integração e conflito entram como pequenos multiplicadores contextuais no match engine. Não alteram os atributos-base. O vestiário pode ajudar ou atrapalhar desempenho sem transformar relações sociais em um atributo de futebol permanente.

## Referências públicas analisadas

O `open-football` possui um bloco `squad_life` explicitamente separado em captaincy, chemistry, matchday leadership, mentorship, social snapshot e squad status. Isso confirma que a vida interna do elenco merece uma camada própria e não deve ser comprimida em `morale`.

Pontos particularmente úteis como referência conceitual:
- capitania estável, com penalidades situacionais e histerese;
- snapshot social do time com harmonia entre pares, conflitos, liderança, confiança no treinador, integração, turnover e facções;
- liderança do capitão como mecanismo de mediação de conflitos;
- mentoria automática com compatibilidade e possibilidade de fricção;
- treinamento dependente da química do grupo e da relação jogador-treinador;
- conversas de vestiário dependentes de personalidade, contexto, reputação do treinador e repetição do discurso.

Nosso motor segue arquitetura própria em TypeScript e usa essas leituras como referência de domínio, não como uma transposição literal de código.

## Próximas frentes sugeridas após esta rodada

### 1. Training Engine 2.0 — prioridade imediata
Nosso treino diário atual ainda é simples. A próxima grande frente deve tratar treinamento como um sistema completo:
- grade semanal com manhã/tarde e descanso;
- periodização por pré-temporada, semana normal, congestionamento e recuperação;
- sessões: físico, resistência, força, velocidade, finalização, criação, defesa, bola parada, posicionamento, transição, pressão, vídeo, adversário específico, coesão e recuperação;
- grupos por unidade: goleiros, defesa, meio, ataque;
- treino individual de atributo, posição, função e pé fraco;
- familiaridade tática e aprendizado de função;
- qualidade do treinador e instalações;
- carga aguda x crônica, fadiga e risco de lesão;
- humor e receptividade ao treinador;
- efeito da química do vestiário;
- reabilitação integrada ao departamento médico;
- overtraining, queda de rendimento e reclamações sobre carga;
- mentoria influenciando desenvolvimento e profissionalismo.

### 2. Manager & Staff Career Engine
Depois do treino, jogadores já estarão profundamente conectados ao staff. Precisamos então tornar treinadores e funcionários agentes de carreira completos:
- idade, reputação, atributos, personalidade e filosofia;
- contratos e salários;
- demissão, pedido de saída e aposentadoria;
- contratação por outros clubes;
- evolução e declínio de atributos;
- assistentes, preparadores, fisioterapeutas, médicos, analistas, scouts e diretores;
- relacionamento entre membros do staff;
- lealdade ao treinador ou ao clube;
- treinador levando membros da comissão ao trocar de clube;
- sucessão interna e técnicos interinos;
- ex-jogadores virando staff.

### 3. Team Talks, reuniões e gestão humana
A camada de vestiário pede interfaces de decisão humana:
- conversa pré-jogo, intervalo e pós-jogo;
- reunião individual;
- reunião de elenco;
- conversa com líder/capitão;
- elogio, crítica, advertência, proteção pública e cobrança;
- efeito condicionado por personalidade, confiança e contexto;
- repetição de discurso perde efeito;
- resposta coletiva mediada por líderes e facções.

### 4. Infrastructure + Football Operations
- centro de treinamento;
- departamento médico;
- academia/base;
- rede de scouting;
- ciência do esporte;
- análise de desempenho;
- estádio, gramado e manutenção;
- capacidade e expansão;
- investimento decidido pela diretoria;
- qualidade das instalações afetando treino, recuperação, geração de jovens e atração de profissionais.

### 5. Competitions & Regulations Engine
O mundo ainda precisa deixar de ser uma liga única simples:
- múltiplas ligas e divisões;
- promoção/rebaixamento;
- copas e mata-mata;
- competições continentais;
- calendário simultâneo;
- inscrições e limite de elenco;
- estrangeiros e home-grown;
- suspensões por cartões;
- regras distintas por país e competição;
- janelas de transferência reais;
- empréstimos com regras regulatórias;
- critérios de desempate configuráveis;
- premiação e distribuição financeira.

### 6. Staff/club governance e ownership avançados
Já existe um esqueleto de diretoria. A evolução deve incluir:
- presidente/dono/conselho;
- modelos de propriedade;
- eleições e trocas de comando;
- takeover;
- objetivos de curto e longo prazo;
- autonomia do treinador;
- diretor de futebol com poder real;
- promessas da diretoria;
- orçamento negociado;
- conflitos políticos internos;
- avaliação e demissão baseada em múltiplos objetivos, não só resultados.

### 7. Finanças completas
- receitas de bilheteria, televisão, premiações, patrocinadores e comercial;
- salários de jogadores/staff;
- parcelas de transferências e bônus futuros;
- dívida e juros;
- custo de infraestrutura;
- fluxo de caixa;
- FFP/licenciamento;
- insolvência, embargo de transferências e punições;
- valor comercial de atletas e clubes.

### 8. Mundo global
- países, cidades, climas, idiomas e cultura;
- mercado de trabalho de jogadores e staff;
- seleções nacionais;
- competições internacionais;
- cidadania e elegibilidade;
- adaptação cultural;
- rivalidades emergentes;
- reputação dinâmica de ligas e países.

## Ordem recomendada

1. Training Engine 2.0
2. Manager & Staff Career Engine
3. Team Talks / gestão humana
4. Infraestrutura e operações
5. Competições e regulamentos
6. Ownership/governança avançada
7. Finanças completas
8. Mundo global e seleções

Essa ordem maximiza reaproveitamento: treinamento usa vestiário e medicina; staff passa a controlar treinamento; team talks usam staff + vestiário; infraestrutura passa a modificar staff/treino/medicina; competições então dão escala ao mundo; finanças e ownership passam a governar tudo isso.
