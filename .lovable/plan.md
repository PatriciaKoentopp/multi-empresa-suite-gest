

## Plano: Desfazer Efetivação de Venda

### Analise da Efetivação

A rotina "Efetivar Venda" faz 3 operações:
1. Cria uma `movimentacao` do tipo 'receber' com parcelas em `movimentacoes_parcelas`
2. Atualiza o `orcamento` para `tipo = 'venda'` e preenche `data_venda`

### O que "Desfazer" precisa fazer (reverso):
1. Verificar se alguma parcela da movimentação já foi paga (tem `data_pagamento`). Se sim, bloquear.
2. Excluir registros de `fluxo_caixa` vinculados à movimentação
3. Excluir parcelas da movimentação (`movimentacoes_parcelas`)
4. Excluir a movimentação (`movimentacoes`)
5. Reverter o orçamento: `tipo = 'orcamento'`, `data_venda = null`

### Arquivos a Alterar

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/vendas/faturamento/index.tsx` | Adicionar estado, função e menu "Desfazer Venda" + dialog de confirmação |

### Detalhes

#### Menu de ações
Adicionar opção "Desfazer Venda" no dropdown, visível apenas quando `item.tipo === 'venda'`.

#### Dialog de confirmação
Reutilizar um `Dialog` com confirmação antes de executar a reversão.

#### Função `handleDesfazerVenda`
```typescript
async function handleDesfazerVenda(item: Orcamento) {
  // 1. Buscar movimentação pelo numero_documento = item.codigo
  // 2. Verificar parcelas pagas → bloquear se houver
  // 3. Excluir fluxo_caixa pela movimentacao_id
  // 4. Excluir movimentacoes_parcelas
  // 5. Excluir movimentacao
  // 6. Update orcamento: tipo='orcamento', data_venda=null
  // 7. Recarregar dados
}
```

