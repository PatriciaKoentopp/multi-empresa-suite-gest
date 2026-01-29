
## Plano: Correção Robusta da Reversão de Antecipações ao Desfazer Baixa

### Problema Identificado

Após análise detalhada do banco de dados e do código, identifiquei que:

1. **Os registros na tabela `movimentacoes_parcelas_antecipacoes` não estão sendo encontrados** durante o processo de desfazer baixa
2. A antecipação fica com `valor_utilizado` incorreto e `status: utilizada` mesmo quando deveria ser revertida
3. O RLS foi habilitado corretamente, mas há uma dependência do registro existir na tabela de relacionamento

### Causa Raiz

O código atual do `handleDesfazerBaixa` depende exclusivamente da tabela `movimentacoes_parcelas_antecipacoes` para encontrar quais antecipações reverter. Se esse registro não existir (por qualquer razão), a antecipação não é revertida.

---

### Solução Proposta

Modificar a função `handleDesfazerBaixa` para usar uma **estratégia de fallback**:
1. **Primeiro**: Tentar buscar na tabela `movimentacoes_parcelas_antecipacoes` (método atual)
2. **Fallback**: Se não encontrar, buscar no `fluxo_caixa` por registros com `origem = 'antecipacao_baixa'` e `movimentacao_parcela_id` correspondente

Isso garante que mesmo se o registro de relacionamento não existir, ainda conseguimos identificar e reverter a antecipação através dos registros do fluxo de caixa.

---

### Arquivos a Alterar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/financeiro/contas-a-pagar/index.tsx` | Adicionar fallback para buscar antecipações no fluxo de caixa |
| `src/pages/financeiro/contas-a-receber/index.tsx` | Mesma alteração para contas a receber |

---

### Detalhes Técnicos

#### Lógica do handleDesfazerBaixa (ambos os arquivos)

**Nova lógica:**

```typescript
// 2. Buscar as antecipações utilizadas na nova tabela de relacionamento
const { data: relacionamentos, error: relError } = await supabase
  .from("movimentacoes_parcelas_antecipacoes")
  .select("antecipacao_id, valor_utilizado")
  .eq("movimentacao_parcela_id", conta.id);

if (relError) {
  console.error("Erro ao buscar relacionamentos de antecipação:", relError);
}

// Fallback: Se não encontrou na tabela de relacionamento, buscar no fluxo de caixa
let antecipacoesParaReverter: { antecipacao_id: string; valor_utilizado: number }[] = [];

if (relacionamentos && relacionamentos.length > 0) {
  antecipacoesParaReverter = relacionamentos;
} else {
  // Buscar no fluxo de caixa por registros de antecipação
  const { data: fluxoAntecipacoes, error: fluxoError } = await supabase
    .from("fluxo_caixa")
    .select("antecipacao_id, valor")
    .eq("movimentacao_parcela_id", conta.id)
    .eq("origem", "antecipacao_baixa")
    .not("antecipacao_id", "is", null);

  if (!fluxoError && fluxoAntecipacoes && fluxoAntecipacoes.length > 0) {
    antecipacoesParaReverter = fluxoAntecipacoes.map(f => ({
      antecipacao_id: f.antecipacao_id!,
      valor_utilizado: Math.abs(f.valor) // O valor no fluxo pode ser positivo
    }));
  }
}

// 3. Reverter valores das antecipações utilizadas e atualizar status
if (antecipacoesParaReverter.length > 0) {
  for (const rel of antecipacoesParaReverter) {
    // ... lógica de reversão existente
  }
}
```

---

### Resumo das Alterações

1. **Adicionar fallback no fluxo de caixa** - Buscar registros com `origem = 'antecipacao_baixa'`
2. **Usar valor absoluto** - O valor no fluxo de caixa é positivo para entrada
3. **Manter compatibilidade** - A tabela `movimentacoes_parcelas_antecipacoes` ainda é a fonte principal

---

### Resultado Esperado

Após a implementação:
1. O desfazer baixa funcionará mesmo se a tabela de relacionamento estiver vazia
2. O `valor_utilizado` da antecipação será corretamente revertido
3. O `status` da antecipação voltará para "ativa" imediatamente
4. Não há dependência da página de antecipações ser acessada para corrigir o status
