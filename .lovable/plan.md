

## Plano: Impostos Retidos na Movimentação Financeira

### Objetivo
Adicionar a funcionalidade de impostos retidos na página `/financeiro/incluir-movimentacao`. O usuário pode ativar "Impostos Retidos", selecionar impostos cadastrados, informar valor e data de vencimento manualmente. Os impostos geram registros separados e são contabilizados usando as contas configuradas no cadastro de cada imposto (tipo de título, conta de despesa e favorecido padrão).

### 1. Migração de banco de dados

Criar tabela `movimentacoes_impostos_retidos` para armazenar os impostos retidos de cada movimentação:

```sql
CREATE TABLE public.movimentacoes_impostos_retidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movimentacao_id UUID NOT NULL REFERENCES public.movimentacoes(id) ON DELETE CASCADE,
  imposto_retido_id UUID NOT NULL REFERENCES public.impostos_retidos(id),
  valor NUMERIC NOT NULL DEFAULT 0,
  data_vencimento DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.movimentacoes_impostos_retidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view" ON public.movimentacoes_impostos_retidos FOR SELECT USING (
  movimentacao_id IN (SELECT id FROM movimentacoes WHERE empresa_id = get_user_company_id())
);
CREATE POLICY "Users can insert" ON public.movimentacoes_impostos_retidos FOR INSERT WITH CHECK (
  movimentacao_id IN (SELECT id FROM movimentacoes WHERE empresa_id = get_user_company_id())
);
CREATE POLICY "Users can update" ON public.movimentacoes_impostos_retidos FOR UPDATE USING (
  movimentacao_id IN (SELECT id FROM movimentacoes WHERE empresa_id = get_user_company_id())
);
CREATE POLICY "Users can delete" ON public.movimentacoes_impostos_retidos FOR DELETE USING (
  movimentacao_id IN (SELECT id FROM movimentacoes WHERE empresa_id = get_user_company_id())
);
```

### 2. Novo componente

| Arquivo | Descrição |
|---------|-----------|
| `src/components/movimentacao/ImpostosRetidosMovForm.tsx` | Componente com: select para adicionar imposto da lista cadastrada, tabela com nome do imposto, campo valor (R$) e campo data de vencimento (DateInput), botão remover. Exibido após a seção de parcelas. |

### 3. Arquivos a modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useMovimentacaoDados.ts` | Buscar `impostos_retidos` ativos da empresa (com tipo_titulo_id, conta_despesa_id, favorecido_id). Retornar no hook. |
| `src/hooks/useMovimentacaoForm.ts` | Adicionar estado `possuiImpostosRetidos` (boolean, default false) e `impostosRetidosSelecionados` (array com imposto_retido_id, valor, data_vencimento). No `handleSalvar`: deletar registros antigos (se edição) e inserir novos em `movimentacoes_impostos_retidos`. Carregar dados existentes ao editar. Retornar estados e handlers. |
| `src/components/movimentacao/PagamentoForm.tsx` | Adicionar Switch "Impostos Retidos" ao lado do "Considerar para DRE". Renderizar `ImpostosRetidosMovForm` após parcelas quando ativado. Novas props. |
| `src/components/movimentacao/RecebimentoForm.tsx` | Mesma alteração do PagamentoForm. |
| `src/pages/financeiro/incluir-movimentacao.tsx` | Passar novas props (impostos retidos disponíveis, estado, handlers) para PagamentoForm e RecebimentoForm. |
| `src/hooks/useLancamentosContabeis.ts` | Buscar `movimentacoes_impostos_retidos` com join em `impostos_retidos`. Para cada imposto retido: gerar lançamento D - conta_despesa_id do imposto / C - conta contábil do tipo_titulo_id do imposto. |

### 4. Detalhes da UI

- Switch "Impostos Retidos" na mesma linha do "Considerar para DRE"
- Quando ativado, após a tabela de parcelas aparece a seção "Impostos Retidos"
- Select para escolher imposto cadastrado e botão "Adicionar"
- Tabela com colunas: Nome do Imposto, Valor (R$), Data Vencimento, Ação (remover)
- Valores e datas digitados manualmente
- Em modo visualização (readOnly), campos desabilitados

### 5. Contabilização

Para cada imposto retido na movimentação:
- **D** - Conta de despesa do imposto (`conta_despesa_id` da tabela `impostos_retidos`)
- **C** - Conta contábil do tipo de título do imposto (`conta_contabil_id` via `tipo_titulo_id` da tabela `impostos_retidos`)

Usa a data de lançamento da movimentação e o favorecido padrão do imposto (`favorecido_id`).

### 6. Salvamento no handleSalvar

1. Após salvar movimentação e parcelas (sem alteração na rotina existente)
2. Se edição: deletar registros antigos de `movimentacoes_impostos_retidos`
3. Inserir novos registros dos impostos selecionados (com valor e data_vencimento)

### O que NÃO será alterado
- Cálculo de parcelas e valor total
- Modais de baixa
- Rotina de antecipações
- Cadastro de impostos retidos
- Demais funcionalidades existentes

