

## Plano: Criar Relatório de Antecipações em Aberto por Data de Referência

### Resumo
Criar um novo relatório em `/relatorios/antecipacoes` que mostra a posição das antecipações em aberto considerando uma data de referência informada pelo usuário. Segue a mesma estrutura visual dos relatórios de Contas a Pagar e Contas a Receber.

### Lógica do Relatório

A consulta considera uma antecipação como "em aberto na data de referência" quando:

1. A antecipação foi lançada (`data_lancamento`) até a data de referência
2. A antecipação tinha valor disponível (`valor_total - valor_utilizado > 0`)
3. O status é diferente de `devolvida`

**Importante:** Diferente das contas a pagar/receber, as antecipações não possuem um histórico de quando o valor foi utilizado. O relatório mostrará o saldo disponível atual das antecipações lançadas até a data de referência.

**Classificação de situação:**
- **Recebimento**: Antecipações do tipo `receber` (cliente pagou adiantado)
- **Pagamento**: Antecipações do tipo `pagar` (pagamento adiantado a fornecedor)

---

### Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/pages/relatorios/antecipacoes/index.tsx` | Página principal do relatório |
| `src/hooks/useRelatorioAntecipacoes.ts` | Hook para buscar e processar os dados |

### Arquivos a Alterar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/relatorios/index.tsx` | Adicionar card do novo relatório |
| `src/App.tsx` | Adicionar rota `/relatorios/antecipacoes` |

---

### Estrutura da Página

**Filtros:**
- Campo de data: "Data de Referência" (datepicker, padrão = hoje)
- Botão "Gerar Relatório"

**Cards de Resumo:**
- Total de Antecipações em Aberto (quantidade)
- Valor Total Disponível
- Antecipações de Recebimento (clientes)
- Antecipações de Pagamento (fornecedores)

**Tabela:**
| Data | Tipo | Favorecido | Descrição | Valor Total | Valor Utilizado | Valor Disponível | Status |
|------|------|------------|-----------|-------------|-----------------|------------------|--------|
| 15/12/2025 | Recebimento | Cliente X | Adiantamento projeto | R$ 5.000 | R$ 2.000 | R$ 3.000 | Ativa |
| 10/12/2025 | Pagamento | Fornecedor Y | Adiantamento serviço | R$ 1.000 | R$ 0 | R$ 1.000 | Ativa |

**Opções:**
- Exportar para Excel

---

### Detalhes Técnicos

**Interface do Hook:**

```typescript
export interface AntecipacaoRelatorio {
  id: string;
  favorecido: string;
  descricao: string;
  dataLancamento: Date;
  tipoOperacao: 'receber' | 'pagar';
  valorTotal: number;
  valorUtilizado: number;
  valorDisponivel: number;
  status: 'ativa' | 'utilizada';
  numeroDocumento: string;
}

export interface ResumoAntecipacoes {
  totalAntecipacoes: number;
  valorTotalDisponivel: number;
  antecipacoesRecebimento: number;
  valorRecebimento: number;
  antecipacoesPagamento: number;
  valorPagamento: number;
}
```

**Query principal:**

```typescript
// Buscar antecipações lançadas até a data de referência
const { data: antecipacoes, error } = await supabase
  .from('antecipacoes')
  .select(`
    id,
    data_lancamento,
    tipo_operacao,
    valor_total,
    valor_utilizado,
    descricao,
    numero_documento,
    status,
    favorecido_id
  `)
  .eq('empresa_id', currentCompany.id)
  .lte('data_lancamento', dataReferenciaStr)
  .neq('status', 'devolvida'); // Excluir devolvidas

// Filtrar apenas as que têm valor disponível
const antecipacoesEmAberto = antecipacoes.filter(ant => {
  const valorDisponivel = Number(ant.valor_total) - Number(ant.valor_utilizado);
  return valorDisponivel > 0;
});
```

**Página index.tsx:**

Mesma estrutura visual dos relatórios de Contas a Pagar/Receber:
- Header com título e botão voltar
- Card de filtros com datepicker
- Cards de resumo (azul para recebimento, vermelho para pagamento)
- Tabela com os dados e badges coloridos
- Exportação para Excel

---

### Alterações no relatorios/index.tsx

Adicionar novo card após "contasReceber":

```typescript
{
  id: "antecipacoes",
  title: "Relatório de Antecipações",
  description: "Posição das antecipações em aberto em uma data específica",
  icon: <Wallet className="h-8 w-8 text-purple-500" />,
  route: "/relatorios/antecipacoes"
}
```

Atualizar a condição de cards ativos para incluir `antecipacoes`.

---

### Alterações no App.tsx

Adicionar nova rota:

```typescript
<Route path="/relatorios/antecipacoes" element={<RelatorioAntecipacoes />} />
```

Com o import correspondente:

```typescript
import RelatorioAntecipacoes from "./pages/relatorios/antecipacoes";
```

---

### Estrutura de Pastas Final

```
src/
├── pages/
│   └── relatorios/
│       ├── contas-a-pagar/
│       │   └── index.tsx
│       ├── contas-a-receber/
│       │   └── index.tsx
│       └── antecipacoes/
│           └── index.tsx
├── hooks/
│   ├── useRelatorioContasPagar.ts
│   ├── useRelatorioContasReceber.ts
│   └── useRelatorioAntecipacoes.ts
```

---

### Interface Visual

A página seguirá o padrão visual dos outros relatórios:
- Header com título "Relatório de Antecipações" e botão voltar
- Card de filtros com datepicker para a data de referência
- 4 cards de resumo:
  - Total em Aberto (quantidade)
  - Valor Total Disponível
  - Recebimentos (verde)
  - Pagamentos (azul)
- Tabela com colunas: Data, Tipo, Favorecido, Descrição, Valor Total, Valor Utilizado, Valor Disponível, Status
- Badges coloridos para tipo (Recebimento = verde, Pagamento = azul) e status (Ativa = azul, Utilizada = verde)
- Botão para exportar Excel
- Rodapé com totalizadores

