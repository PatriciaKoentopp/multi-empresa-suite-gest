# Plano: Cadastro de Tipo de Projeto e Tarefas (Relógio)

Criar dentro do módulo Relógio o cadastro de **Tipo de Projeto** e suas **Tarefas** vinculadas (1:N), em uma única página com linhas expansíveis.

## Banco de dados (Supabase)

Duas novas tabelas no schema `public`, ambas escopadas por `empresa_id` com RLS via `get_user_company_id()`, seguindo o padrão dos demais cadastros.

### `relogio_tipos_projeto`
- `id` uuid PK
- `empresa_id` uuid (NOT NULL)
- `nome` varchar (NOT NULL)
- `status` varchar default `'ativo'` (valores: `ativo` / `inativo`)
- `created_at`, `updated_at` timestamptz

### `relogio_tarefas`
- `id` uuid PK
- `tipo_projeto_id` uuid (NOT NULL) — referencia `relogio_tipos_projeto.id`, ON DELETE CASCADE
- `nome` varchar (NOT NULL)
- `status` varchar default `'ativo'` (valores: `ativo` / `inativo`)
- `percentual_tempo_estimado` numeric(5,2) default 0 — percentual (0–100) do tempo total estimado do tipo de projeto
- `created_at`, `updated_at` timestamptz

GRANTs para `authenticated` e `service_role`. RLS:
- `relogio_tipos_projeto`: filtro `empresa_id = get_user_company_id()` para SELECT/INSERT/UPDATE/DELETE.
- `relogio_tarefas`: políticas via subselect na tabela pai garantindo que o tipo de projeto pertença à empresa do usuário (mesmo padrão de `funil_etapas` / `orcamentos_itens`).

Sem validação dura de soma = 100% no banco; aviso visual no front quando a soma divergir de 100%.

## Frontend

### Rota e navegação
- Nova rota `/relogio/tipos-projeto`.
- Substituir o item "Relógio" do menu (hoje link direto) por um grupo com subitens:
  - "Tipos de Projeto" → `/relogio/tipos-projeto`
- A página atual `/relogio` permanece como placeholder do módulo (apontada pelo título do grupo se aplicável, ou removida da navegação se o grupo já cobrir o acesso). Manter o arquivo `src/pages/relogio/index.tsx` como página inicial em `/relogio`.

### Página `src/pages/relogio/tipos-projeto/index.tsx`
- Cabeçalho com título "Tipos de Projeto" + botão "Novo Tipo de Projeto" (padrão visual de Favorecidos).
- Campo de busca por nome e filtro por status (Ativo/Inativo/Todos).
- Tabela com colunas: Nome, Qtde. de Tarefas, % Total Estimado (soma das tarefas ativas), Status, Ações.
- Cada linha expande (acordeão) revelando a sub-tabela de Tarefas:
  - Colunas: Nome, % Tempo Estimado, Status, Ações (editar/excluir).
  - Botão "Adicionar Tarefa" dentro do bloco expandido.
  - Indicador discreto quando a soma do percentual ≠ 100%.
- Ações no Tipo de Projeto: editar, ativar/inativar, excluir (com confirmação — cascade apaga tarefas).

### Modais
- `TipoProjetoFormModal` — campos: Nome, Status.
- `TarefaFormModal` — campos: Nome, % Tempo Estimado (input numérico com sufixo `%`, 0–100, 2 casas), Status. Recebe `tipoProjetoId`.
- Confirmação de exclusão usando `AlertDialog` padrão.

### Hook `src/hooks/useTiposProjetoRelogio.ts`
- Carrega tipos de projeto da empresa atual com `useCompany()`.
- Carrega todas as tarefas dos tipos retornados em uma única query (`in('tipo_projeto_id', ids)`), respeitando o batching de 50 IDs.
- Funções: `criarTipoProjeto`, `atualizarTipoProjeto`, `excluirTipoProjeto`, `criarTarefa`, `atualizarTarefa`, `excluirTarefa`, `refetch`.
- Loga ações via `useLogTransacao` (módulo `relogio`, entidades `tipo_projeto` e `tarefa`), seguindo o padrão de auditoria.

## Detalhes técnicos
- Campos no front em snake_case (`empresa_id`, `tipo_projeto_id`, `percentual_tempo_estimado`, `created_at`).
- Tipos TS em `src/types/relogio.d.ts`.
- Cores e botões idênticos aos das páginas existentes (ex.: Favorecidos).
- Sem alterações em rotinas existentes.

## Fora de escopo (próximas etapas)
- Apontamento de tempo (timer), vínculo a clientes/usuários, relatórios.
