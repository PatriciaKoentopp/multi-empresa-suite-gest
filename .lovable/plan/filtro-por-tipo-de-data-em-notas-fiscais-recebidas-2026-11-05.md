## Filtro por tipo de data em Notas Fiscais Recebidas

### O que muda
- Novo seletor **"Filtrar por"** antes de Data Inicial/Data Final, com duas opções:
  - **Data de Emissão** (padrão, como hoje)
  - **Data de Lançamento** (data em que a movimentação foi lançada no sistema)
- Data Inicial/Final passam a valer para o tipo de data escolhido.
- A coluna "Data" da tabela e do PDF mostra a data correspondente ao filtro escolhido (cabeçalho "Data Emissão" ou "Data Lançamento"); a ordenação segue a mesma data.
- O PDF imprime nos filtros qual tipo de data foi usado.
- Nada mais é alterado (cartões, favorecido, layout).

### Detalhes técnicos
- Arquivo: `src/pages/relatorios/notas-fiscais-recebidas/index.tsx`.
- Estado `tipoData: "emissao" | "lancamento"`; query em `movimentacoes` usa `data_emissao` ou `data_lancamento` nos `gte/lte`, mantendo `.not("data_emissao","is",null)` (continua listando só registros com nota).
- Selecionar também `data_lancamento`; datas formatadas DD/MM/YYYY sem timezone.
