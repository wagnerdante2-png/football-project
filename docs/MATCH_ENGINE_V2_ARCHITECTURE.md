# Match Engine V2

O Match Engine V2 substitui progressivamente a simulação agregada atual por uma simulação espacial, temporal e causal.

## Princípios
- Campo real em metros (padrão 105x68), com dimensões configuráveis pelo estádio/clube.
- Jogadores existem como agentes no espaço e não como simples forças agregadas.
- Formação é um shape-base; função, tática, bola, adversário, placar e momento deslocam esse shape.
- Percepção é limitada por distância e orientação; o jogador não possui visão onisciente do campo.
- Controle territorial é calculado por influência espacial.
- Bola possui posição, velocidade, altura, velocidade vertical e spin.
- Árbitro possui perfil próprio; faltas, cartões, vantagem e VAR dependem de contexto.
- Impedimento é avaliado no momento do passe.
- Substituições obedecem limite, janelas e contexto da partida.
- A IA do treinador reage a fadiga, cartão, placar, momentum e situação tática.
- O motor deve ser determinístico por seed para permitir depuração e replay.

## Camadas implementadas nesta etapa
### `match-core-v2.ts`
Pitch, bola, estado vivo de jogador/time, formações, shape tático, posição inicial, percepção, FOV, grade de influência e linha de impedimento.

### `match-rules-v2.ts`
Regras de competição, árbitro, análise de falta, vantagem, cartão, VAR, impedimento, legalidade da partida e inteligência inicial de substituição.

### `match-stepper-v2.ts`
Stepper a 4 Hz, movimento espacial, separação, manutenção de shape, pressão, suporte, condução, passe, finalização, duelo, fadiga, posse, reinícios e substituições automáticas.

## Migração
O V2 ainda não substitui o motor de produção. Isso é deliberado: primeiro ele deve estabilizar resultados, invariantes e integração com roles/medical/training. Depois o `medical-simulation.ts` será redirecionado para o novo motor.

## Próximas camadas
1. Física de bola avançada: curva, drag, quique, colisão com trave e interceptação em trajetória.
2. Cognição por utility scoring e memória curta do jogador.
3. Roles transformadas em comportamento espacial, não bônus de atributo.
4. Team Director: transições, compactação, pressão coordenada, linha e coberturas.
5. Bola parada: lateral, escanteio, falta direta/indireta, pênalti e rotinas treinadas.
6. Arbitragem completa: mão, DOGSO, segundo amarelo, vantagem pendente, identidade equivocada e protocolos VAR.
7. Substituições e mudanças táticas do usuário durante a partida.
8. xG/xA, PPDA, field tilt, passes progressivos, zonas e mapas de ação.
9. Renderizador 2D independente da lógica.
10. Testes de determinismo, regras, placares e performance.
