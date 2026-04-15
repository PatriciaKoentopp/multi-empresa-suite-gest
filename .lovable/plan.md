

## Plano: Adicionar Conta de Despesa ao Cadastro de Impostos Retidos

### Objetivo
Incluir o campo "Conta de Despesa" (plano de contas) no cadastro de impostos retidos, para que cada imposto tenha tanto o tipo de título (para contabilização do valor a pagar) quanto a conta de despesa (para contabilização da despesa).

### 1. Migração de banco de dados
Adicionar coluna `conta_despesa_id` (uuid, nullable) na tabela `impostos_retidos`.

```sql
ALTER TABLE public.impostos_retidos ADD COLUMN conta_despesa_id UUID;
```

### 2. Arquivos a modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/types/impostos-retidos.d.ts` | Adicionar `conta_despesa_id?: string` |
| `src/pages/cadastros/impostos-retidos/index.tsx` | Buscar `plano_contas` da empresa (useQuery). Passar `contasContabeis` como prop ao form e table. |
| `src/components/impostos-retidos/impostos-retidos-form.tsx` | Adicionar campo `conta_despesa_id` (Select filtrado por contas de movimentação ativas). Receber `contasContabeis` como prop. |
| `src/components/impostos-retidos/impostos-retidos-table.tsx` | Adicionar coluna "Conta de Despesa" exibindo a descrição da conta. Receber `contasContabeis` como prop. |

### 3. Detalhes do formulário
- O select de "Conta de Despesa" exibirá contas do plano de contas com categoria "movimentação" e status "ativo"
- Campo opcional (nullable no banco)
- Exibição: `codigo - descricao`

### O que NÃO será alterado
- Nenhuma outra funcionalidade ou layout existente

