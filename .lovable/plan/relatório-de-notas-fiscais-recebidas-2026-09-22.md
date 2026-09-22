# Relatório de Notas Fiscais Recebidas

Novo relatório com o mesmo modelo visual do relatório de notas fiscais emitidas, listando as notas recebidas de fornecedores.

## Origem dos dados

Lançamentos de contas a pagar (movimentações do tipo "pagar"), usando:
- Data de emissão como data da nota (define o período e a ordenação)
- Número do documento como número da nota
- Favorecido como fornecedor
- Valor total do lançamento

Somente lançamentos com data de emissão preenchida entram no relatório.

## Tela

Rota: `/relatorios/notas-fiscais-recebidas`

Filtros:
- Data inicial e data final (padrão: mês atual)
- Favorecido (lista de favorecidos ativos em ordem alfabética, com opção "Todos")

Três cartões de resumo, no mesmo padrão do relatório de emitidas:
- Notas Recebidas (quantidade)
- Valor Total
- Valor Médio

Tabela ordenada por data de emissão e depois por número, com colunas:
Data | Número | Fornecedor | Descrição | Referência | Valor

Rodapé com o total do período e a quantidade de notas. Datas em DD/MM/AAAA e valores em R$.

## Acesso

Novo cartão "Relatório de Notas Fiscais Recebidas" na página de Relatórios, com ícone e cor no mesmo padrão dos demais, incluído na configuração de cartões visíveis. O cartão existente passa a se chamar "Relatório de Notas Fiscais Emitidas" para diferenciar os dois.

## Detalhes técnicos

- Nova página `src/pages/relatorios/notas-fiscais-recebidas/index.tsx`, espelhando `src/pages/relatorios/notas-fiscais/index.tsx` (DateInput, Card, Table, formatCurrency, formatação manual de data sem timezone).
- Consulta em `movimentacoes` filtrando `empresa_id`, `tipo_operacao = 'pagar'`, `data_emissao` não nula e dentro do intervalo, com join em `favorecidos(nome)`; filtro opcional por `favorecido_id`.
- Lista de favorecidos via hook existente `useFavorecidos`.
- Rota registrada em `src/App.tsx` e cartão adicionado em `src/pages/relatorios/index.tsx` (id `notasFiscaisRecebidas`, incluído nas listas de ids ativos para botão em cor sólida).
