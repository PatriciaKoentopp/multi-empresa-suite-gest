

## Plano: Gerar Parcelas de Contas a Pagar para Impostos Retidos

### Problema
Ao salvar uma movimentação com impostos retidos, os lançamentos contábeis são gerados corretamente, mas não são criadas as movimentações de contas a pagar (com suas respectivas parcelas) para cada imposto retido.

### Solução
No `handleSalvar` do `useMovimentacaoForm.ts`, após salvar os registros em `movimentacoes_impostos_retidos`, criar uma movimentação do tipo "pagar" para cada imposto retido, com sua respectiva parcela.

### Arquivo a modificar

**`src/hooks/useMovimentacaoForm.ts`** - No bloco de salvamento dos impostos retidos (linhas ~375-388), após inserir os registros em `movimentacoes_impostos_retidos`, adicionar lógica para:

1. Para cada imposto retido selecionado, buscar os dados completos do imposto (tipo_titulo_id, conta_despesa_id, favorecido_id)
2. Criar uma nova movimentação do tipo "pagar" com:
   - `tipo_operacao`: "pagar"
   - `tipo_titulo_id`: do imposto retido
   - `favorecido_id`: favorecido padrão do imposto retido
   - `categoria_id`: conta_despesa_id do imposto retido
   - `valor`: valor digitado para o imposto
   - `data_lancamento`: mesma data de lançamento da movimentação principal
   - `data_emissao`: mesma data de emissão
   - `numero_parcelas`: 1
   - `descricao`: referência ao imposto retido e à movimentação principal
   - `considerar_dre`: true
   - `mes_referencia`: mesmo da movimentação principal
3. Criar uma parcela (em `movimentacoes_parcelas`) para essa movimentação com:
   - `numero`: 1
   - `valor`: valor do imposto
   - `data_vencimento`: data de vencimento digitada para o imposto

4. Na edição, antes de recriar, excluir as movimentações de impostos retidos anteriores (identificadas por uma referência ou padrão na descrição vinculado ao `movimentacao_id` principal). Para isso, uma abordagem segura é armazenar o `movimentacao_id` principal na descrição ou usar a relação via `movimentacoes_impostos_retidos`.

### Detalhes técnicos
- Os dados de `tipo_titulo_id`, `conta_despesa_id` e `favorecido_id` já estão disponíveis no array `impostosRetidos` retornado por `useMovimentacaoDados`
- O `adicionarImpostoRetido` já recebe os dados do imposto, mas precisamos garantir que `tipo_titulo_id`, `conta_despesa_id` e `favorecido_id` sejam armazenados no estado `impostosRetidosSelecionados`
- Na edição, as movimentações filhas dos impostos retidos precisam ser excluídas e recriadas

### Ajuste no estado dos impostos selecionados
Modificar `adicionarImpostoRetido` para incluir `tipo_titulo_id`, `conta_despesa_id` e `favorecido_id` no objeto armazenado em `impostosRetidosSelecionados`.

### O que NÃO será alterado
- Lançamentos contábeis (já funcionando)
- Cálculo de parcelas do título principal
- Demais funcionalidades existentes

