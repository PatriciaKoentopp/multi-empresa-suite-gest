

## Plano: Implementar Lançamentos Contábeis Complementares para Baixa com Antecipações

### Resumo do Problema

Atualmente, ao baixar um contas a pagar ou contas a receber utilizando uma antecipação, o sistema:

1. Registra a utilização da antecipação no `fluxo_caixa` **sem** `conta_corrente_id`
2. Registra o pagamento/recebimento efetivo (se houver valor restante) com `conta_corrente_id`

Isso cria uma lacuna contábil: a movimentação da antecipação não aparece no extrato da conta corrente, impossibilitando a conciliação bancária completa.

### Solução Proposta

Ao utilizar uma antecipação para baixar contas, gerar **dois lançamentos complementares** que se anulam no saldo, mas documentam a movimentação contábil:

#### Para Contas a Pagar com Antecipação:
| Lançamento | Tipo | Valor | Descrição |
|------------|------|-------|-----------|
| 1 - Baixa da Antecipação | Entrada (+) | +R$ 1.000 | "Baixa Antecipação - Fornecedor X" |
| 2 - Pagamento da Conta | Saída (-) | -R$ 1.000 | "Pagamento Fornecedor X" |

**Resultado no saldo:** R$ 0,00 (entrada e saída se anulam)

#### Para Contas a Receber com Antecipação:
| Lançamento | Tipo | Valor | Descrição |
|------------|------|-------|-----------|
| 1 - Baixa da Antecipação | Saída (-) | -R$ 1.000 | "Baixa Antecipação - Cliente Y" |
| 2 - Recebimento da Conta | Entrada (+) | +R$ 1.000 | "Recebimento Cliente Y" |

**Resultado no saldo:** R$ 0,00 (saída e entrada se anulam)

---

### Arquivos a Alterar

| Arquivo | Descrição da Alteração |
|---------|------------------------|
| `src/components/contas-a-pagar/BaixarContaPagarModal.tsx` | Modificar lógica de inserção no fluxo_caixa para gerar par de lançamentos |
| `src/components/contas-a-receber/BaixarContaReceberModal.tsx` | Modificar lógica de inserção no fluxo_caixa para gerar par de lançamentos |

---

### Detalhes Técnicos

#### Alteração no BaixarContaPagarModal.tsx (linhas 300-324)

**Código Atual:**
```typescript
// 4. Inserir registros no fluxo de caixa para cada antecipação utilizada
for (const antSel of antecipacoesSelecionadas) {
  if (antSel.valor > 0) {
    const antecipacao = antecipacoesDisponiveis.find(ant => ant.id === antSel.id);
    
    const { error: fluxoAntecipacaoError } = await supabase
      .from("fluxo_caixa")
      .insert({
        empresa_id: currentCompany?.id,
        data_movimentacao: format(dataPagamento, "yyyy-MM-dd"),
        valor: -antSel.valor, // Negativo pois é utilização de antecipação
        saldo: -antSel.valor,
        tipo_operacao: "pagar",
        origem: "antecipacao",
        movimentacao_parcela_id: conta?.id,
        movimentacao_id: conta?.movimentacao_id,
        antecipacao_id: antSel.id,
        situacao: "nao_conciliado",
        descricao: `Utilização ${antecipacao?.descricao || 'Antecipação'} - ${conta?.favorecido}`,
        forma_pagamento: formaPagamento
        // SEM conta_corrente_id
      });
  }
}
```

**Novo Código (substituir):**
```typescript
// 4. Inserir registros no fluxo de caixa para cada antecipação utilizada
// Gerar PAR de lançamentos: entrada (baixa antecipação) + saída (pagamento)
for (const antSel of antecipacoesSelecionadas) {
  if (antSel.valor > 0) {
    const antecipacao = antecipacoesDisponiveis.find(ant => ant.id === antSel.id);
    
    // 4.1 - Lançamento de ENTRADA: Baixa da Antecipação (valor positivo)
    // Representa o "resgate" do valor antecipado
    const { error: fluxoBaixaAntecipacaoError } = await supabase
      .from("fluxo_caixa")
      .insert({
        empresa_id: currentCompany?.id,
        conta_corrente_id: contaCorrenteId, // AGORA COM CONTA CORRENTE
        data_movimentacao: format(dataPagamento, "yyyy-MM-dd"),
        valor: antSel.valor, // POSITIVO - entrada de caixa
        saldo: antSel.valor,
        tipo_operacao: "pagar", // Mantém o contexto da operação
        origem: "antecipacao_baixa",
        movimentacao_parcela_id: conta?.id,
        movimentacao_id: conta?.movimentacao_id,
        antecipacao_id: antSel.id,
        situacao: "nao_conciliado",
        descricao: `Baixa Antecipação - ${antecipacao?.descricao || 'Antecipação'} - ${conta?.favorecido}`,
        forma_pagamento: formaPagamento
      });

    if (fluxoBaixaAntecipacaoError) throw fluxoBaixaAntecipacaoError;

    // 4.2 - Lançamento de SAÍDA: Pagamento com Antecipação (valor negativo)
    // Representa o pagamento efetivo da conta
    const { error: fluxoPagamentoAntecipacaoError } = await supabase
      .from("fluxo_caixa")
      .insert({
        empresa_id: currentCompany?.id,
        conta_corrente_id: contaCorrenteId, // COM CONTA CORRENTE
        data_movimentacao: format(dataPagamento, "yyyy-MM-dd"),
        valor: -antSel.valor, // NEGATIVO - saída de caixa
        saldo: -antSel.valor,
        tipo_operacao: "pagar",
        origem: "movimentacao",
        movimentacao_parcela_id: conta?.id,
        movimentacao_id: conta?.movimentacao_id,
        antecipacao_id: antSel.id, // Vincula à antecipação
        situacao: "nao_conciliado",
        descricao: `Pagamento (Antecipação) - ${descricao || conta?.descricao || conta?.favorecido}`,
        forma_pagamento: formaPagamento
      });

    if (fluxoPagamentoAntecipacaoError) throw fluxoPagamentoAntecipacaoError;
  }
}
```

#### Alteração no BaixarContaReceberModal.tsx (linhas 296-320)

**Código Atual:**
```typescript
// 4. Inserir registros no fluxo de caixa para cada antecipação utilizada
for (const antSel of antecipacoesSelecionadas) {
  if (antSel.valor > 0) {
    const antecipacao = antecipacoesDisponiveis.find(ant => ant.id === antSel.id);
    
    const { error: fluxoAntecipacaoError } = await supabase
      .from("fluxo_caixa")
      .insert({
        empresa_id: currentCompany?.id,
        data_movimentacao: format(dataRecebimento, "yyyy-MM-dd"),
        valor: -antSel.valor, // Negativo pois é utilização de antecipação
        saldo: -antSel.valor,
        tipo_operacao: "receber",
        origem: "antecipacao",
        movimentacao_parcela_id: conta?.id,
        movimentacao_id: conta?.movimentacao_id,
        antecipacao_id: antSel.id,
        situacao: "nao_conciliado",
        descricao: `Utilização ${antecipacao?.descricao || 'Antecipação'} - ${conta?.cliente}`,
        forma_pagamento: formaPagamento
        // SEM conta_corrente_id
      });
  }
}
```

**Novo Código (substituir):**
```typescript
// 4. Inserir registros no fluxo de caixa para cada antecipação utilizada
// Gerar PAR de lançamentos: saída (baixa antecipação) + entrada (recebimento)
for (const antSel of antecipacoesSelecionadas) {
  if (antSel.valor > 0) {
    const antecipacao = antecipacoesDisponiveis.find(ant => ant.id === antSel.id);
    
    // 4.1 - Lançamento de SAÍDA: Baixa da Antecipação (valor negativo)
    // Representa a "devolução" do valor antecipado ao cliente
    const { error: fluxoBaixaAntecipacaoError } = await supabase
      .from("fluxo_caixa")
      .insert({
        empresa_id: currentCompany?.id,
        conta_corrente_id: contaCorrenteId, // AGORA COM CONTA CORRENTE
        data_movimentacao: format(dataRecebimento, "yyyy-MM-dd"),
        valor: -antSel.valor, // NEGATIVO - saída de caixa
        saldo: -antSel.valor,
        tipo_operacao: "receber", // Mantém o contexto da operação
        origem: "antecipacao_baixa",
        movimentacao_parcela_id: conta?.id,
        movimentacao_id: conta?.movimentacao_id,
        antecipacao_id: antSel.id,
        situacao: "nao_conciliado",
        descricao: `Baixa Antecipação - ${antecipacao?.descricao || 'Antecipação'} - ${conta?.cliente}`,
        forma_pagamento: formaPagamento
      });

    if (fluxoBaixaAntecipacaoError) throw fluxoBaixaAntecipacaoError;

    // 4.2 - Lançamento de ENTRADA: Recebimento com Antecipação (valor positivo)
    // Representa o recebimento efetivo da conta
    const { error: fluxoRecebimentoAntecipacaoError } = await supabase
      .from("fluxo_caixa")
      .insert({
        empresa_id: currentCompany?.id,
        conta_corrente_id: contaCorrenteId, // COM CONTA CORRENTE
        data_movimentacao: format(dataRecebimento, "yyyy-MM-dd"),
        valor: antSel.valor, // POSITIVO - entrada de caixa
        saldo: antSel.valor,
        tipo_operacao: "receber",
        origem: "movimentacao",
        movimentacao_parcela_id: conta?.id,
        movimentacao_id: conta?.movimentacao_id,
        antecipacao_id: antSel.id, // Vincula à antecipação
        situacao: "nao_conciliado",
        descricao: `Recebimento (Antecipação) - ${descricao || conta?.descricao || conta?.cliente}`,
        forma_pagamento: formaPagamento
      });

    if (fluxoRecebimentoAntecipacaoError) throw fluxoRecebimentoAntecipacaoError;
  }
}
```

---

### Validação: Conta Corrente Obrigatória

**Alteração adicional necessária:** Quando usar antecipação, a conta corrente deve ser obrigatória para gerar os lançamentos corretamente.

#### BaixarContaPagarModal.tsx - Ajuste na validação:

```typescript
// Atual
if (!dataPagamento || (!contaCorrenteId && valorAPagar > 0) || !formaPagamento) {

// Novo - conta corrente obrigatória quando usar antecipação
if (!dataPagamento || !formaPagamento || (!contaCorrenteId && (valorAPagar > 0 || usarAntecipacao))) {
```

#### BaixarContaReceberModal.tsx - Ajuste na validação:

```typescript
// Atual  
if (!dataRecebimento || (!contaCorrenteId && valorAReceber > 0) || !formaPagamento) {

// Novo - conta corrente obrigatória quando usar antecipação
if (!dataRecebimento || !formaPagamento || (!contaCorrenteId && (valorAReceber > 0 || usarAntecipacao))) {
```

#### UI: Mostrar campo conta corrente quando usar antecipação:

```typescript
// Alterar a condição de exibição do campo Conta Corrente
// De: {valorAPagar > 0 && (
// Para: {(valorAPagar > 0 || usarAntecipacao) && (
```

---

### Exemplo Prático de Resultado

**Cenário:** Baixar conta a pagar de R$ 1.500,00 usando R$ 1.000,00 de antecipação

**Lançamentos gerados no fluxo_caixa:**

| Data | Descrição | Valor | Conta Corrente |
|------|-----------|-------|----------------|
| 29/01/2026 | Baixa Antecipação - Adiantamento Fornecedor X | +R$ 1.000,00 | Banco ABC |
| 29/01/2026 | Pagamento (Antecipação) - Compra materiais | -R$ 1.000,00 | Banco ABC |
| 29/01/2026 | Pagamento Fornecedor X - Compra materiais | -R$ 500,00 | Banco ABC |

**Efeito no saldo:** -R$ 500,00 (apenas o valor efetivamente pago)

---

### Benefícios da Implementação

1. **Rastreabilidade completa**: Todas as movimentações aparecem no extrato da conta corrente
2. **Conciliação bancária**: Possibilita reconciliar lançamentos com extratos bancários
3. **Auditoria contábil**: Documentação clara do fluxo de recursos
4. **Saldo correto**: Os lançamentos se anulam, não afetando o saldo real
5. **Consistência**: Mantém a integridade do fluxo de caixa

---

### Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `BaixarContaPagarModal.tsx` | Substituir lógica de inserção única por par de lançamentos (entrada/saída) |
| `BaixarContaPagarModal.tsx` | Tornar conta corrente obrigatória quando usar antecipação |
| `BaixarContaPagarModal.tsx` | Mostrar campo conta corrente quando usar antecipação |
| `BaixarContaReceberModal.tsx` | Substituir lógica de inserção única por par de lançamentos (saída/entrada) |
| `BaixarContaReceberModal.tsx` | Tornar conta corrente obrigatória quando usar antecipação |
| `BaixarContaReceberModal.tsx` | Mostrar campo conta corrente quando usar antecipação |

