## Objetivo
Criar a página **Horas por Projeto** no menu Relógio, mostrando os projetos com totalização de horas apontadas e permitindo detalhar as horas por tarefa. Layout referenciado em `/relogio/projetos`.

## Rota e menu
- Criar rota `/relogio/horas-por-projeto` em `src/App.tsx` importando a nova página.
- Adicionar item **"Horas por Projeto"** em `src/config/navigation.ts` no submenu **Relógio** (após "Painel de Projetos").

## Nova página `src/pages/relogio/horas-por-projeto/index.tsx`
Estrutura visual idêntica à `/relogio/projetos` (título, `Card`, filtros na mesma linha, `Table`), sem botões de ação (Novo/Importar/Exportar) já que é somente leitura.

### Filtros (mesma barra da página de projetos)
- **Busca** por código ou nome do projeto (`Input` com ícone).
- **Cliente** (`Popover + Command`, com "Todos os clientes").
- **Tipo de Projeto** (`Popover + Command`, com "Todos os tipos").
- **Situação** (`Select`: Todos / Ativo / Arquivado — padrão "Ativo").

### Fonte de dados
- `useProjetosRelogio` para lista de projetos, `favorecidos` (id, nome), `relogio_tipos_projeto` (id, nome), `relogio_tarefas` (id, nome).
- `relogio_apontamentos` (status = `concluido`) paginado 1000/1000 trazendo `projeto_id`, `tarefa_id`, `duracao_decimal`, agregando em dois mapas:
  - `horasPorProjeto: Map<projetoId, number>`
  - `horasPorProjetoTarefa: Map<projetoId, Map<tarefaId|"sem-tarefa", number>>`

### Tabela (agrupada por projeto, ordenada por código asc)
Colunas: **Código | Nome do Projeto | Cliente | Tipo | Total de Horas | (expandir)**

- Cada linha do projeto tem um botão chevron (`ChevronRight`/`ChevronDown`) para expandir.
- Ao expandir, renderiza sub-linhas com colunas: **Tarefa | Horas** (indentadas, `colSpan` cobrindo a largura, fundo `bg-muted/30`).
- Tarefas ordenadas por nome; apontamentos sem tarefa aparecem como "Sem tarefa".
- Formatação de horas via `formatHoursMinutes` (padrão do projeto).

### Filtragem
- Aplica busca/cliente/tipo/status igual à página de projetos.
- Projetos sem apontamentos ainda são exibidos (total = `0h00`), mantendo consistência da listagem.

## Não incluso
- Sem edição, arquivamento, exclusão, importação ou exportação.
- Sem alterações em hooks ou schema existentes.
