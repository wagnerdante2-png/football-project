# The Touchline — Beta 0.2.0-beta.1

Esta candidata existe para testar coerência sistêmica, não para uma carreira longa. O objetivo é provocar as funcionalidades já implementadas, observar consequências e registrar qualquer quebra antes de aprofundar as fronts.

## Smoke test principal

1. Abrir a aplicação, passar pelo login local e criar o treinador nas seis etapas.
2. Escolher um clube e confirmar que a carreira abre sem ocorrência no selo `BETA`.
3. Abrir **Elenco**, conferir condição/moral e abrir fichas de jogadores procedurais e, quando houver, factuais (`REAL`).
4. Em **Táticas**, abrir a ficha dos atletas pelo campo.
5. Em **Treino**, alterar foco/intensidade e confirmar que o plano permanece ao navegar.
6. Usar **Continuar** por vários dias e conferir data, treinos, partidas e mudanças de condição/moral.
7. Em **Médico**, conferir risco, disponibilidade, histórico, vulnerabilidades e recuperação.
8. Em **Transferências**, selecionar um alvo, observar o relatório, adicionar à shortlist e aprofundar scouting.
9. Com um alvo selecionado e informação suficiente, usar **Iniciar negociação**. Conferir contrapropostas, agente, atleta, vendedor, vazamentos e resultado no histórico.
10. Abrir **Comitê de Futebol** em `Sistemas` e conferir os processos de recrutamento produzidos pelo engine econômico/IA.
11. Em **Comissão Técnica**, contratar e/ou dispensar um profissional e observar a atualização da estrutura.
12. Em **Analytics**, depois de partidas disputadas, conferir gols, chutes, xG, defesas, cartões e impacto derivados dos eventos do match engine.
13. Em **Clube**, conferir saldo, orçamento de transferências, folha e teto salarial do engine econômico.
14. Em **Mundo**, conferir classificação e partidas processadas.
15. Em `Sistemas > Mercado de Treinadores`, testar uma vaga orgânica se existir. Se não existir, usar **Abrir vaga de teste**; candidatar-se e avançar os dias necessários para testar shortlist, entrevista, negociação contratual e proposta final.
16. Em `Sistemas > Sport News & Imprensa`, avançar até existir uma edição semanal; preparar uma coletiva, responder às perguntas e observar reação pública.
17. Em **Escolinha**, criar o projeto municipal opcional. Testar doação para campo melhor, presente de material, bolsas, busca de patrocinador e alteração do foco de treino de um jovem. Confirmar que o dinheiro sai da carteira pessoal do treinador.
18. Em **Salvar**, salvar localmente. Depois alterar alguma coisa (avançar dias, mudar treino, criar escolinha/negociação), carregar e confirmar restauração. Testar também exportar/importar JSON.
19. Abrir o selo **BETA**. Se houver ocorrências, usar **Copiar diagnóstico** antes de recarregar.

## Matriz dos motores nesta beta

### Interativos e expostos

- criação e carreira do treinador;
- elenco e ficha do atleta;
- tática e escalação visual;
- treino diário;
- scouting e shortlist;
- departamento médico;
- comissão técnica completa (contratação/demissão);
- negociação de jogador (processo de negociação e histórico);
- governança/comitê de recrutamento;
- economia do clube, contratos e valores do engine;
- analytics de partidas;
- mercado de treinadores, candidatura, entrevista e contrato;
- Sport News e coletiva de imprensa;
- Escolinha de Futebol, carteira pessoal e doações;
- save/load local e arquivo JSON composto.

### Automáticos ao usar `Continuar`

- treinamento/descanso e integração treino–medicina;
- lesões, recuperação e risco físico;
- evolução e envelhecimento do treinador;
- vida pessoal/social e processos temporais;
- relações, vestiário e interações humanas;
- emprego, demissão/ofertas e mercado de treinadores;
- carreira e evolução de staff;
- governança, patrimônio, comercial e finanças institucionais;
- scouting por rodada;
- partidas domésticas, copas, continental e seleções;
- conflitos de datas/janelas internacionais;
- Sport News semanal;
- Escolinha e consequências de longo prazo;
- deduplicação periódica dos elencos.

## Persistência da beta

O save da beta é composto deliberadamente por duas fundações já existentes:

- **Base V15**: preserva o objeto `World` jogável (elencos, fixtures, classificação) e estados legados de calendário, treinador, vida social, emprego, entrevistas etc.;
- **World Foundation V22**: preserva os estados novos de mundo, dados de futebol, Escolinha, finanças pessoais, pessoas reais, staff, treino, medicina, scouting e negociações.

A beta acrescenta ao envelope a persistência explícita de economia/contratos, governança de recrutamento e sala de imprensa, para que o teste de salvar/carregar não perca esses estados.

## Critérios para aprovar esta candidata

- nenhuma tela branca;
- nenhum erro bloqueador no monitor `BETA`;
- `Continuar` processa dias e partidas sem quebrar a shell;
- todos os módulos interativos acima abrem e executam suas ações;
- alterações de treino, staff, scouting, coletiva e Escolinha afetam o mesmo mundo da carreira;
- save/load restaura data e alterações sistêmicas de forma coerente;
- dados simulados continuam identificados como engine/estimativa, sem serem apresentados como fatos públicos.

## Limites deliberados

- a cobertura factual 2026 de jogadores/rostos/escudos continua incremental e nunca deve ser completada com fatos inventados;
- o botão de negociação da beta testa o motor canônico de negociação; a movimentação financeira e registral definitiva de jogadores continua ocorrendo pelo fluxo econômico existente, para não criar uma segunda regra de transferência na UI;
- `Abrir vaga de teste` é um gatilho explícito de QA para permitir testar o mercado de treinadores em sessão curta; não representa um evento orgânico da carreira;
- algumas consequências profundas são observáveis ao avançar dias, e ainda não possuem front final própria.

## Gate seguinte

Depois deste smoke test, não ampliar escopo. Corrigir apenas bloqueadores, incoerências e problemas de UX encontrados durante o teste; a próxima fase é melhorar fronts e apresentação sobre os mesmos motores.