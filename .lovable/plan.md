

## Plano: Corrigir Reversão do Status da Antecipação ao Desfazer Baixa

### Problema Identificado

Ao desfazer a baixa de um contas a pagar ou receber que utilizou antecipação:
- O `valor_utilizado` da antecipação é corretamente reduzido
- Porém o `status` permanece como "utilizada" quando deveria voltar para "ativa"

### Causa Raiz

O código atual em `handleDesfazerBaixa` reverte apenas o `valor_utilizado`, mas não verifica/atualiza o status da antecipação. A lógica de atualização automática de status existe na página de antecipações, mas não é chamada após desfazer a baixa.

---

### Solução Proposta

Modificar a função `handleDesfazerBaixa` em ambos os arquivos para:
1. Após reverter o `valor_utilizado`, verificar se a antecipação deve voltar para status "ativa"
2. Atualizar o status da antecipação quando `valor_disponivel > 0`

---

### Arquivos a Alterar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/financeiro/contas-a-pagar/index.tsx` | Adicionar lógica para reverter status da antecipação para "ativa" |
| `src/pages/financeiro/contas-a-receber/index.tsx` | Adicionar lógica para reverter status da antecipação para "ativa" |

---

### Detalhes Técnicos

#### Alteração no contas-a-pagar/index.tsx (linhas 442-465)

**Código Atual:**
```typescript
// 3. Reverter valores das antecipações utilizadas
if (relacionamentos && relacionamentos.length > 0) {
  for (const rel of relacionamentos) {
    // Buscar valor atual utilizado da antecipação
    const { data: antecipacao, error: antError } = await supabase
      .from("antecipacoes")
      .select("valor_utilizado")
      .eq("id", rel.antecipacao_id)
      .single();

    if (!antError && antecipacao) {
      // Subtrair o valor que estava sendo utilizado
      const novoValorUtilizado = antecipacao.valor_utilizado - rel.valor_utilizado;
      
      const { error: updateAntError } = await supabase
        .from("antecipacoes")
        .update({ valor_utilizado: Math.max(0, novoValorUtilizado) })
        .eq("id", rel.antecipacao_id);

      if (updateAntError) {
        console.error("Erro ao reverter antecipação:", updateAntError);
      }
    }
  }
  // ... resto do código
}
```

**Novo Código (substituir):**
```typescript
// 3. Reverter valores das antecipações utilizadas e atualizar status
if (relacionamentos && relacionamentos.length > 0) {
  for (const rel of relacionamentos) {
    // Buscar valores atuais da antecipação
    const { data: antecipacao, error: antError } = await supabase
      .from("antecipacoes")
      .select("valor_total, valor_utilizado, status")
      .eq("id", rel.antecipacao_id)
      .single();

    if (!antError && antecipacao) {
      // Subtrair o valor que estava sendo utilizado
      const novoValorUtilizado = Math.max(0, antecipacao.valor_utilizado - rel.valor_utilizado);
      const novoValorDisponivel = antecipacao.valor_total - novoValorUtilizado;
      
      // Determinar novo status: se tem saldo disponível, deve ser "ativa"
      // Só muda para "ativa" se estava "utilizada" (não mexe em "devolvida" ou "cancelada")
      const novoStatus = (novoValorDisponivel > 0 && antecipacao.status === 'utilizada') 
        ? 'ativa' 
        : antecipacao.status;
      
      const { error: updateAntError } = await supabase
        .from("antecipacoes")
        .update({ 
          valor_utilizado: novoValorUtilizado,
          status: novoStatus
        })
        .eq("id", rel.antecipacao_id);

      if (updateAntError) {
        console.error("Erro ao reverter antecipação:", updateAntError);
      }
    }
  }
  // ... resto do código continua igual
}
```

#### Alteração no contas-a-receber/index.tsx (linhas 420-443)

Aplicar a mesma lógica descrita acima para o arquivo de contas a receber.

---

### Lógica da Correção

1. **Buscar dados completos**: Agora buscamos `valor_total`, `valor_utilizado` e `status`
2. **Calcular novo valor disponível**: `novoValorDisponivel = valor_total - novoValorUtilizado`
3. **Determinar novo status**: 
   - Se `novoValorDisponivel > 0` E status atual é "utilizada" → muda para "ativa"
   - Caso contrário → mantém status atual (não mexe em "devolvida" ou "cancelada")
4. **Atualizar em única operação**: Atualiza `valor_utilizado` e `status` juntos

---

### Exemplo Prático

**Cenário:** Antecipação de R$ 1.000,00 que foi 100% utilizada (status "utilizada")

**Antes de desfazer:**
- `valor_total`: R$ 1.000,00
- `valor_utilizado`: R$ 1.000,00
- `valor_disponivel`: R$ 0,00
- `status`: "utilizada"

**Após desfazer baixa que usou R$ 1.000,00:**
- `valor_total`: R$ 1.000,00
- `valor_utilizado`: R$ 0,00
- `valor_disponivel`: R$ 1.000,00
- `status`: "ativa" ✓

---

### Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `contas-a-pagar/index.tsx` | Buscar `valor_total` e `status`, calcular `novoValorDisponivel`, atualizar status para "ativa" quando aplicável |
| `contas-a-receber/index.tsx` | Mesma alteração aplicada para contas a receber |

