

## Plano: Criar rotina de Impostos Retidos (sem alíquota)

### 1. Migração de banco de dados
Criar tabela `impostos_retidos`:
- `id` (uuid, PK, default gen_random_uuid())
- `empresa_id` (uuid, NOT NULL)
- `nome` (text, NOT NULL) — ex: "ISS Retido", "IRRF"
- `tipo_titulo_id` (uuid, NOT NULL) — tipo de título para contabilização
- `status` (varchar, default 'ativo')
- `created_at`, `updated_at` (timestamptz, default now())
- RLS policies com `get_user_company_id()` para SELECT, INSERT, UPDATE, DELETE
- Trigger `handle_updated_at` para updated_at

### 2. Arquivos a criar

| Arquivo | Descrição |
|---------|-----------|
| `src/types/impostos-retidos.d.ts` | Interface TypeScript com id, empresa_id, nome, tipo_titulo_id, status, created_at, updated_at |
| `src/pages/cadastros/impostos-retidos/index.tsx` | Página principal seguindo padrão de Tipos de Títulos (busca, filtro status, dialog CRUD, AlertDialog exclusão) |
| `src/components/impostos-retidos/impostos-retidos-form.tsx` | Formulário: Nome (input), Tipo de Título (select filtrado por tipo "pagar" e status "ativo"), Status (radio ativo/inativo) |
| `src/components/impostos-retidos/impostos-retidos-table.tsx` | Tabela: Nome, Tipo de Título (nome), Status, Ações (editar/excluir) |

### 3. Arquivos a modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/config/navigation.ts` | Adicionar `{ title: "Impostos Retidos", href: "/cadastros/impostos-retidos" }` no submenu Cadastros |
| `src/App.tsx` | Importar página e adicionar rota `/cadastros/impostos-retidos` com PrivateRoute + MainLayout |

### Detalhes técnicos
- Formulário busca tipos de títulos ativos do tipo "pagar" da empresa
- Tabela exibe o nome do tipo de título associado (join local com dados carregados)
- Padrão visual idêntico à página de Tipos de Títulos (cores de botões, ícones, badges)
- Sem campo de alíquota

