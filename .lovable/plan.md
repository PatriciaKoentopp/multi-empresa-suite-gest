

## Plano: Corrigir Reversão de Antecipações ao Desfazer Baixa

### Problema Identificado

Após análise detalhada, identifiquei **dois problemas**:

#### 1. Tabela sem RLS habilitado
A tabela `movimentacoes_parcelas_antecipacoes` **não tem RLS habilitado** (`rls_enabled: false`). Quando o cliente Supabase tenta consultar esta tabela, a query falha silenciosamente ou retorna vazio, impedindo que os relacionamentos sejam encontrados durante o processo de desfazer baixa.

#### 2. Dados inconsistentes no banco
Os dados atuais mostram antecipações com `valor_utilizado` maior que `valor_total`:
- Antecipação `4af5a1df...`: valor_total = 957.64, valor_utilizado = **1915.28** (dobro!)
- Antecipação `572e6b7b...`: valor_total = 6970.96, valor_utilizado = **13941.92** (dobro!)

Isso indica que o valor está sendo incrementado duas vezes durante a baixa.

---

### Solução

#### 1. Migração SQL - Habilitar RLS e criar políticas

```sql
-- 1. Habilitar RLS na tabela
ALTER TABLE movimentacoes_parcelas_antecipacoes ENABLE ROW LEVEL SECURITY;

-- 2. Criar políticas de acesso baseadas na parcela (que está vinculada à movimentação → empresa)
CREATE POLICY "Users can view relacionamentos from their company" 
  ON movimentacoes_parcelas_antecipacoes 
  FOR SELECT 
  USING (
    movimentacao_parcela_id IN (
      SELECT mp.id FROM movimentacoes_parcelas mp
      JOIN movimentacoes m ON m.id = mp.movimentacao_id
      WHERE m.empresa_id = get_user_company_id()
    )
  );

CREATE POLICY "Users can insert relacionamentos for their company" 
  ON movimentacoes_parcelas_antecipacoes 
  FOR INSERT 
  WITH CHECK (
    movimentacao_parcela_id IN (
      SELECT mp.id FROM movimentacoes_parcelas mp
      JOIN movimentacoes m ON m.id = mp.movimentacao_id
      WHERE m.empresa_id = get_user_company_id()
    )
  );

CREATE POLICY "Users can delete relacionamentos from their company" 
  ON movimentacoes_parcelas_antecipacoes 
  FOR DELETE 
  USING (
    movimentacao_parcela_id IN (
      SELECT mp.id FROM movimentacoes_parcelas mp
      JOIN movimentacoes m ON m.id = mp.movimentacao_id
      WHERE m.empresa_id = get_user_company_id()
    )
  );
```

#### 2. Correção dos dados inconsistentes

```sql
-- Corrigir antecipações com valor_utilizado duplicado
UPDATE antecipacoes 
SET valor_utilizado = valor_total,
    status = 'utilizada'
WHERE valor_utilizado > valor_total;
```

---

### Arquivos a Alterar

| Arquivo | Alteração |
|---------|-----------|
| Migração SQL | Habilitar RLS e criar políticas na tabela `movimentacoes_parcelas_antecipacoes` |
| Migração SQL | Corrigir dados inconsistentes de antecipações |

---

### Resultado Esperado

Após a migração:
1. A query do `handleDesfazerBaixa` conseguirá buscar os relacionamentos corretamente
2. O valor utilizado da antecipação será revertido
3. O status da antecipação voltará para "ativa" quando apropriado
4. Os dados corrompidos serão corrigidos

