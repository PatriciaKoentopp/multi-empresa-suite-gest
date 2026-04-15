

## Plano: Excluir Impostos Retidos ao Excluir Conta a Pagar Principal

### Problema
Ao excluir uma conta a pagar que gerou movimentações de impostos retidos, as movimentações filhas dos impostos não são excluídas. Além disso, é necessário verificar se algum imposto retido já foi pago (baixado) antes de permitir a exclusão.

### Arquivo a modificar

**`src/pages/financeiro/contas-a-pagar/index.tsx`** — função `confirmarExclusao` (linhas 208-257)

### Lógica a implementar

Antes de excluir a movimentação principal:

1. **Buscar movimentações filhas de impostos retidos** usando o padrão `[IR-{movimentacao_id}]` na descrição (via `ilike`)

2. **Verificar se alguma parcela dos impostos retidos já foi paga** — consultar `movimentacoes_parcelas` das movimentações filhas e verificar se alguma tem `data_pagamento` preenchida

3. **Se houver imposto retido já baixado**: bloquear a exclusão com mensagem de erro informando que existem impostos retidos já pagos e que devem ser desfeitos antes

4. **Se nenhum imposto retido foi baixado**: excluir parcelas e movimentações filhas dos impostos retidos, depois excluir registros de `movimentacoes_impostos_retidos`, e por fim prosseguir com a exclusão normal da movimentação principal

### Ordem de exclusão
```text
1. Verificar baixas nos impostos retidos filhos
2. Excluir parcelas dos impostos retidos filhos
3. Excluir movimentações dos impostos retidos filhos
4. Excluir registros de movimentacoes_impostos_retidos
5. Excluir parcelas da movimentação principal (já existente)
6. Excluir movimentação principal (já existente)
```

### O que NÃO será alterado
- Demais funcionalidades da página
- Rotina de baixa e renegociação
- Layout e estilo

