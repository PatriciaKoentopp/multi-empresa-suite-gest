

## Plano: Criar Relatorio de Contas a Pagar em Aberto por Data de Referencia

### Resumo
Criar um novo relatorio em `/relatorios/contas-a-pagar` que mostra a posicao das contas a pagar em aberto considerando uma data de referencia informada pelo usuario. Isso permite visualizar como estava a situacao financeira em qualquer data passada.

### Logica do Relatorio

A consulta considera uma conta como "em aberto na data de referencia" quando:

1. A movimentacao foi lancada (`data_lancamento`) ate a data de referencia
2. A parcela NAO foi paga ate a data de referencia:
   - `data_pagamento IS NULL` (nunca foi paga)
   - OU `data_pagamento > data_referencia` (foi paga depois)

**Exemplo pratico:**
- Data de referencia: 31/12/2025
- Uma parcela lancada em 15/12/2025 com vencimento em 10/01/2026:
  - Se `data_pagamento = NULL` → aparece no relatorio
  - Se `data_pagamento = 05/01/2026` → aparece no relatorio (foi paga depois)
  - Se `data_pagamento = 28/12/2025` → NAO aparece (ja estava paga)

---

### Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/pages/relatorios/contas-a-pagar/index.tsx` | Pagina principal do relatorio |
| `src/hooks/useRelatorioContasPagar.ts` | Hook para buscar e processar os dados |

### Arquivos a Alterar

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/relatorios/index.tsx` | Adicionar card do novo relatorio |
| `src/App.tsx` | Adicionar rota `/relatorios/contas-a-pagar` |

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
| Vencimento | Parcela | Favorecido | Descricao | Situacao | Valor |
|------------|---------|------------|-----------|----------|-------|
| 15/12/2025 | 001/01 | Fornecedor X | Compra materiais | Vencida | R$ 500,00 |
| 10/01/2026 | 002/01 | Fornecedor Y | Servicos | A Vencer | R$ 1.200,00 |

**Opcoes:**
- Exportar para Excel
- Exportar para PDF (opcional - segunda fase)

---

### Detalhes Tecnicos

**Query principal (hook):**

```typescript
// Buscar movimentacoes de pagar lancadas ate a data de referencia
const { data: movimentacoes } = await supabase
  .from('movimentacoes')
  .select(`
    *,
    favorecido:favorecidos(nome),
    movimentacoes_parcelas(
      id, numero, valor, data_vencimento, data_pagamento
    )
  `)
  .eq('tipo_operacao', 'pagar')
  .eq('empresa_id', currentCompany?.id)
  .lte('data_lancamento', dataReferencia); // Lancadas ate a data

// Filtrar parcelas em aberto na data de referencia
const parcelasEmAberto = movimentacoes.flatMap(mov => 
  mov.movimentacoes_parcelas.filter(parcela => 
    !parcela.data_pagamento || parcela.data_pagamento > dataReferencia
  )
);
```

**Estrutura do hook:**

```typescript
interface ContaPagarRelatorio {
  id: string;
  movimentacao_id: string;
  favorecido: string;
  descricao: string;
  dataVencimento: Date;
  numeroParcela: string;
  valor: number;
  situacao: 'vencida' | 'a_vencer';
}

interface ResumoContasPagar {
  totalContas: number;
  valorTotal: number;
  contasVencidas: number;
  valorVencido: number;
  contasAVencer: number;
  valorAVencer: number;
}
```

---

### Estrutura de Pastas Final

```
src/
├── pages/
│   └── relatorios/
│       └── contas-a-pagar/
│           └── index.tsx
├── hooks/
│   └── useRelatorioContasPagar.ts
```

---

### Interface Visual

A pagina seguira o padrao visual dos outros relatorios:
- Header com titulo e botao voltar
- Card de filtros com datepicker
- Cards de resumo em grid
- Tabela com os dados
- Rodape com totalizadores

