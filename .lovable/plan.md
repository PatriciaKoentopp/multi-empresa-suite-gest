

## Plano: Corrigir Erros na Baixa de Contas a Pagar com Antecipação

### Problema Identificado

Ao tentar baixar um contas a pagar usando antecipação, ocorrem dois erros:

1. **Constraint de Origem Inválida**: O código usa `origem: "antecipacao_baixa"` que não existe na constraint do banco
2. **Chave Duplicada**: Tentativas repetidas causam erro de duplicidade na tabela de relacionamento

### Causa Raiz

A constraint `fluxo_caixa_origem_check` só permite estes valores:
- `movimentacao`
- `contas_pagar`
- `contas_receber`
- `antecipacao`
- `transferencia`

O valor `"antecipacao_baixa"` foi adicionado no código mas a constraint do banco não foi atualizada.

---

### Solução

Atualizar a constraint do banco de dados para incluir o novo valor `antecipacao_baixa`.

### Alteração no Banco de Dados

```sql
-- Remover a constraint existente
ALTER TABLE fluxo_caixa DROP CONSTRAINT fluxo_caixa_origem_check;

-- Criar nova constraint com o valor adicional
ALTER TABLE fluxo_caixa ADD CONSTRAINT fluxo_caixa_origem_check 
CHECK (origem IN (
  'movimentacao', 
  'contas_pagar', 
  'contas_receber', 
  'antecipacao', 
  'transferencia',
  'antecipacao_baixa'
));
```

---

### Arquivos Alterados

| Arquivo | Alteração |
|---------|-----------|
| Migração SQL | Adicionar `antecipacao_baixa` à constraint `fluxo_caixa_origem_check` |

### Observações

- O segundo erro (chave duplicada) é consequência de tentativas repetidas após o primeiro erro
- Após a migração, o usuário poderá limpar os dados duplicados se necessário
- Não há necessidade de alterar código TypeScript, apenas o banco de dados

