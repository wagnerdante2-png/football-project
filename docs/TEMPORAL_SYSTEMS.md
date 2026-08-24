# Processos temporais do mundo

O Football Project passa a tratar decisões e estados como processos que ocupam dias, não como ações instantâneas.

## Objetivo

Uma carreira longa precisa de causalidade temporal. Negociações, lesões, contratos, scouting e decisões institucionais devem evoluir em etapas e sofrer interferência do que acontece entre uma etapa e outra.

## Medicina por calendário

O motor médico continua usando a gravidade anatômica e as vulnerabilidades existentes, mas agora cada lesão recebe uma linha temporal com:

- data de início;
- retorno estimado ao treino;
- retorno estimado ao jogo;
- data projetada de recuperação física plena;
- fases intermediárias de recuperação;
- evento de alta;
- persistência da vulnerabilidade e dos déficits funcionais.

A estimativa considera gravidade, duração-base e capacidade individual de recuperação. A recuperação estrutural continua sendo processada em blocos semanais para preservar o balanceamento já existente, enquanto a apresentação e as reações institucionais passam a operar diariamente.

## Negociações

Uma negociação aberta recebe:

- data de abertura;
- próxima data prevista de interação;
- prazo-limite;
- cadência baseada em urgência e paciência do agente;
- risco crescente de vazamento;
- possibilidade de ultimato;
- colapso por expiração do prazo.

A exposição pública pode evoluir de privada para rumor, noticiada e pública. Quanto mais tempo a negociação permanece aberta, maior a pressão acumulada.

## Contratos

Contratos passam a gerar marcos de alerta antes da data projetada de término. O motor publica eventos nas janelas de aproximadamente 180, 90, 30 e 7 dias, permitindo que diretoria, jogador, agente e imprensa reajam antes da expiração.

## Recrutamento adiado

Processos de recrutamento em estado `deferred` ganham data de revisão. A urgência determina quando o comitê volta a discutir o jogador.

## Event bus

Cada mudança temporal publica eventos. Isso permite que módulos independentes reajam sem acoplamento direto.

Exemplo:

`NegotiationLeaked`
→ notícia
→ pressão da torcida
→ pressão da imprensa
→ reação da diretoria
→ possível mudança no poder de barganha

## Save

O formato de save foi atualizado para schema V2. Além do mundo, calendário, event bus e memória institucional, agora também são persistidos os cronogramas médicos, cronogramas de negociação, avisos de contrato e revisões de recrutamento.

Saves V1 continuam carregáveis; a camada temporal é reconstruída quando ausente.
