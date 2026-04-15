

## Plano Revisado: Integrar Antecipações no Razão Contábil via Tipo de Título

### Lógica contábil das antecipações

A antecipação é um adiantamento — dinheiro entra ou sai do banco contra a conta do tipo de título, seguindo o mesmo padrão das baixas de contas a pagar/receber:

**Antecipação de Cliente (receber):**
- D - Banco (conta contábil da conta corrente)
- C - Tipo de Título (conta_contabil_id do tipo_titulo)

**Antecipação de Fornecedor (pagar):**
- D - Tipo de Título (conta_contabil_id do tipo_titulo)
- C - Banco (conta contábil da conta corrente)

**Devolução de antecipação** — lançamento inverso ao da criação.

### Implementação

Ao invés de gravar na tabela `lancamentos_contabeis`, os lançamentos serão **gerados dinamicamente** no hook `useLancamentosContabeis`, exatamente como já é feito para movimentações e parcelas. Isso mantém o padrão existente.

### Arquivos a modificar

| Arquivo | Ação |
|---------|------|
| `src/hooks/useLancamentosContabeis.ts` | Adicionar função para buscar antecipações e gerar lançamentos contábeis a partir delas |

### Detalhes da alteração em `useLancamentosContabeis.ts`

1. **Na função `carregarDados`**: Buscar antecipações da empresa (tabela `antecipacoes`) com status diferente de `cancelada`
2. **Nova função `processarAntecipacoesParaLancamentos`**: Recebe as antecipações, contas, tipos de títulos e contas correntes, e gera os `LancamentoContabil[]` seguindo a lógica:
   - Busca a `conta_contabil_id` do tipo de título selecionado na antecipação
   - Busca a `conta_contabil_id` da conta corrente selecionada
   - Gera dois lançamentos (débito + crédito) por antecipação
   - Para antecipações devolvidas, gera lançamentos adicionais invertidos com a data da devolução
3. **Campos preenchidos**: `numero_documento` e histórico com nome do favorecido, seguindo o mesmo padrão das movimentações

### O que NÃO será alterado
- Nenhum modal de antecipação será modificado (criação, edição, devolução)
- Nenhuma migração de banco será necessária
- A página de antecipações permanece inalterada

