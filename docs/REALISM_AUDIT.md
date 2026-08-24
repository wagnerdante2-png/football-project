# Auditoria de realismo e lacunas sistêmicas

Esta auditoria organiza sistemas que ainda precisam existir para o Football Project se aproximar de um ecossistema de futebol vivo, coerente e persistente. Ela foi inspirada pela leitura de arquiteturas públicas de simuladores/manager como OpenFoot Manager, Open Football e FootballManagement, mas não copia código GPL: o objetivo é mapear conceitos, dependências e lacunas para implementação própria.

## Princípio central

O jogo deve evitar decisões isoladas e determinísticas. Quase toda decisão relevante precisa resultar de múltiplos agentes, interesses, histórico, contexto, informação imperfeita e consequências futuras.

O mundo deve ser causal:

`evento -> interpretação por diferentes atores -> decisão -> reação -> consequências -> novo contexto`

Não basta simular partidas e transferências. Precisamos simular instituições, pessoas, expectativas, memória, reputação e tempo.

## 1. Tempo diário e calendário real

Migrar progressivamente de "rodadas" para um relógio diário de 365 dias.

O calendário deve suportar:

- pré-temporada;
- amistosos;
- janelas de transferências;
- datas de inscrição;
- competições simultâneas;
- viagens;
- folgas;
- recuperação;
- treinamentos;
- convocações;
- datas FIFA;
- férias;
- exames médicos;
- reuniões de diretoria;
- reuniões de recrutamento;
- eventos de imprensa;
- prazos contratuais;
- fechamento de janela;
- decisões com deadline.

O calendário é a espinha dorsal de todos os outros sistemas.

## 2. Estrutura institucional dos clubes

Cada clube deve ser uma organização e não apenas um elenco.

Atores possíveis:

- proprietário/controlador;
- presidente/chairman;
- conselho/diretoria;
- CEO;
- diretor executivo;
- diretor de futebol;
- gerente de futebol;
- treinador;
- auxiliar;
- comissão técnica;
- head scout;
- scouts;
- analistas de dados;
- departamento médico;
- fisioterapia;
- preparação física;
- psicologia;
- categorias de base;
- departamento financeiro;
- jurídico;
- marketing/comercial;
- relacionamento com torcida/imprensa.

Cada estrutura deve variar por tamanho e cultura do clube. Um clube pequeno pode acumular funções; um gigante pode ter dezenas de especialistas.

## 3. Propriedade, política e governança

O clube deve ter personalidade institucional persistente.

Variáveis recomendadas:

- riqueza do proprietário;
- ambição;
- paciência;
- interferência;
- tolerância a risco;
- conservadorismo financeiro;
- foco em sustentabilidade;
- desejo de títulos imediatos;
- foco em base;
- preferência por jogadores domésticos;
- preferência por estrelas;
- foco em revenda;
- abertura a técnicos jovens;
- autonomia concedida ao treinador;
- confiança no diretor de futebol;
- sensibilidade à torcida;
- sensibilidade à imprensa;
- tolerância a controvérsias;
- histórico de promessas feitas ao treinador;
- relacionamento diretoria-treinador;
- possibilidade de mudança de dono/takeover.

A diretoria deve poder vetar, aprovar condicionalmente ou aprovar contratações, investimentos, vendas e renovações.

## 4. Visão de longo prazo e objetivos

Cada clube precisa ter uma visão plurianual.

Exemplos:

- ganhar a liga em 3 anos;
- obter promoção;
- sobreviver;
- reduzir folha;
- vender jovens com lucro;
- utilizar atletas da base;
- praticar futebol ofensivo;
- contratar jogadores locais;
- aumentar reputação internacional;
- reformar estádio;
- reduzir dívida.

O treinador pode aceitar ou contrariar essa visão. Contradições acumuladas afetam confiança e emprego.

## 5. Mercado e recrutamento

O fluxo já criado deve continuar evoluindo para um pipeline completo:

`necessidade -> descoberta -> observação -> reunião de recrutamento -> dossiê -> aprovação interna -> negociação -> exame médico -> contrato -> registro -> integração`

Adicionar:

- reunião formal de recrutamento;
- múltiplos scouts opinando sobre o mesmo atleta;
- consenso e divergência entre scouts;
- chief scout com peso maior;
- análise de dados paralela ao scout tradicional;
- shortlist por prioridade;
- plano A/B/C por posição;
- monitoramento de breakout players;
- jogadores que entram no radar por desempenho recente;
- exposição de mercado crescente;
- inflação por concorrência de múltiplos clubes;
- negociações paralelas;
- janela se fechando e urgência crescente;
- clubes atravessando negociações;
- jogador escolhendo entre propostas;
- agente usando oferta rival para pressão.

## 6. Plausibilidade das transferências

Antes de iniciar uma negociação, o motor deve validar plausibilidade contextual.

Fatores:

- diferença de reputação entre clubes;
- nível da liga;
- competição continental;
- idade;
- salário atual e esperado;
- papel prometido;
- nacionalidade;
- país e idioma;
- distância geográfica;
- clima;
- família;
- status no clube atual;
- status de ídolo;
- ambição;
- minutos esperados;
- relacionamento com treinador;
- relacionamento com diretoria;
- contrato restante;
- rivalidade entre clubes;
- histórico entre as diretorias;
- situação financeira do vendedor;
- urgência de caixa;
- pressão da torcida;
- pressão do atleta.

## 7. Mercado de empréstimos

O mercado de empréstimos deve existir como sistema independente.

Motivações do clube cedente:

- desenvolver jovem;
- liberar salário;
- recuperar valor;
- dar minutos a reserva;
- afastar atleta insatisfeito;
- testar atleta após lesão;
- preparar venda futura.

Motivações do clube receptor:

- emergência;
- baixo orçamento;
- substituição temporária;
- acesso a talento inacessível em definitivo;
- opção de compra.

Fatores de decisão:

- minutos prometidos;
- qualidade da liga;
- estilo do treinador;
- instalações;
- posição no elenco;
- distância/país;
- salário compartilhado;
- taxa;
- opção/obrigação;
- recall;
- penalidade por poucos minutos.

## 8. Contratos e agentes

Expandir contrato para:

- salário base;
- duração;
- luvas;
- comissão de agente;
- bônus por jogo;
- bônus por gol;
- bônus por assistência;
- bônus por clean sheet;
- bônus por título;
- bônus por classificação continental;
- bônus por promoção;
- aumento anual;
- redução salarial por rebaixamento;
- extensão automática;
- opção unilateral do clube;
- opção do atleta;
- cláusula de rescisão;
- cláusula para clubes estrangeiros;
- promessa de função;
- promessa de número de camisa;
- promessa de posição;
- promessa de reforços;
- promessa de capitão;
- cláusulas de imagem/comercial no futuro.

O agente deve ter memória da relação com clubes e dirigentes.

## 9. Personalidade e psicologia dos jogadores

Adicionar atributos ocultos persistentes:

- profissionalismo;
- ambição;
- lealdade;
- temperamento;
- pressão;
- consistência;
- liderança;
- determinação;
- adaptabilidade;
- ego;
- sociabilidade;
- competitividade;
- disciplina;
- resiliência;
- ansiedade;
- tolerância a críticas;
- desejo de fama;
- motivação financeira;
- apego familiar;
- coragem para mudar de país;
- tolerância a banco;
- necessidade de protagonismo.

Esses fatores devem afetar treino, moral, relações, contratos, transferências, imprensa e desempenho em jogos grandes.

## 10. Relações humanas e vestiário

Criar grafo social do elenco.

Relações possíveis:

- amizade;
- mentor/protegido;
- rivalidade interna;
- conflito;
- respeito;
- ressentimento;
- compatriotas;
- grupo linguístico;
- grupo de veteranos;
- grupo de jovens;
- afinidade com treinador;
- afinidade com capitão.

O vestiário deve ter hierarquia:

- líderes;
- jogadores influentes;
- núcleo principal;
- periféricos;
- recém-chegados.

Uma decisão que afeta um líder pode contaminar o moral do grupo.

## 11. Promessas e confiança

Promessas devem ser objetos persistentes com prazo e memória.

Exemplos:

- aumentar minutos;
- melhorar contrato;
- reforçar determinada posição;
- aceitar proposta futura;
- não vender jogador;
- permitir empréstimo;
- dar função específica;
- investir em instalações.

Promessas quebradas devem alterar confiança, moral, mídia, relação com agente e desejo de saída.

## 12. Torcida

A torcida deve ter memória e segmentos.

Variáveis:

- paixão;
- expectativa;
- impaciência;
- tradição;
- identificação local;
- tolerância a estrangeiros;
- valorização da base;
- exigência estética;
- rivalidades;
- ídolos atuais;
- ídolos históricos;
- rejeições históricas.

Segmentos possíveis:

- organizada/ultras;
- tradicionalistas;
- público casual;
- sócios;
- torcida internacional.

Reações devem afetar:

- pressão na diretoria;
- moral do treinador;
- moral do jogador;
- ambiente de estádio;
- negociação;
- renovação;
- venda de ídolo;
- contratação polêmica.

## 13. Imprensa e narrativa

Separar imprensa por perfil:

- tabloide;
- veículo sério;
- jornalista local;
- jornalista nacional;
- setorista;
- insider de mercado;
- mídia internacional.

Cada jornalista pode ter:

- credibilidade;
- sensacionalismo;
- proximidade com clube;
- proximidade com agente;
- agenda;
- histórico com treinador.

Notícias podem ser:

- verdadeiras;
- parcialmente corretas;
- rumores;
- plantadas por agente;
- plantadas pelo clube;
- vazamentos internos;
- especulação pura.

O usuário não deve saber automaticamente qual é qual.

## 14. Treinamento diário

Criar calendário de treinos por dia e sessão.

Áreas:

- físico;
- força;
- velocidade;
- resistência;
- técnica;
- passe;
- finalização;
- defesa;
- bola parada;
- tática;
- transição;
- pressão;
- recuperação;
- individual;
- função/posição;
- reabilitação.

Interações:

- intensidade aumenta ganho e risco de lesão;
- staff melhora eficiência;
- idade altera resposta;
- personalidade altera consistência;
- carga acumulada afeta fadiga;
- minutos de jogo alteram necessidade de recuperação;
- treino individual pode recuperar déficit pós-lesão.

## 15. Staff completo

Além de scouts, implementar:

- auxiliar técnico;
- treinador de goleiros;
- preparador físico;
- treinador técnico;
- treinador tático;
- analista de desempenho;
- analista de recrutamento;
- fisioterapeuta;
- médico;
- cientista esportivo;
- psicólogo;
- coordenador da base;
- diretor de futebol;
- diretor técnico.

Staff também envelhece, melhora, piora, muda de clube, cria reputação e possui relações.

## 16. Carreira de treinadores e mercado de trabalho

Todos os treinadores do mundo devem ter carreira própria.

- contratação;
- demissão;
- interino;
- entrevistas;
- shortlist da diretoria;
- salário;
- reputação;
- estilo;
- resultados anteriores;
- relacionamento com clubes;
- preferência por país/liga;
- aposentadoria;
- retorno ao futebol;
- seleção nacional.

A diretoria deve avaliar candidatos após demissões usando critérios coerentes com a visão do clube.

## 17. Finanças profundas

Adicionar:

Receitas:
- bilheteria;
- sócios;
- TV;
- premiação;
- patrocinadores;
- merchandising;
- vendas de jogadores;
- competições continentais;
- amistosos;
- eventos de estádio.

Despesas:
- salários;
- bônus;
- comissões;
- parcelas de transferências;
- staff;
- manutenção;
- base;
- scouting;
- infraestrutura;
- viagens;
- impostos/taxas;
- dívida e juros.

Consequências:

- dívida;
- austeridade;
- bloqueio de transferências;
- venda forçada;
- administração judicial em regras que permitam;
- dedução de pontos quando aplicável;
- redução de orçamento;
- mudança de proprietário.

## 18. Fair play financeiro e registros

Criar regras configuráveis por competição/país:

- FFP;
- teto salarial;
- limite de estrangeiros;
- homegrown;
- idade mínima;
- inscrição A/B;
- limite de elenco;
- limite de empréstimos;
- janela;
- work permit;
- registration deadline.

Isso precisa ser data-driven, não hardcoded.

## 19. Infraestrutura

Clubes devem possuir:

- estádio;
- capacidade;
- qualidade do gramado;
- CT;
- academia;
- centro médico;
- instalações da base;
- rede de recrutamento;
- análise de dados;
- reputação da formação.

Investimentos devem competir pelo mesmo capital usado no mercado.

## 20. Estádio, público e mando

Adicionar:

- lotação variável;
- preço de ingresso;
- importância da partida;
- rivalidade;
- clima;
- distância da torcida visitante;
- momento do time;
- reputação do adversário;
- capacidade e conforto;
- pressão atmosférica no jogo.

## 21. Competições e pirâmide

Suportar múltiplas ligas simultâneas e regras distintas:

- pontos corridos;
- mata-mata;
- grupos;
- playoffs;
- ida/volta;
- copa nacional;
- supercopa;
- torneios continentais;
- promoção/rebaixamento;
- coeficientes;
- vagas continentais.

O mundo só será realmente vivo quando clubes puderem subir, cair e mudar de relevância.

## 22. Seleções nacionais

Planejar:

- nacionalidades múltiplas;
- elegibilidade;
- convocação;
- lesões em data FIFA;
- conflitos clube-seleção;
- grandes torneios;
- reputação internacional;
- treinador de seleção;
- naturalização quando aplicável.

## 23. Base aprofundada

O intake anual atual deve evoluir para:

- academias sub-18/sub-20;
- staff da base;
- instalações;
- reputação juvenil;
- área de captação;
- nacionalidades conforme região;
- personalidade influenciada por contexto;
- desenvolvimento desigual;
- late bloomers;
- prodígios;
- jogadores que não chegam ao profissional;
- empréstimos para desenvolvimento;
- contratos de formação/profissionais.

## 24. Reputação e status social

Reputação deve existir para:

- clubes;
- jogadores;
- treinadores;
- agentes;
- scouts;
- ligas;
- competições;
- países.

Deve crescer e cair com o tempo.

Adicionar distinções:

- reputação local;
- nacional;
- continental;
- mundial.

## 25. Ídolos, história e legado

Registrar memória histórica:

- recordes;
- títulos;
- maiores artilheiros;
- maiores transferências;
- jogadores com mais partidas;
- técnicos históricos;
- sequências;
- rivalidades;
- partidas lendárias;
- ídolos;
- vilões;
- promessas que fracassaram;
- vendas traumáticas.

Ídolo não deve ser apenas uma flag. Deve surgir de tempo + desempenho + momentos + identificação + títulos + lealdade.

## 26. Rivalidades dinâmicas

Rivalidades podem nascer ou crescer por:

- proximidade geográfica;
- disputa por títulos;
- finais;
- brigas;
- transferências polêmicas;
- técnicos/jogadores provocando;
- rebaixamentos;
- decisões controversas;
- sequência histórica.

Rivalidades também podem esfriar ao longo de décadas.

## 27. Disciplina e arbitragem

Criar:

- faltas;
- cartões;
- suspensões;
- tribunais;
- recursos;
- multas;
- árbitros com perfil;
- rigor;
- tolerância;
- erro;
- VAR quando a competição usa;
- bans adicionais.

## 28. Arbitragem e eventos controversos

Eventos podem gerar narrativa:

- pênalti polêmico;
- erro grave;
- gol anulado;
- expulsão contestada;
- invasão;
- confusão;
- crítica pública do treinador;
- punição da federação.

## 29. Moral, forma e confiança

Separar:

- moral geral;
- confiança no treinador;
- felicidade contratual;
- felicidade com minutos;
- felicidade com posição/função;
- satisfação com clube;
- adaptação ao país;
- integração social;
- forma recente;
- confiança esportiva.

## 30. Integração/adaptação de novas contratações

Um atleta contratado não deve render imediatamente de forma neutra.

Fatores:

- idioma;
- país;
- clima;
- distância familiar;
- amigos/compatriotas;
- personalidade;
- papel;
- estilo tático;
- pressão;
- tamanho do clube;
- expectativa da torcida;
- preço pago.

## 31. Eventos pessoais e vida fora de campo

Sem virar simulador de vida, eventos raros podem afetar carreira:

- nascimento de filho;
- desejo de voltar ao país;
- dificuldade familiar de adaptação;
- problemas disciplinares;
- perda de foco;
- crise de confiança;
- aposentadoria antecipada;
- desejo de estudar/treinar para virar técnico.

Devem ser raros, explicáveis e não caricatos.

## 32. Comercial e marca

Jogadores podem ter valor comercial distinto do esportivo.

Fatores:

- reputação;
- nacionalidade;
- carisma;
- mídia;
- redes sociais abstratas;
- status de estrela;
- mercado internacional.

Isso pode justificar contratação cara para diretorias específicas.

## 33. Patrocínio e comercial

Clubes devem negociar contratos comerciais com:

- valor fixo;
- duração;
- bônus de desempenho;
- exposição internacional;
- cláusulas de saída.

Títulos e estrelas aumentam poder comercial.

## 34. Banco de dados e persistência

Migrar gradualmente a verdade persistente para uma camada de save robusta.

Precisamos salvar:

- mundo;
- histórico;
- relações;
- contratos;
- promessas;
- lesões;
- vulnerabilidades;
- rumores;
- negociações abertas;
- staff;
- finanças;
- reputações;
- rivalidades;
- notícias;
- estatísticas históricas.

Salvar apenas jogadores e tabela destruiria a continuidade emergente.

## 35. Motor narrativo

Separar fato de narrativa.

Um evento factual pode gerar interpretações distintas.

Exemplo:

`jogador pede transferência`

pode gerar:

- comunicado oficial neutro;
- tabloide dizendo que houve briga;
- torcida atacando jogador;
- agente defendendo atleta;
- treinador minimizando crise;
- diretoria prometendo que não venderá.

A narrativa deve emergir dos fatos, não inventar resultados que o motor não registrou.

## 36. Auditoria de causalidade

Todo sistema complexo deve registrar "por que" uma decisão ocorreu.

Exemplos:

- por que o clube contratou;
- por que o atleta recusou;
- por que a diretoria demitiu;
- por que o jovem não evoluiu;
- por que houve lesão;
- por que a torcida está irritada.

Isso ajuda tanto o jogador quanto o balanceamento técnico do simulador.

## Prioridades sugeridas

### Fundação imediata

1. relógio diário;
2. persistência/save completo;
3. personalidade e relações;
4. treinamento diário;
5. integração médica completa;
6. negociação/recrutamento persistente ao longo de dias;
7. imprensa e torcida persistentes;
8. diretoria/promessas/confiança;
9. múltiplas competições;
10. histórico narrativo.

### Segunda camada

- staff completo;
- infraestrutura;
- finanças profundas;
- carreira de treinadores;
- rivalidades dinâmicas;
- base aprofundada;
- registro/regras nacionais;
- seleções.

### Princípio de implementação

Implementar cada sistema como módulo desacoplado, mas conectável por eventos. O ideal é um barramento interno de eventos do mundo, por exemplo:

`TransferRequested`, `PlayerInjured`, `ManagerFired`, `PromiseBroken`, `RumourLeaked`, `FanPressureChanged`, `ContractExpired`, `YouthPromoted`, `MatchCompleted`.

Assim, torcida, imprensa, diretoria, finanças, moral e histórico podem reagir ao mesmo fato sem o módulo de origem precisar conhecer todos os consumidores.
