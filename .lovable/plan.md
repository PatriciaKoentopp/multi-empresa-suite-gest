

## Plano: Criar Relatorio de Contas a Receber em Aberto por Data de Referencia

### Resumo
Criar um novo relatorio em `/relatorios/contas-a-receber` que mostra a posicao das contas a receber em aberto considerando uma data de referencia informada pelo usuario. Segue a mesma logica do Relatorio de Contas a Pagar.

### Logica do Relatorio

A consulta considera uma conta como "em aberto na data de referencia" quando:

1. A movimentacao foi lancada (`data_lancamento`) ate a data de referencia
2. A parcela NAO foi recebida ate a data de referencia:
   - `data_pagamento IS NULL` (nunca foi recebida)
   - OU `data_pagamento > data_referencia` (foi recebida depois)

---

### Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/pages/relatorios/contas-a-receber/index.tsx` | Pagina principal do relatorio |
| `src/hooks/useRelatorioContasReceber.ts` | Hook para buscar e processar os dados |

### Arquivos a Alterar

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/relatorios/index.tsx` | Adicionar card do novo relatorio |
| `src/App.tsx` | Adicionar rota `/relatorios/contas-a-receber` |

---

### Estrutura da Pagina

**Filtros:**
- Campo de data: "Data de Referencia" (datepicker, padrao = hoje)
- Botao "Gerar Relatorio"

**Cards de Resumo:**
- Total de Contas em Aberto (quantidade)
- Valor Total em Aberto
- Contas Vencidas (vencimento < data referencia)
- Contas a Vencer (vencimento >= data referencia)

**Tabela:**
| Vencimento | Parcela | Cliente | Descricao | Situacao | Valor |
|------------|---------|---------|-----------|----------|-------|
| 15/12/2025 | 001/01 | Cliente X | Venda 001 | Vencida | R$ 500,00 |
| 10/01/2026 | 002/01 | Cliente Y | Venda 002 | A Vencer | R$ 1.200,00 |

**Opcoes:**
- Exportar para Excel

---

### Detalhes Tecnicos

**Hook useRelatorioContasReceber.ts:**

```typescript
// Interfaces
export interface ContaReceberRelatorio {
  id: string;
  movimentacao_id: string;
  cliente: string;           // Mudanca: "favorecido" -> "cliente"
  descricao: string;
  dataVencimento: Date;
  numeroParcela: string;
  valor: number;
  situacao: 'vencida' | 'a_vencer';
}

export interface ResumoContasReceber {
  totalContas: number;
  valorTotal: number;
  contasVencidas: number;
  valorVencido: number;
  contasAVencer: number;
  valorAVencer: number;
}

// Query principal - muda apenas o tipo_operacao
const { data: movimentacoes } = await supabase
  .from('movimentacoes')
  .select(`
    id,
    descricao,
    data_lancamento,
    numero_documento,
    favorecido:favorecidos(id, nome),
    movimentacoes_parcelas(
      id, numero, valor, data_vencimento, data_pagamento
    )
  `)
  .eq('tipo_operacao', 'receber')  // DIFERENCA: 'receber' em vez de 'pagar'
  .eq('empresa_id', currentCompany.id)
  .lte('data_lancamento', dataReferenciaStr);
```

**Pagina index.tsx:**

Mesma estrutura do Contas a Pagar, com as seguintes diferencas:
- Titulo: "Relatorio de Contas a Receber"
- Descricao: "Posicao das contas a receber em aberto em uma data especifica"
- Coluna "Favorecido" -> "Cliente"
- Cores: usar verde (green) para cards de valores positivos
- Nome do arquivo Excel: `contas-a-receber-{data}.xlsx`

---

### Alteracoes no relatorios/index.tsx

Adicionar novo card apos "contasPagar":

```typescript
{
  id: "contasReceber",
  title: "Relatorio de Contas a Receber",
  description: "Posicao das contas a receber em aberto em uma data especifica",
  icon: <CreditCard className="h-8 w-8 text-green-500" />,  // Verde para receber
  route: "/relatorios/contas-a-receber"
}
```

Atualizar a condicao de cards ativos para incluir `contasReceber`.

---

### Alteracoes no App.tsx

Adicionar nova rota:

```typescript
<Route path="/relatorios/contas-a-receber" element={<RelatorioContasReceber />} />
```

Com o import correspondente:

```typescript
import RelatorioContasReceber from "./pages/relatorios/contas-a-receber";
```

---

### Estrutura de Pastas Final

```
src/
├── pages/
│   └── relatorios/
│       ├── contas-a-pagar/
│       │   └── index.tsx
│       └── contas-a-receber/
│           └── index.tsx
├── hooks/
│   ├── useRelatorioContasPagar.ts
│   └── useRelatorioContasReceber.ts
```

