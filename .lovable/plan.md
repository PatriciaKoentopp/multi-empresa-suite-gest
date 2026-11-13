# Corrigir parcelas da Hapvida que não aparecem em Contas a Receber

## Causa encontrada
Sim, existe um limite: o banco devolve no máximo **1.000 registros** por consulta.
A página de Contas a Receber busca as parcelas de **todas as empresas** (1.854 no total) ordenadas por vencimento e só depois descarta as que não são da empresa atual. Como o corte de 1.000 acontece antes, as parcelas com vencimento mais distante (as da Hapvida vão até 03/2027) ficam de fora. A sua empresa tem só 149 parcelas a receber, incluindo 55 da Hapvida.

## Correção
1. Em Contas a Receber, filtrar pela empresa e pelo tipo "receber" já no banco, para vir somente o que é da empresa.
2. Buscar em blocos de 1.000 até trazer tudo, para não voltar a acontecer quando a quantidade crescer.
3. Aplicar o mesmo ajuste em Contas a Pagar, que usa a mesma busca e tem o mesmo risco.

Nenhuma mudança de layout ou de regra.

## Detalhes técnicos
- `src/pages/financeiro/contas-a-receber/index.tsx` (consulta da linha ~96): trocar `movimentacao:movimentacoes (...)` por `movimentacao:movimentacoes!inner (...)` para que `.eq('movimentacao.empresa_id')` e `.eq('movimentacao.tipo_operacao')` filtrem as linhas; paginar com `.range()` em lotes de 1000.
- Mesma revisão em `src/pages/financeiro/contas-a-pagar/index.tsx`.
