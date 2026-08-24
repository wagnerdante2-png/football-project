# Training Engine 2.0

## Objetivo

O treinamento deixou de ser um incremento aleatório de atributo e passou a ser um sistema causal diário. A sessão escolhida afeta desenvolvimento, familiaridade tática, condição, fadiga, carga aguda/crônica, risco médico e rendimento na partida seguinte.

## Microciclos

Cada clube possui um estado persistente com preset de microciclo, qualidade de instalações, ciência esportiva, coordenação médica e integração com a base. Presets atuais: recoveryWeek, balanced, development, tactical, physicalBuild, congested e preMatch.

A agenda também reage ao calendário: pós-jogo prioriza recuperação e vídeo; véspera reduz carga e trabalha shape/bola parada; calendário congestionado reduz volume; quarta e domingo são usados como descanso programado quando não colidem com preparação imediata de jogo.

## Sessões

O catálogo contempla descanso, recuperação, reabilitação, resistência, velocidade, técnica, passe, finalização, defesa, posicionamento, pressão, transição, organização coletiva, unidades ofensiva/defensiva, bolas paradas, vídeo, adversário específico, função, pé fraco e nova posição.

Cada sessão possui intensidade, duração, unidade participante, atributos-alvo, eixos táticos, carga e exposição médica. Jogadores lesionados só podem participar das sessões compatíveis com a fase da recuperação.

## Carga física

Cada atleta mantém janelas móveis de 7 e 28 dias. O motor calcula carga aguda, carga crônica, razão aguda/crônica, monotonia, strain, fadiga, prontidão e dias consecutivos de sobrecarga. Ciência esportiva e condição física alteram a resposta individual.

Descanso não é ausência de processamento: ele adiciona zero às janelas de carga, reduz fadiga/strain/monotonia, melhora condição e recalcula prontidão.

## Desenvolvimento

Ganho de atributos depende de idade, espaço entre CA e PA, intensidade, qualidade da instalação, química do vestiário, prontidão e fatores pessoais. Jogadores no teto de desenvolvimento têm ganho muito menor. O treino não ignora a vida pessoal nem a condição do atleta.

Treinos individuais podem focar atributo, função, pé fraco ou adaptação a nova posição. Esses processos têm progresso persistente e satisfação do jogador.

## Familiaridade tática

O motor mantém seis eixos: construção, pressão, organização defensiva, transição, bola parada e familiaridade de função. Sessões específicas melhoram eixos específicos. Isso permite que uma mudança tática tenha custo de aprendizagem em vez de funcionar instantaneamente.

## Medicina

Sobrecarga gera TrainingOverloadWarning com razão aguda/crônica, strain, prontidão e pressão de risco. O bridge `training-medical.ts` transforma parte desses alertas em lesões reais, ponderando predisposição, durabilidade e tipos de lesão mais compatíveis com sobrecarga. A lesão entra no mesmo histórico anatômico e de recorrência do Medical Engine.

## Efeito no jogo

A prontidão do treino produz um modificador pequeno e temporário de rendimento no match engine. Ele é combinado com medicina, vida pessoal e vestiário, sem alterar permanentemente os atributos-base.

## Persistência

O Save V6 grava estado de treinamento completo: microciclo, infraestrutura relacionada ao treino, cargas individuais, prontidão, familiaridade tática, progresso de função/pé/posição, plano individual e histórico de sessões.

## Fronteira deliberada

Esta rodada termina antes do sistema de treinador. O Training Engine usa a estrutura do clube, mas ainda não atribui qualidade, filosofia, relacionamento ou decisões a um treinador específico. A próxima frente deverá definir o treinador como agente persistente e somente então conectar sua capacidade ao treino, team talks, seleção, autoridade e carreira.
