# Motor Médico e de Lesões

O módulo médico foi desenhado para que lesões não sejam apenas um contador de dias fora. Cada ocorrência deixa contexto anatômico e pode alterar temporária ou permanentemente o comportamento do jogador.

## Gravidade

Níveis utilizados:

1. `minor` — leve: contusões e incômodos de curta duração.
2. `moderate` — moderada: distensões e entorses com ausência curta/média.
3. `serious` — séria: lesões estruturais com reabilitação relevante.
4. `severe` — grave: fraturas e lesões importantes com longa recuperação.
5. `critical` — gravíssima: ruptura de LCA, tendão de Aquiles, fraturas extensas etc.; risco de sequela funcional.
6. `careerThreatening` — ameaça à carreira: lesões extremas ou agravadas por histórico/recorrência; podem deixar perdas permanentes e aumentar muito a vulnerabilidade futura.

A gravidade final pode subir ou cair em relação à gravidade-base conforme o evento e o histórico anatômico do jogador.

## Anatomia e lateralidade

Cada lesão registra:

- região corporal;
- tecido afetado (músculo, tendão, ligamento, osso, articulação, nervo, concussão ou contusão);
- lado esquerdo, direito, central ou bilateral;
- se atingiu o lado dominante do jogador;
- contexto: partida, contato, sobrecarga, treino ou recorrência.

O motor mantém pé dominante (`right`, `left`, `both`) separado do restante dos atributos.

## Histórico físico

Cada jogador possui um perfil médico persistente com:

- predisposição a lesões;
- tolerância à dor;
- capacidade de recuperação;
- durabilidade física;
- histórico completo;
- lesões ativas;
- jogos perdidos;
- tempo equivalente afastado;
- vulnerabilidades por região/lado/tecido;
- déficits funcionais pós-lesão.

O histórico não desaparece quando o atleta volta a jogar.

## Fragilidade pós-lesão

Uma lesão estrutural pode criar uma vulnerabilidade anatômica. Exemplo:

`fratura da tíbia direita → maior suscetibilidade futura na perna direita → maior chance de nova lesão naquela região`

A suscetibilidade cai lentamente com o tempo, mas lesões graves deixam um piso associado à cronicidade. Recorrências elevam a cronicidade e tornam o problema progressivamente mais relevante.

## Déficits funcionais

Lesões graves geram déficits temporários ligados aos atributos efetivamente usados no match engine. Esses déficits são percentuais e recuperam-se gradualmente após a liberação médica.

Exemplo solicitado:

`jogador destro → fratura grave na perna direita → finalização/técnica/passe perdem confiança temporariamente → retorno ao treino reduz o déficit rodada a rodada → a região permanece mais suscetível a nova lesão`

Se a lesão for `critical` ou `careerThreatening`, pode existir um piso permanente de perda funcional.

Outros cenários contemplados:

- LCA: velocidade e resistência sofrem forte impacto; alta recorrência no joelho afetado.
- Aquiles: perda temporária acentuada de explosão/velocidade.
- menisco: vulnerabilidade articular crônica possível.
- lesão lombar: risco maior de recorrência por sobrecarga.
- luxação de ombro: alta recorrência, especialmente relevante para goleiros.
- fratura de mão: impacto direto em atributos de goleiro.
- concussão: redução temporária de decisão e posicionamento.
- distensões musculares: fortemente ligadas a fadiga, idade, ritmo e pressão tática.

## Fases de recuperação

A evolução segue:

`aguda → imobilização (quando aplicável) → reabilitação → retorno ao treino → retorno ao jogo → resolvida`

O jogador em `returnToPlay` pode voltar, porém com condição limitada e déficits ainda presentes. Isso evita a lógica binária de “machucado / 100% recuperado”.

## Risco dinâmico

A probabilidade de nova lesão considera:

- participação recente;
- condição física;
- idade;
- ritmo e intensidade de pressão da equipe;
- predisposição individual;
- durabilidade;
- histórico e fragilidades anatômicas;
- recorrências anteriores.

Assim, dois atletas com o mesmo CA e mesma idade podem ter carreiras físicas completamente diferentes.

## Integração

`src/injuries.ts` contém o motor médico.

`src/medical-simulation.ts` é a camada que:

1. remove atletas indisponíveis do grupo elegível antes da escalação;
2. aplica déficits funcionais temporários aos atributos usados pela partida;
3. executa o match engine normal;
4. restaura os atributos-base;
5. simula novas ocorrências médicas e a evolução da recuperação.

`src/medical-ui.ts` contém a interface do Centro Médico, com disponibilidade, risco, lesões ativas, déficits, fragilidades e histórico completo.
