## Problema

No relatório `/relatorios/razao-contabil`, alguns lançamentos de 04/2026 não aparecem — os mesmos que sumiam em `/financeiro/movimentacao` antes da correção anterior. A causa é a mesma: o hook `useLancamentosContabeis` carrega todas as movimentações e lançamentos contábeis da empresa sem `limit()` nem `order()`, batendo no limite padrão de 1000 linhas do Supabase.

Confirmado via banco: a empresa atualmente em uso possui **1019 movimentações**, ou seja, ultrapassa o limite — registros mais antigos/recentes ficam de fora do retorno e seus lançamentos contábeis associados não aparecem no Razão.

## Arquivo a alterar

**`src/hooks/useLancamentosContabeis.ts`**

### Ajuste 1 — Query de `lancamentos_contabeis` (linha ~102)

Adicionar `.limit(20000)` à consulta existente para garantir que todos os lançamentos do período sejam retornados (atualmente sem limit, pegando só os 1000 primeiros por ordem de data ascendente).

### Ajuste 2 — Query de `movimentacoes` (linha ~1182)

Adicionar `.order("data_lancamento", { ascending: false })` e `.limit(20000)` na consulta de movimentações, pelo mesmo motivo.

## O que NÃO será alterado

- Layout, filtros e UI da página de Razão Contábil
- Lógica de agrupamento, cálculo de saldo, geração de PDF
- Demais funções do hook
