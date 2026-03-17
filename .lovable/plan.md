

## Plano: Integrar Logs em Todas as Ações dos Módulos

### Resumo das ações que precisam de log

Já existem logs em: baixa contas a pagar, baixa contas a receber, efetivar venda, desfazer venda, criar/editar movimentação.

**Faltam logs em:**

| Módulo | Ação | Arquivo |
|--------|------|---------|
| Contas a Pagar | Excluir | `contas-a-pagar/index.tsx` → `confirmarExclusao` |
| Contas a Pagar | Desfazer Baixa | `contas-a-pagar/index.tsx` → `handleDesfazerBaixa` |
| Contas a Pagar | Renegociar | `contas-a-pagar/index.tsx` → `realizarRenegociacao` |
| Contas a Receber | Excluir | `contas-a-receber/index.tsx` → `confirmarExclusao` |
| Contas a Receber | Desfazer Baixa | `contas-a-receber/index.tsx` → `handleDesfazerBaixa` |
| Contas a Receber | Renegociar | `RenegociarParcelasModal.tsx` (ambos) |
| Orçamentos | Criar/Editar | `useOrcamentoForm.ts` → `handleSubmit` |
| Faturamento | Excluir | `faturamento/index.tsx` → `confirmarExclusao` |
| Antecipações | Criar | `antecipacao-modal.tsx` → `handleSalvar` |
| Antecipações | Editar | `editar-antecipacao-modal.tsx` → `handleSalvar` |
| Antecipações | Excluir | `antecipacoes/index.tsx` → `confirmarExclusao` |
| Antecipações | Devolver | `devolver-antecipacao-modal.tsx` → `handleSalvar` |
| Fluxo de Caixa | Conciliar | `fluxo-caixa/index.tsx` → `handleConciliar` |
| Fluxo de Caixa | Desfazer Conciliação | `fluxo-caixa/index.tsx` → `handleDesfazerConciliacao` |

### Arquivos a alterar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/financeiro/contas-a-pagar/index.tsx` | Log em excluir, desfazer baixa, renegociar |
| `src/pages/financeiro/contas-a-receber/index.tsx` | Log em excluir, desfazer baixa |
| `src/components/contas-a-receber/RenegociarParcelasModal.tsx` | Importar hook, log em renegociar |
| `src/components/contas-a-pagar/RenegociarParcelasModal.tsx` | Importar hook, log em renegociar |
| `src/hooks/useOrcamentoForm.ts` | Importar hook, log em criar/editar orçamento |
| `src/pages/vendas/faturamento/index.tsx` | Log em excluir orçamento/venda |
| `src/components/antecipacoes/antecipacao-modal.tsx` | Importar hook, log em criar antecipação |
| `src/components/antecipacoes/editar-antecipacao-modal.tsx` | Importar hook, log em editar |
| `src/components/antecipacoes/devolver-antecipacao-modal.tsx` | Importar hook, log em devolver |
| `src/pages/financeiro/antecipacoes/index.tsx` | Importar hook, log em excluir |
| `src/pages/financeiro/fluxo-caixa/index.tsx` | Importar hook, log em conciliar/desfazer |

### Padrão de cada log

Cada `registrarLog` incluirá: ação (`criar`/`editar`/`excluir`/`baixar`/`desfazer`/`renegociar`/`devolver`/`conciliar`), módulo (`financeiro`/`vendas`), entidade, ID do registro, e descrição legível com dados relevantes (valor, favorecido, código).

