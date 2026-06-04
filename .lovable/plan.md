
## Objetivo

Criar a rotina **Visualização** no menu **Relógio**, posicionada **após Apontamento**, exibindo em formato de calendário os apontamentos realizados em cada dia, com uma apresentação visual rica.

## Navegação e rota

1. `src/config/navigation.ts` — adicionar item após "Apontamento":
   ```
   { title: "Visualização", href: "/relogio/visualizacao" }
   ```
2. `src/App.tsx` — registrar a rota `/relogio/visualizacao` apontando para a nova página, dentro do mesmo guard usado pelas demais rotas de Relógio.

## Nova página

Arquivo: `src/pages/relogio/visualizacao/index.tsx`

Layout, seguindo o padrão visual da página **Favoritos** (mesma paleta de botões/ícones e tokens semânticos do design system):

### Cabeçalho
- Título "Visualização" + subtítulo curto.
- Controles à direita:
  - Botões `<` Hoje `>` para navegar mês a mês.
  - Rótulo do mês corrente ("Junho 2026").
  - Combobox de **Projeto** (multi-seleção opcional, reaproveitando `useProjetosRelogio`).
  - Toggle de visualização: **Mês** (padrão) | **Semana**.

### Cartões de resumo (4 KPIs)
- Total de horas no período.
- Dias trabalhados.
- Projetos ativos.
- Média diária (horas / dias trabalhados).

### Calendário (visualização principal)
Grid semanal (Dom→Sáb) com 6 linhas para o mês. Cada célula de dia:
- Cabeçalho com número do dia (destaque para hoje e fim de semana).
- **Barra de intensidade** no topo da célula com largura proporcional ao total de horas do dia (heatmap suave usando `hsl(var(--primary) / x)` onde `x` cresce com as horas).
- **Stacked bars** horizontais: até 4 segmentos coloridos representando os projetos do dia, cada segmento com largura proporcional às horas daquele projeto. Cor por projeto via hash determinístico para HSL (tokens semânticos do design system, sem cores hardcoded).
- Total de horas do dia em destaque (ex.: "6h 30m").
- Hover: tooltip com lista resumida de projetos + horas.
- Clique no dia: abre `Dialog` com detalhamento (lista de apontamentos do dia: projeto, tarefa, hora início/fim, duração, observação).

### Legenda
- Barra inferior com os projetos visíveis no mês e suas cores correspondentes (chips clicáveis para filtrar).

### Visualização Semana (alternativa)
- Mesma estrutura, porém com 7 colunas de dia e linhas representando faixas horárias (0–24h em blocos de 1h). Cada apontamento renderizado como bloco colorido posicionado pela `hora_inicio`/`hora_fim` (estilo agenda Google Calendar). Mantém o mesmo dialog de detalhes ao clicar.

## Hooks / dados

- Reutilizar `useApontamentosRelogio(periodo, dataInicio, dataFim)` passando:
  - `periodo = "personalizado"` com `dataInicio`/`dataFim` calculados a partir do mês/semana navegados (cobrindo as 6 semanas visíveis no grid mensal para preencher dias adjacentes).
- Reutilizar `useProjetosRelogio` para mapa de projetos (id → nome, tipo).
- Reutilizar `useTarefasRelogio` (ou hook já existente) para resolver nomes de tarefas no dialog.
- Datas tratadas como strings `YYYY-MM-DD` e formatadas como `DD/MM/YYYY` na UI (sem timezone), seguindo a convenção do projeto.

## Componentes auxiliares (mesma pasta)

- `CalendarHeader.tsx` — navegação de mês + filtros.
- `CalendarMonthGrid.tsx` — grid 7×6 do mês.
- `CalendarDayCell.tsx` — célula do dia com barras empilhadas e heatmap.
- `CalendarWeekView.tsx` — visualização semanal estilo agenda.
- `DayDetailDialog.tsx` — modal com lista de apontamentos do dia.
- `projetoColor.ts` — utilitário para gerar HSL determinístico via hash do id do projeto, usando matiz variável e saturação/luminância fixas alinhadas ao tema.

## Padrões a respeitar

- Cores e ícones de botões iguais à página **Favoritos**.
- Datas em `DD/MM/YYYY` sem timezone.
- Sem mudanças em layout/funcionalidades existentes de outras páginas.
- Apenas tokens semânticos (`--primary`, `--muted`, `--accent`, etc.) — nenhuma cor literal nos componentes.

## Critérios de aceite

- Menu Relógio mostra "Visualização" logo após "Apontamento".
- `/relogio/visualizacao` renderiza calendário mensal do mês atual com apontamentos preenchidos.
- Navegação prev/next/hoje funciona e recarrega os dados do mês.
- Filtro de projeto filtra os blocos exibidos.
- Clique em um dia abre dialog com a lista completa de apontamentos daquele dia.
- Toggle Mês/Semana alterna entre as duas visualizações.
- Performance fluida (memoização das células, lookups por `Map`).
