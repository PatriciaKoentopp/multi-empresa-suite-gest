# Painel de Tempo — Dashboard Analítico

Nova rotina em `/relogio/painel-tempo`, posicionada no menu Relógio logo após "Visualização". Reúne métricas-chave, comparativos mensais e indicadores de performance dos apontamentos para apoiar tomada de decisão.

## Estrutura da página

### 1. Cabeçalho e filtros
- Título "Painel de Tempo" no mesmo padrão das demais páginas.
- Filtro de período (mesmo padrão de Apontamento): Semana atual, Mês atual (default), Mês anterior, Ano atual, Ano anterior, Tudo, Período personalizado.
- Filtro por Projeto (combobox) e Tipo de Projeto (multi).
- Botão "Atualizar".

### 2. KPIs (cards superiores)
- **Total de horas** no período (com variação % vs período anterior equivalente).
- **Dias trabalhados** e **Média diária (h)**.
- **Projetos ativos** (com apontamento no período).
- **Maior dia** (data + horas) e **Maior projeto** (nome + horas).
- **Horas hoje** e **Horas esta semana**.
- **Tempo médio por apontamento** e **Nº de apontamentos**.

### 3. Comparativo mensal (12 meses móveis)
- Gráfico de barras: horas por mês dos últimos 12 meses, com linha de média móvel (3 meses).
- Tabela compacta abaixo: Mês | Horas | Δ vs mês anterior | Δ vs mesmo mês ano anterior | Dias trabalhados | Média/dia.

### 4. Performance por Projeto
- Top 10 projetos por horas no período (barras horizontais) com % do total.
- Tabela: Projeto | Cliente | Tipo | Horas | % do total | Nº dias | Última atividade.
- Destaque para projetos com queda > 30% em relação ao período anterior.

### 5. Performance por Tipo de Projeto
- Gráfico pizza/donut: distribuição de horas por tipo de projeto.
- Indicador "Mix" mostrando crescimento/queda de cada tipo vs período anterior.

### 6. Distribuição e ritmo
- Heatmap dia-da-semana × hora-do-dia (intensidade = horas apontadas) — revela padrões de jornada.
- Gráfico de linha: horas acumuladas dia a dia no período vs período anterior (curva comparativa).

### 7. Indicadores de eficiência / alertas
- **Aderência ao planejado**: por tarefa, compara `duracao_decimal` somada vs `percentual_tempo_estimado` do tipo de projeto (quando aplicável).
- **Projetos sem apontamento há > 14 dias** (lista).
- **Apontamentos em aberto** (status `em_andamento`).
- **Dias úteis sem apontamento** no período (gap analysis).

## Detalhes técnicos

- Arquivo novo: `src/pages/relogio/painel-tempo/index.tsx`.
- Rota registrada em `src/App.tsx`.
- Item de menu adicionado em `src/config/navigation.ts` após "Visualização".
- Dados: reutilizar `useApontamentosRelogio` (com período "personalizado" para janela de 12 meses dos comparativos) e `useProjetosRelogio` / `useTiposProjetoRelogio` já existentes.
- Para os agregados anuais (12 meses) buscar com `periodo="personalizado"` cobrindo `início do mês -11` até hoje; demais seções respeitam o filtro selecionado.
- Gráficos via `recharts` (já usado no projeto): BarChart, LineChart, PieChart, ComposedChart.
- Cores e ícones seguindo o padrão da página Favorecidos (botões `default`/`outline`, ícones lucide).
- Datas formatadas DD/MM/YYYY via utilitário existente; sem conversão de timezone.
- Sem alterações em hooks de negócio; apenas leitura e cálculos derivados em memo no componente.

## Fora de escopo
- Não altera Apontamento, Visualização, Projetos ou Tipos de Projeto.
- Sem novas tabelas/migrações.
