# Plano: Relatório de Vendas (/relatorios/vendas)

## Objetivo
Criar a página do card "Relatório de Vendas" já previsto em `/relatorios` (rota `/relatorios/vendas` ainda não existe). A página mostrará as vendas em formato de tabela estilo Excel: meses nas linhas, anos nas colunas, com totais e comparativo (variação) entre anos.

## Fonte de dados
- Tabela `orcamentos` com `tipo = 'venda'`, `status = 'ativo'`, `data_venda` preenchida e `empresa_id` da empresa atual (mesmo critério do painel de vendas).
- Valor de cada venda = soma de `orcamentos_itens.valor`.
- Agrupamento por mês/ano extraído de `data_venda` via substring (padrão já usado em `useYearlyComparison`).

## Página: `src/pages/relogio/../relatorios/vendas/index.tsx` (novo arquivo)
1. **Filtro de anos**: seleção múltipla de anos (anos detectados automaticamente a partir das vendas existentes) + opção "Todos". Por padrão, todos os anos com vendas.
2. **Tabela estilo Excel** (padrão visual da página Planilha de Fotos: bordas em todas as células, cabeçalho destacado):
   - Linhas: Janeiro a Dezembro.
   - Colunas: uma por ano selecionado, com o valor vendido no mês.
   - Coluna extra por ano (exceto o mais antigo): **Var. %** — variação percentual do mês em relação ao mesmo mês do ano anterior (verde quando positiva, vermelha quando negativa, "-" quando não há base).
   - Linha de **Total** no rodapé: soma anual por coluna + variação % do total ano a ano.
   - Linha de **Média mensal**: média dos meses com venda por ano.
   - Células sem venda exibem "-".
3. **Cards de resumo** (padrão dos demais relatórios): Total geral do período filtrado, melhor ano e quantidade de anos comparados.
4. **Botão Exportar Excel** (.xlsx via `xlsx`, mesmo padrão da Planilha de Fotos), exportando a tabela exatamente como exibida.
5. Datas e valores formatados nos padrões do projeto (`formatCurrency`, DD/MM/YYYY).

## Rota e menu
- Registrar a rota `/relatorios/vendas` em `src/App.tsx` (lazy import, padrão das demais páginas de relatório).
- O card em `/relatorios` já aponta para essa rota — nenhuma alteração necessária no índice.

## Fora de escopo
- Nenhuma alteração no banco de dados, no painel de vendas ou em outras páginas.
