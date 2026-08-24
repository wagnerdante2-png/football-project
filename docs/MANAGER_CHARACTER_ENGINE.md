# Manager Character Engine

## Objetivo

Transformar o treinador no personagem central do jogo. A criação deixa de ser apenas nome + aparência e passa a definir origem, conhecimento, reputação, preferências e contexto social. Essas escolhas moldam o começo da carreira, mas não congelam o personagem: relações, personalidade, reputação e conhecimento podem mudar com o tempo.

## Princípios

1. Biografia gera mecânica.
2. Preferência não é competência.
3. Reputação não é habilidade.
4. Conhecimento depende de formação e experiência.
5. Carreira passada cria rede, autoridade e expectativas.
6. Perfil inicial é ponto de partida, não destino.

## Blocos da criação

### Identidade
- nome, apelido, data de nascimento, idade e gênero;
- nacionalidade e segunda nacionalidade;
- cidade natal e cidade-base;
- idiomas;
- clube do coração e rivais pessoais;
- estado civil e filhos.

### Aparência
- altura;
- biotipo;
- cabelo e cor;
- barba/bigode;
- óculos;
- estilo visual: agasalho, terno, casual etc.

A aparência é narrativa/visual e não deve criar bônus esportivos artificiais.

### Carreira como jogador
Níveis: nenhum, amador, semiprofissional, profissional e elite.

Cada passagem pode registrar clube, país, período, posição, jogos, gols, capitania, títulos e prêmios.

Efeitos possíveis:
- reputação inicial;
- rede de contatos;
- autoridade percebida por atletas;
- conhecimento posicional;
- familiaridade geográfica e cultural;
- exposição de mídia.

Um ex-jogador famoso começa conhecido, mas isso não o torna automaticamente um grande treinador.

### Experiência profissional anterior
- categorias de base;
- auxiliar;
- analista;
- scout;
- preparador físico;
- treinador de goleiros;
- diretor;
- treinador principal.

Cada função alimenta áreas distintas de conhecimento.

### Formação
Níveis acadêmicos e áreas como Educação Física, Gestão Esportiva, Administração, Psicologia, Fisiologia, Estatística, Ciência de Dados, Direito, Comunicação e Medicina.

Licenças de treinador têm progressão própria.

Cursos adicionais incluem:
- arbitragem;
- gestão de futebol;
- análise de desempenho;
- psicologia esportiva;
- ciência esportiva;
- preparação física;
- scouting;
- análise de dados;
- mídia;
- liderança;
- desenvolvimento de jovens;
- bolas paradas;
- goleiros;
- direito esportivo;
- finanças.

Cursos não devem ser simples `+3`. Eles devem futuramente desbloquear qualidade de informação, decisões e opções de diálogo.

## Conhecimento

O motor já separa:
- tática;
- treinamento;
- gestão de pessoas;
- scouting;
- análise de dados;
- medicina;
- finanças;
- mídia;
- arbitragem;
- desenvolvimento de jovens;
- bolas paradas;
- goleiros;
- contratos/direito;
- networking.

Esses valores são derivados da combinação entre carreira, formação, licença e cursos.

## Personalidade

O Character Engine usa os mesmos eixos do Manager Interaction Engine:
- disciplina;
- empatia;
- paciência;
- assertividade;
- proteção pública;
- diplomacia;
- confronto;
- pragmatismo;
- consistência;
- habilidade com mídia;
- adaptabilidade;
- capacidade de perdoar.

O perfil pode ser definido na criação e depois evolui com decisões e pressão de carreira.

## Filosofia tática

A criação permite registrar:
- formação favorita;
- formações secundárias;
- mentalidade;
- posse;
- pressão;
- ritmo;
- jogo direto;
- linha defensiva;
- largura;
- contra-ataque;
- saída curta;
- liberdade criativa;
- importância de bolas paradas;
- uso de jovens;
- rotação.

Esses valores são preferências. Eles podem influenciar IA e recomendações, mas não devem bloquear outras táticas.

## Filosofia de treino

- intensidade;
- físico;
- técnica;
- tática;
- trabalho individual;
- vídeo;
- preparação para o adversário;
- recuperação;
- repetição;
- liberdade dos atletas.

Essa camada será conectada progressivamente ao Training Engine 2.0.

## Ambição de carreira

O personagem também registra:
- clube inicial;
- clubes dos sonhos;
- países preferidos/evitados;
- ambição por seleção;
- importância de salário;
- estabilidade;
- títulos;
- reputação;
- preferência por projeto de base;
- preferência por projeto financeiro.

Isso será usado futuramente no mercado de treinadores e nas decisões de carreira.

## Reputação inicial

A reputação é dividida em:
- doméstica;
- continental;
- mundial;
- prestígio como ex-jogador;
- prestígio como treinador;
- perfil midiático.

Exemplo: um ex-craque pode ter enorme prestígio de jogador e pouca reputação de treinador.

## Save

O save V8 persiste integralmente o Manager Character Engine, incluindo biografia, aparência, carreira, educação, conhecimento, personalidade, filosofias, ambições, reputação e histórico.

## Próximas integrações

1. tela avançada de criação;
2. arquétipos rápidos;
3. ligação entre conhecimento e qualidade das decisões;
4. autoridade inicial do vestiário baseada em biografia;
5. rede profissional por clubes/países;
6. evolução de conhecimento com cursos e experiência;
7. mercado de treinadores, contratos e demissões;
8. histórico completo da carreira;
9. conquistas, recordes e legado.
