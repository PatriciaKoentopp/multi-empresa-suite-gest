## Objetivo
Adicionar uma linha de totalização ao final da tabela do card "Projetos" em `/relatorios/projetos`.

## Alteração
Arquivo: `src/components/relatorios/projetos/ProjetosTable.tsx`

Incluir um `TableFooter` (ou linha destacada no final do `TableBody`) com os totais/médias calculados a partir do array `projetos` recebido por props:

- **Projeto / Cliente / Cód. Venda / Data Venda**: célula com rótulo "TOTAL" (colspan).
- **Receita**: soma de `receita` de todos os projetos da lista.
- **Fotos (V)**: soma de `fotosVendidas`.
- **Horas**: soma de `totalHoras` (formatada com `formatHoursMinutes`).
- **R$/Foto (média geral)**: `Σreceita / ΣfotosVendidas` (somente quando ΣfotosVendidas > 0).
- **R$/Hora (média geral)**: `Σreceita / ΣtotalHoras` (somente quando ΣtotalHoras > 0).
- **H/Foto (média geral)**: `ΣtotalHoras / ΣfotosVendidas` (formatada com `formatHoursMinutes`).
- **Efic. % (média geral)**: `(ΣfotosVendidas / ΣfotosEnviadas) * 100`.

Observações:
- Médias são "ponderadas" (calculadas a partir dos totais), conforme o pedido de "média geral".
- Linha estilizada em negrito e com fundo `bg-muted/50` para destaque, mantendo o padrão visual da tabela.
- Não alterar filtros, métricas dos cards superiores nem demais componentes.
