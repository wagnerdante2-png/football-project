# Motor de negociação de transferências

A negociação não é um clique de comprar/vender. O jogo trata a transferência como um conflito de interesses entre organizações e pessoas.

## Atores

- clube comprador;
- clube vendedor;
- treinador;
- diretor de futebol;
- diretoria;
- atleta;
- agente;
- departamento de scouting;
- departamento médico;
- torcida compradora;
- torcida vendedora;
- imprensa dos dois lados.

Cada parte pode ter objetivo diferente. O treinador pode querer o atleta, a diretoria pode considerá-lo caro, o vendedor pode não desejar vender, o jogador pode querer sair, o agente pode tentar elevar salário e comissão e a torcida pode pressionar em qualquer direção.

## Perfil do atleta

O motor mantém preferências persistentes para cada jogador:

- ambição;
- lealdade;
- motivação financeira;
- necessidade de tempo de jogo;
- preferência climática;
- tolerância a mudança de cidade ou país;
- necessidade de estabilidade familiar;
- adaptação linguística;
- tolerância a pressão;
- desejo de status;
- vínculo com o clube atual;
- status de ídolo;
- vontade atual de deixar o clube.

Assim, dois jogadores tecnicamente iguais podem reagir de maneira completamente diferente à mesma proposta.

## Ambiente do clube

Clubes têm região, clima, prestígio da cidade, pressão institucional, paixão da torcida, intensidade da mídia e percepção de projeto esportivo.

Uma mudança para outro país pode ser atraente esportivamente, mas ruim para um atleta com baixa tolerância a relocação, baixa adaptabilidade linguística, forte estabilidade familiar ou preferência climática incompatível.

## Agentes

Cada jogador possui agente com perfil próprio:

- ganância;
- paciência;
- lealdade;
- propensão a usar a imprensa;
- reputação;
- foco em relacionamento.

O agente pode pedir salário maior, bônus de assinatura, comissão, cláusula de saída ou emitir ultimato. Agentes mais propensos ao uso da mídia aumentam a chance de vazamentos estratégicos.

## Rodadas de negociação

Uma negociação pode passar por até várias rodadas:

`oferta → contraproposta do vendedor → contraproposta do agente → ajuste do comprador → nova avaliação → acordo / recusa / desistência`

O comprador pode desistir por perda de valor esportivo ou escalada do custo. O vendedor pode declarar o jogador inegociável. O atleta pode recusar por projeto, papel, adaptação pessoal ou qualidade de vida. O agente pode impor prazo.

## Vazamentos e pressão pública

A negociação começa privada, mas pode evoluir para:

`privada → rumor → noticiada → pública`

Quanto mais pública, mais pesam torcida e imprensa. O efeito não é sempre positivo.

Exemplos:

- torcida do comprador cria pressão para fechar um grande nome;
- torcida do vendedor transforma a venda de um ídolo em custo político;
- imprensa questiona uma taxa muito acima do valor estimado;
- vazamento pode aumentar a vontade do atleta de sair;
- diretoria pode abandonar uma negociação que virou crise pública;
- agente pode vazar interesse de propósito para obter melhores termos.

## Ídolos e vontade de sair

Status de ídolo aumenta resistência do clube e da torcida à venda. Porém, se o jogador desejar fortemente sair, esse peso pode ser parcialmente neutralizado e gerar tensão interna.

Um atleta com alto vínculo emocional e baixo desejo de saída pode rejeitar até uma proposta financeiramente melhor. Um jogador insatisfeito pode pressionar publicamente por transferência.

## Empréstimos

O motor econômico agora diferencia:

- empréstimo simples;
- empréstimo com opção de compra;
- empréstimo com obrigação de compra;
- contribuição salarial;
- taxa de empréstimo;
- cláusula de retorno antecipado.

Ao final do período, o atleta retorna, a obrigação é executada ou a opção pode ser exercida conforme desempenho esperado, valor, orçamento e interesse do clube.

## Cláusulas e bônus

O modelo aceita cláusulas como:

- percentual de venda futura;
- bônus por partidas;
- bônus por gols;
- bônus por jogos sem sofrer gols;
- bônus por título;
- bônus por promoção;
- cláusula de rescisão;
- opção ou obrigação de compra;
- contribuição salarial em empréstimo;
- direito de recall.

A arquitetura permite que bônus futuros sejam debitados somente quando os eventos correspondentes ocorrerem.

## Princípio de IA

Clubes controlados pelo computador seguem a mesma lógica do clube do usuário. Não existe atalho de IA que simplesmente consulte o valor real e compre.

A sequência pretendida é:

`necessidade → descoberta/scouting → aprovação interna → avaliação médica → orçamento → negociação com vendedor → negociação com agente e atleta → influência pública → acordo ou colapso`

A meta é criar histórias plausíveis, não garantir eficiência matemática perfeita. Uma diretoria pode perder um jogador por excesso de conservadorismo. Um agente pode estourar uma negociação. Um clube pode aceitar vender após pressão do atleta. Uma torcida pode dificultar a saída de um ídolo. Um rumor pode mudar completamente a dinâmica do negócio.
