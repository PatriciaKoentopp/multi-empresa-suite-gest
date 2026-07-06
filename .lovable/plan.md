
## Diagnóstico

Na página `/financeiro/fluxo-caixa`, o saldo inicial do período é calculado em `src/pages/financeiro/fluxo-caixa/index.tsx` (useMemo `saldoInicial`, linhas 348-364) somando o `saldo_inicial` da conta com todas as movimentações anteriores à `dataInicial`.

As movimentações são carregadas pela query `fluxo-caixa-todas` (linhas 152-190), que busca **todas** as linhas de `fluxo_caixa` da conta, ordenadas por `data_movimentacao` ascendente, sem paginação e sem `.limit()`.

O Supabase/PostgREST aplica um **limite padrão de 1000 linhas por query**. A conta "Sicredi Corrente" tem **1078 movimentações** no total (verificado no banco). Como a ordenação é ascendente, as 78 movimentações mais recentes ficam de fora — e justamente algumas dessas 78 são de datas anteriores a 01/07/2026, o que falsifica a soma acumulada.

Confirmação numérica no banco:
- Saldo real acumulado até 30/06/2026: **R$ 178,86** (o valor correto que o usuário espera).
- Valor exibido pelo app: **R$ -3.766,32**.
- Diferença: R$ 3.945,18 = exatamente a soma das movimentações "cortadas" pelo limite de 1000.

Isto está inclusive registrado como regra em memória do projeto ("Fetch large Supabase `in()` filters in batches of 50…"), mas neste caso o problema é o limite padrão de retorno, não filtros `in()`.

## Correção

Alterar somente a query `fluxo-caixa-todas` em `src/pages/financeiro/fluxo-caixa/index.tsx` para não ficar limitada às primeiras 1000 linhas. Duas abordagens possíveis:

**Opção A (recomendada, mínima)** — Paginar a leitura em blocos de 1000 usando `.range(from, to)` num loop `while`, até que o bloco retornado tenha menos de 1000 linhas. Manter o mesmo `select` e a mesma ordenação ascendente. O resultado final continua sendo a lista completa consumida por:
- `saldoInicial` (soma das movs com `data_movimentacao < dataInicial`);
- qualquer outro consumidor atual do `todasMovimentacoes`.

**Opção B (alternativa)** — Trocar a query pela soma agregada server-side (RPC/SQL) que devolve direto o saldo acumulado até `dataInicial - 1`. Mais eficiente, porém exige criar função no banco e alterar mais código; a Opção A resolve o bug com escopo menor.

Vou seguir com a **Opção A**.

## Escopo

- Arquivo único: `src/pages/financeiro/fluxo-caixa/index.tsx`.
- Apenas a `queryFn` da query `fluxo-caixa-todas` é alterada (adiciona loop de paginação).
- Nenhuma mudança em layout, filtros, cores, colunas, tabela, PDF ou em outras páginas.

## Validação

- Selecionar "Sicredi Corrente" + "Mês atual" (07/2026) e conferir que o saldo inicial passa a exibir R$ 178,86.
- Conferir que meses anteriores continuam com saldos coerentes.
- Conferir que contas com poucas movimentações (≤ 1000) continuam funcionando normalmente.
