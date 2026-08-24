# Technical Staff Engine

Este bloco modela a comissão como população persistente de profissionais, não como bônus estático.

## Escopo concluído
- 32 funções técnicas, científicas, médicas, psicológicas, de coordenação, base, scouting e welfare.
- Atributos específicos, reputação, personalidade, filosofia, experiência, potencial e qualificações.
- Afinidade treinador-profissional, profissional-elenco e profissional-jogador.
- Lealdade ao clube e ao treinador, satisfação, fadiga, stress, carga e harmonia coletiva.
- Relações staff-staff com confiança, respeito, atrito e sinergia.
- Mercado, contratação, dispensa, poaching, aposentadoria e entourage do treinador.
- Contratos individuais, renovação, salário, segurança e promoção.
- Licenças/especializações e formação contínua.
- Ambição para liderança e pipeline de candidatos a treinador principal.
- Delegação de responsabilidades com impacto nos departamentos.
- Conflitos internos por ego, metodologia, jogadores e influência.
- Efeitos reais sobre treino, preparação física, medicina, reabilitação, nutrição, psicologia, base, análise e coordenação.
- Processamento diário integrado ao calendário do mundo.
- Snapshot/restore próprio em `staff-career.ts` e `technical-staff.ts`, pronto para inclusão no agregador de saves.

## Princípio
Qualidade individual != qualidade do departamento != qualidade da comissão.

O rendimento de um profissional depende de competência, função, satisfação, harmonia, afinidade com treinador e atletas e compatibilidade com a filosofia institucional. Um profissional excelente pode ser uma contratação ruim para determinado ambiente.

## Fronteira arquitetural
`footballCoordinator` e `squadCoordinator` permanecem neste bloco como funções operacionais/técnicas. A próxima camada, de governança, deve criar diretor de futebol/esportivo, executivo, presidente, proprietário e conselho como agentes institucionais separados, com autoridade sobre treinador e estrutura técnica.
