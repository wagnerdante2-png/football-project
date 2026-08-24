# Manager Interaction Engine

## Princípio

O treinador não é um menu de respostas prontas. Ele é um agente humano com personalidade, estado emocional, autoridade e memória relacional. Cada interação é contextual e produz consequências persistentes.

A decisão é calculada por três camadas:

1. **Perfil relativamente estável**: disciplina, empatia, paciência, assertividade, proteção pública, diplomacia, confronto, pragmatismo, consistência, habilidade com mídia, adaptabilidade e capacidade de perdoar.
2. **Estado atual**: estresse, autoridade, pressão de torcida/imprensa/diretoria e crise do vestiário.
3. **Histórico específico com cada atleta**: confiança, respeito, proximidade, abertura, atrito, medo e credibilidade.

O perfil inicial pode ser definido na criação do personagem por `setManagerCreationProfile()`, mas não é congelado. As escolhas recorrentes geram pequenas mudanças de personalidade ao longo dos anos.

## Relações dinâmicas

Cada par treinador × jogador guarda histórico próprio. Uma decisão passada continua influenciando futuras conversas. Proteger um atleta em uma crise familiar pode elevar confiança. Criticá-lo publicamente por um rumor falso pode quebrar credibilidade por meses. Cobrança firme pode aumentar respeito em um atleta profissional e provocar atrito num atleta de temperamento frágil.

O objetivo é evitar uma lógica binária de `feliz/triste`. O mesmo jogador pode simultaneamente respeitar muito o treinador, confiar pouco nele e ter alto nível de atrito.

## Gatilhos atuais

O motor reage a eventos já existentes no mundo:

- escândalo, saída noturna, incidente público e repercussão em redes sociais;
- doença ou morte na família, conflito de relacionamento e licença-paternidade;
- rumor ou exposição pública de relacionamento;
- queda de satisfação/rendimento detectada pelo vestiário;
- crise coletiva de vestiário;
- pedido de transferência;
- notícias que envolvam diretamente um atleta.

Cada evento pode abrir um processo de decisão com prazo. Para clubes controlados pela IA, o treinador escolhe com base no próprio perfil e contexto; a API `resolveManagerInteraction()` deixa a mesma estrutura pronta para decisões manuais do usuário.

## Opções contextuais

Não existe resposta universalmente correta. Entre as ações possíveis estão:

- apoio privado;
- suporte profissional;
- dar espaço;
- advertência reservada;
- advertência formal;
- afastamento temporário;
- proteção pública com cobrança privada;
- crítica pública;
- mediação direta;
- mediação pelo capitão;
- separação de envolvidos;
- tolerância zero;
- silêncio diante da imprensa;
- defesa pública do atleta;
- confirmação objetiva dos fatos;
- distanciamento institucional;
- confronto com a imprensa;
- estímulo, cobrança, banco ou desafio por queda de rendimento.

As opções disponíveis dependem do tipo e da gravidade do caso. Fatores como verdade do rumor, publicidade, profissionalismo, temperamento, relação anterior, cultura disciplinar do clube e pressão externa alteram a conveniência de cada resposta.

## Exemplo causal

`Jogador é visto em evento noturno antes de uma partida`

→ Human Life Engine publica `PersonalLifeEvent`

→ Manager Interaction Engine classifica gravidade, repercussão e contexto

→ treinador disciplinador pode preferir advertência ou afastamento

→ treinador empático pode proteger publicamente e cobrar em privado

→ jogador profissional pode responder bem à cobrança firme

→ jogador temperamental pode perder confiança e aumentar atrito

→ moral e autoridade são atualizadas

→ a memória fica persistida no relacionamento

→ futuras conversas partem desse novo histórico

## Evolução do treinador

Escolhas repetidas geram deriva lenta, não mudanças bruscas. Um treinador que passa anos usando confronto tende a ficar um pouco mais confrontador; quem media problemas desenvolve diplomacia; quem aprende a lidar com mídia melhora sua habilidade pública; estresse prolongado pode reduzir paciência.

Assim, o personagem criado em 2026 não precisa ter a mesma personalidade em 2040.

## IA

Clubes controlados pelo computador usam exatamente o mesmo workflow. A IA pontua cada resposta usando personalidade do treinador, personalidade do jogador, relação prévia, cultura do clube, pressão institucional, gravidade e publicidade. Isso permite que diferentes técnicos reajam de forma coerentemente diferente ao mesmo acontecimento.

## Persistência

O save V7 guarda:

- perfis dos treinadores;
- evolução de personalidade;
- relações treinador × atleta;
- histórico das interações;
- decisões tomadas;
- processos ainda pendentes.

A próxima etapa visual poderá expor esses processos numa caixa de entrada/interações sem alterar a lógica do motor.
