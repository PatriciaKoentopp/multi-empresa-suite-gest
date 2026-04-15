

## Plano: Contabilizar baixa de contas a pagar com antecipação

### Problema atual
Quando uma conta a pagar é baixada usando antecipação, o sistema gera apenas o lançamento padrão com o valor total da parcela:
- D - Fornecedores a Pagar / C - Banco

Não diferencia a parte paga com dinheiro da parte compensada com antecipação. Falta o lançamento de baixa da antecipação.

### Lançamentos corretos esperados

**Parte paga via antecipação (compensação):**
- D - Fornecedores a Pagar (conta do tipo título da movimentação)
- C - Adiantamento de Fornecedores (conta do tipo título da antecipação)

**Parte paga em dinheiro (valor efetivo):**
- D - Fornecedores a Pagar (conta do tipo título da movimentação)
- C - Banco (conta corrente)

### Arquivo a modificar

| Arquivo | Ação |
|---------|------|
| `src/hooks/useLancamentosContabeis.ts` | Buscar `movimentacoes_parcelas_antecipacoes` e `antecipacoes`, e gerar lançamentos contábeis separados para a parte paga via antecipação |

### Detalhes da implementação

1. **Na função `carregarDados`**: Buscar registros de `movimentacoes_parcelas_antecipacoes` (com batch de 50) e as antecipações correspondentes para obter o `tipo_titulo_id` de cada antecipação usada.

2. **Na função `processarMovimentacoesParaLancamentos`**: Receber os dados de antecipações utilizadas como parâmetro adicional. No bloco de processamento de parcelas pagas (`tipoOperacao === 'pagar'`):
   - Verificar se a parcela tem antecipações associadas na tabela `movimentacoes_parcelas_antecipacoes`
   - Para cada antecipação utilizada:
     - Gerar: D - Fornecedores a Pagar / C - Conta do tipo título da antecipação (valor da antecipação utilizada)
   - Para o valor restante pago em dinheiro (valor da parcela - total antecipações):
     - Gerar: D - Fornecedores a Pagar / C - Banco (apenas o valor efetivamente pago)
   - Se o valor total foi pago via antecipação (valor a pagar = 0), não gerar lançamento contra o banco

3. **Mesma lógica para `tipoOperacao === 'receber'`**: Adaptar para contas a receber com antecipação (D - Banco / C - Clientes a Receber para a parte em dinheiro, e D - Adiantamento de Clientes / C - Clientes a Receber para a parte da antecipação).

### O que NÃO será alterado
- Nenhum modal de baixa
- Nenhuma migração de banco
- Lógica de antecipações na criação/devolução permanece igual

