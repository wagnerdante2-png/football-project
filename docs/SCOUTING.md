# Scouting e recrutamento

O Football Project separa a **verdade interna do motor** daquilo que cada clube conhece.

## Princípio

CA, PA, atributos e valor real existem no núcleo, mas um clube rival não recebe esses números diretamente. O recrutamento trabalha com faixas estimadas, confiança e conhecimento regional.

## Scouts individuais

Cada clube possui scouts próprios em `src/staff.ts`. Cada scout tem:

- Julgar habilidade;
- Julgar potencial;
- Adaptabilidade;
- Reputação;
- Região preferencial;
- limite de observações simultâneas.

Clubes mais estruturados tendem a possuir equipes maiores e melhores, mas ainda podem errar avaliações.

## Regiões

A rede de conhecimento é dividida em:

- Brasil;
- América do Sul;
- Europa;
- África;
- América do Norte.

O conhecimento regional melhora quando scouts trabalham naquela região e decai lentamente se a rede deixa de ser utilizada. Um especialista em uma região recebe bônus de velocidade de observação.

## Relatório

Um relatório pode mostrar, por exemplo:

`CA 64–76 · PA 75–91 · confiança 41%`

Conforme a observação avança, os intervalos diminuem e mais atributos são revelados. Conhecimento completo só existe para jogadores do próprio elenco ou após observação suficiente.

## IA de transferências

A IA de mercado não deve escolher reforços lendo CA/PA verdadeiros. Em `src/economy.ts`, os candidatos de transferência passam pelo `scoutingCandidates()` e são ordenados usando apenas:

- habilidade estimada;
- potencial estimado;
- confiança do relatório;
- idade;
- recomendação do scouting;
- valor estimado;
- necessidade posicional e orçamento.

Se um alvo parece interessante, mas a confiança é baixa, a IA prefere enviar um scout e adiar a decisão. O clube vendedor, por outro lado, conhece o próprio atleta e pode pedir um valor diferente da estimativa do comprador.

Isso permite erros realistas: barganhas, jogadores superestimados, talentos ignorados e clubes com redes de scouting melhores encontrando oportunidades antes dos rivais.
