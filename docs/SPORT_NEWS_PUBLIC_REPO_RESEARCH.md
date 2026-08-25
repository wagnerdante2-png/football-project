# Sport News — pesquisa de referências públicas

Pesquisa realizada em 2026-08-25 para orientar memória narrativa e jornalismo histórico sem copiar implementações.

## Referências úteis

### openfootmanager/openfootmanager
Sistema de notícias orientado a gatilhos: relatório de partida, resumo da rodada, classificação, rumores/transferências, lesões, mudanças de treinador, preview de temporada e editoriais. Aplicação: manter categorias explícitas e separar fato, rumor e editorial.

### enricostara/eventure
Event sourcing, log imutável, consultas históricas, relações parent-child e reconstrução de estado. Aplicação: tratar acontecimentos relevantes como registros consultáveis e ligar consequências posteriores à origem histórica.

### gaemi/agentic-fc
Manager autônomo reage a notícias, transferências, lesões, pressão da diretoria e partidas, mantendo histórico auditável. Aplicação: memória deve afetar decisões/personagens, não apenas produzir texto nostálgico.

### gerardochavarriajr-create/narrativefc
Story bible viva, momentum/pressão, imprensa, jornais e drama de personagens ancorados no save. Aplicação: construir contexto narrativo selecionado antes de gerar uma matéria/interação.

### ecrou-exact/Global-Soccer-Manager
Motor determinístico separado da camada de narração. Aplicação: fatos históricos vêm do estado/eventos; a camada editorial interpreta sem alterar a verdade simulada.

### 0xFlicker/influence-game
Histórico durável, replay e selective context recall com orçamento de contexto. Aplicação: recuperar poucos episódios de alta relevância, em vez de despejar todo o arquivo em cada narrativa.

## Decisões para o projeto

1. O Sport News Archive permanece a fonte documental das edições publicadas.
2. `sport-news-memory-v1.ts` cria uma camada de recall seletivo por entidades, competição, tema, idade e importância.
3. O recall produz callbacks tipados: revanche, reencontro, repetição de final, novela de mercado, retorno de treinador, eco de recorde e eco histórico.
4. Episódios antigos ganham pequeno bônus por longevidade, mas identidade compartilhada e importância editorial pesam mais.
5. A memória não inventa fatos: todo callback aponta para edição/data/manchete reais do arquivo do save.
6. Próxima integração: fornecer `sportNewsMemoryBrief()` ao gerador semanal, coletivas, torcida/diretoria e futuras decisões de personagens.

## Licenciamento

As referências foram usadas como pesquisa arquitetural/conceitual. Não foi copiado código de terceiros. Antes de reutilizar qualquer implementação concreta, conferir a licença do repositório e compatibilidade com a licença futura do projeto.
