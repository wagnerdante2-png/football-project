# The Touchline — Beta 0.2.0-beta.1

Esta é a primeira candidata de teste navegável da interface atual. O objetivo desta beta não é declarar todos os módulos concluídos; é validar o fluxo principal da carreira, estabilidade da navegação e integração entre o mundo simulado e as primeiras camadas factuais.

## Smoke test recomendado

1. Abrir a aplicação e entrar no fluxo de criação do treinador.
2. Percorrer as seis etapas da criação e escolher um clube.
3. Confirmar que a tela inicial da carreira abre sem erro no selo `BETA`.
4. Abrir **Elenco** e verificar tabela, condição, moral e marcação `REAL` quando houver atleta com vínculo factual verificado.
5. Clicar em pelo menos três jogadores diferentes e validar as abas **Carreira** e **Dados**.
6. Conferir que contrato, salário, valor e interesse de mercado aparecem identificados como dados do engine, enquanto identidade/vínculo e proveniência permanecem separados.
7. Abrir **Táticas**, clicar em jogadores no campo e confirmar abertura da mesma ficha.
8. Abrir **Calendário** e verificar partidas e rodadas.
9. Usar **Continuar** por alguns dias e conferir se data/calendário permanecem funcionais.
10. Abrir **Transferências**, testar busca, filtro por função e adicionar/remover jogadores da shortlist.
11. Sair de Transferências e voltar; confirmar que a shortlist continua salva no navegador.
12. Abrir o selo **BETA** no canto inferior. Se houver ocorrências, usar **Copiar diagnóstico** antes de recarregar a página.

## Critérios para aprovar esta candidata

- nenhuma tela branca;
- nenhum erro bloqueador registrado pelo monitor de runtime;
- criação de treinador completa;
- navegação principal responsiva;
- elenco e táticas abrem fichas de atleta corretamente;
- calendário avança sem quebrar a interface;
- mercado beta carrega o snapshot e mantém shortlist;
- dados simulados não são apresentados como fatos públicos.

## Limites conhecidos desta beta

- a interface principal ainda não expõe todos os motores profundos já existentes no repositório;
- negociações completas de compra/venda não foram conectadas ao novo menu de Transferências nesta candidata;
- contratos, salários, valores de mercado e interesse mostrados na nova ficha são uma camada de apresentação do engine para a beta e não dados públicos factuais;
- a cobertura factual de jogadores depende do snapshot verificado e permanece parcial;
- persistência completa de uma carreira entre sessões ainda deve ser validada/integrada à nova shell antes de uma beta mais ampla.

## Próximo gate

Depois do primeiro smoke test manual, corrigir somente bloqueadores e então integrar progressivamente os motores existentes de scouting, medicina, economia/negociação e save à shell atual, evitando reconstruí-los em paralelo.
