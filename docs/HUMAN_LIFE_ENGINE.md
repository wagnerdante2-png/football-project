# Human Life Engine

O objetivo deste módulo não é criar um simulador de namoro separado do futebol. A proposta é fazer pessoas existirem como pessoas e permitir que acontecimentos cotidianos, relações humanas e exposição pública produzam efeitos pequenos, médios ou raramente grandes sobre o universo esportivo.

## Princípio

Nenhum evento pessoal deve automaticamente significar falta de profissionalismo. A maior parte dos acontecimentos tem efeito pequeno ou nenhum efeito esportivo direto. O impacto depende de gravidade, duração, personalidade, suporte social, exposição pública e contexto.

Exemplo: uma parceira jogar em clube rival não reduz profissionalismo por si só. O que pode surgir é pressão pública, perguntas da imprensa e narrativa de torcida. O rendimento só cai se a carga emocional resultante for relevante.

## Pessoas

O mundo social aceita jogadores, treinadores, staff, jornalistas, representantes de torcida, familiares, parceiros, celebridades e outros futebolistas. Cada pessoa pode ter fama, interesse da mídia, privacidade, temperamento, profissionalismo e sociabilidade.

## Relações

Relações persistentes incluem amizade, amizade próxima, mentoria, rivalidade, namoro, casamento, família, relação profissional e conflito. Jogadores do mesmo elenco formam um grafo social inicial e novas relações podem surgir com o tempo.

Relacionamentos amorosos podem envolver pessoas privadas, figuras públicas ou outras pessoas do futebol. A fama da outra pessoa muda a volatilidade midiática, não o valor moral da relação.

## Vida familiar

O motor contempla preocupação com familiar doente, apoio familiar, gravidez, nascimento, licença-paternidade, luto e visitas familiares. Esses eventos podem afetar concentração, moral, disponibilidade e suporte social por períodos distintos.

Licença-paternidade gera indisponibilidade legítima por alguns dias. Um problema familiar grave pode reduzir temporariamente desempenho sem alterar atributos permanentes do atleta.

## Vida social e cotidiana

Eventos possíveis incluem saída noturna, encontro casual com torcedores, jantar de elenco, ação beneficente, participação em mídia, reação em redes sociais e incidentes públicos. Frequência e consequência dependem do perfil individual.

Uma ida a restaurante, bar ou evento social não é tratada automaticamente como problema disciplinar. A repercussão muda conforme horário, recorrência, profissionalismo, momento esportivo e exposição.

## Imprensa e fama

Pessoas de alta visibilidade geram maior interesse público. Relacionamentos com celebridades podem ampliar exposição positiva ou negativa. Rumores podem ser verdadeiros, falsos ou simplesmente não confirmados.

Alguns eventos geram decisões de múltipla escolha: ignorar, advertir internamente, responder publicamente, negar rumor, permanecer em silêncio ou confirmar uma informação. Cada resposta altera de forma diferente exposição, moral e relacionamento.

## Impacto esportivo

O módulo calcula uma carga pessoal agregada por atleta:

`concentração + moral + fadiga + disponibilidade + pressão de mídia + suporte social → fator temporário de desempenho`

Esse fator é aplicado aos atributos efetivos usados apenas na partida. Os atributos-base não são modificados. Assim, um atleta que vive uma semana pessoal difícil pode atuar 3% a 6% abaixo de sua capacidade sem perder permanentemente CA ou atributos.

## Mundo social não-jogador

`social-world.ts` cria atores sociais persistentes para treinadores, assistentes, fisioterapeutas, diretores, jornalistas e lideranças de torcida. Eles possuem influência, credibilidade, estresse e relação com o clube.

Treinadores podem acumular desgaste; staff pode enfrentar compromissos familiares; jornalistas publicam bastidores com graus diferentes de credibilidade; grupos de torcedores podem aumentar apoio ou cobrança.

## Event bus

Eventos pessoais entram no mesmo barramento causal do restante do jogo. Isso permite que imprensa, torcida, diretoria e outros sistemas reajam sem acoplamento direto.

Exemplo:

`jogador é visto em evento noturno → PersonalLifeEvent → mídia avalia publicidade → torcida reage → clube escolhe resposta → PersonalDecisionMade → pressão institucional é atualizada`

## Persistência

Human Life e Social World fazem parte do save V4. Relações, acontecimentos, escolhas, perfis e atores sociais sobrevivem a carregamento e devem continuar por múltiplas temporadas.

## Regra de realismo

O motor deve priorizar plausibilidade e frequência realista. Grandes dramas são raros. Eventos banais são muito mais comuns e frequentemente não produzem consequência esportiva relevante. A vida pessoal adiciona contexto e causalidade ao futebol; ela não deve transformar cada semana em uma novela.