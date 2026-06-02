## Rotina de Projetos (Relógio)

### Banco de Dados

Nova tabela `relogio_projetos`:
- `id` (uuid PK)
- `empresa_id` (uuid, NOT NULL)
- `codigo` (varchar, NOT NULL) — único por empresa
- `nome` (varchar, NOT NULL)
- `favorecido_id` (uuid, NOT NULL) — referência ao cadastro de favorecidos (clientes)
- `fotos_tiradas` (integer, default 0)
- `fotos_enviadas` (integer, default 0)
- `fotos_vendidas` (integer, default 0)
- `status` (varchar, default `'ativo'`) — valores: `ativo` / `arquivado`
- `created_at`, `updated_at`

GRANTs para `authenticated` e `service_role`, RLS por `empresa_id = get_user_company_id()`, trigger `handle_updated_at`, índice único em `(empresa_id, codigo)`.

### Frontend

**Menu**: adicionar "Projetos" no grupo "Relógio" (acima de "Tipos de Projeto").

**Rota**: `/relogio/projetos`

**Página `src/pages/relogio/projetos/index.tsx`**:
- Header padrão (ícone `FolderKanban`, título, descrição) seguindo o padrão das demais páginas do Relógio.
- Botões: "Importar Planilha" e "Novo Projeto".
- Filtros: busca por código/nome, filtro por cliente (Select com favorecidos), filtro por status.
- Tabela com colunas: Código, Nome, Cliente, Fotos Tiradas, Fotos Enviadas, Fotos Vendidas, Status, Ações (editar, arquivar/reativar, excluir).

**Modais**:
- `ProjetoFormModal.tsx`: campos Código, Nome, Cliente (Combobox de favorecidos), Fotos Tiradas, Fotos Enviadas, Fotos Vendidas, Status.
- `ImportarProjetosModal.tsx`: upload de planilha `.xlsx`/`.csv` usando `xlsx` (já no projeto). Mostra preview das linhas, mapeamento de colunas esperadas (Código, Nome, Cliente, Fotos Tiradas, Fotos Enviadas, Fotos Vendidas), match do cliente por nome contra `favorecidos` da empresa, sinaliza linhas sem match para resolução manual, e faz `insert` em lote.

**Hook `src/hooks/useProjetosRelogio.ts`**: CRUD completo + import em lote, integrando `useLogTransacao` para auditoria.

**Tipos**: adicionar `RelogioProjeto` em `src/types/relogio.d.ts`.

### Numeração automática (futuro)

Por ora o campo `codigo` é manual / vem da planilha. Estrutura pronta para futuramente acoplar uma função de numeração automática semelhante a `gerar_proximo_numero_orcamento`.

### Arquivos

**Criar**: `src/pages/relogio/projetos/index.tsx`, `src/components/relogio/ProjetoFormModal.tsx`, `src/components/relogio/ImportarProjetosModal.tsx`, `src/hooks/useProjetosRelogio.ts`, migração SQL.
**Modificar**: `src/App.tsx`, `src/config/navigation.ts`, `src/types/relogio.d.ts`.

### Perguntas antes de implementar

1. **Formato da planilha de importação**: os cabeçalhos devem ser exatamente `Código`, `Nome`, `Cliente`, `Fotos Tiradas`, `Fotos Enviadas`, `Fotos Vendidas`? Ou você quer enviar um modelo específico?
2. **Match do cliente na importação**: se o nome do cliente da planilha não existir no cadastro de favorecidos, devo (a) pular a linha e reportar, (b) criar o cliente automaticamente, ou (c) deixar o usuário escolher manualmente no preview?
3. **Status na importação**: assumir todos como `ativo`, ou ler de uma coluna `Status` opcional?
