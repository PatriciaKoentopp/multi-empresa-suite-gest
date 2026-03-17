

## Plano: Rotina de Fechamento Mensal

### Conceito

Criar uma tabela `fechamentos_mensais` que registra quais meses/anos foram fechados por empresa. Antes de qualquer operação com data (lançamentos, baixas, efetivações, movimentações), o sistema verificará se o período está fechado e bloqueará a ação se necessário.

### Tabela `fechamentos_mensais`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid PK | |
| empresa_id | uuid NOT NULL | FK empresas |
| mes | integer NOT NULL | 1-12 |
| ano | integer NOT NULL | ex: 2026 |
| data_fechamento | timestamptz | Quando foi fechado |
| fechado_por | uuid | Usuário que fechou |
| fechado_por_nome | text | Nome do usuário (snapshot) |
| observacoes | text | Justificativa opcional |
| created_at | timestamptz | |

Constraint UNIQUE em (empresa_id, mes, ano). RLS por empresa.

### Função de verificação (DB)

```sql
CREATE FUNCTION public.is_periodo_fechado(p_empresa_id uuid, p_data date)
RETURNS boolean
```

Verifica se o mês/ano da data informada está na tabela de fechamentos.

### Hook `useFechamentoMensal`

- `verificarPeriodoFechado(data: Date): boolean` — consulta local/cache
- `fecharMes(mes, ano, observacoes)` — insere registro
- `reabrirMes(mes, ano)` — deleta registro (admin only)
- `mesesFechados` — lista de períodos fechados

### Validações no frontend (bloqueio)

Adicionar verificação antes de salvar em:

| Módulo | Arquivo | Data verificada |
|--------|---------|-----------------|
| Movimentações | `useMovimentacaoForm.ts` | data_lancamento |
| Baixa Contas Pagar | `BaixarContaPagarModal.tsx` | data_pagamento |
| Baixa Contas Receber | `BaixarContaReceberModal.tsx` | data_recebimento |
| Efetivar Venda | `EfetivarVendaModal.tsx` | data_venda |
| Fluxo de Caixa | `fluxo-caixa/index.tsx` | data_movimentacao (conciliação) |
| Antecipações | `antecipacao-modal.tsx` | data_lancamento |

Em cada ponto, antes de salvar: `if (isPeriodoFechado(data)) { toast.error("Período fechado..."); return; }`

### Página de Gestão `/admin/fechamento-mensal`

- Tabela com os últimos 12 meses mostrando status (aberto/fechado)
- Botão "Fechar Mês" com confirmação e campo de observações
- Botão "Reabrir Mês" (somente admin, com confirmação)
- Badge visual: verde=aberto, vermelho=fechado
- Log automático via `useLogTransacao`

### Navegação

- Adicionar "Fechamento Mensal" no menu Administrativo (`navigation.ts`)
- Registrar rota `/admin/fechamento-mensal` no `App.tsx`

### Arquivos a criar

| Arquivo | Descrição |
|---------|-----------|
| Migration SQL | Tabela + função + RLS |
| `src/hooks/useFechamentoMensal.ts` | Hook reutilizável |
| `src/pages/admin/fechamento-mensal/index.tsx` | Página de gestão |

### Arquivos a alterar

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useMovimentacaoForm.ts` | Verificação antes de salvar |
| `src/components/contas-a-pagar/BaixarContaPagarModal.tsx` | Verificação antes de baixar |
| `src/components/contas-a-receber/BaixarContaReceberModal.tsx` | Verificação antes de baixar |
| `src/components/vendas/EfetivarVendaModal.tsx` | Verificação antes de efetivar |
| `src/components/antecipacoes/antecipacao-modal.tsx` | Verificação antes de criar |
| `src/pages/financeiro/fluxo-caixa/index.tsx` | Verificação antes de conciliar |
| `src/config/navigation.ts` | Adicionar item "Fechamento Mensal" |
| `src/App.tsx` | Registrar rota |

