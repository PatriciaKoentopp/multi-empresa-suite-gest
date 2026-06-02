## Objetivo
Incluir o campo "Tipo de Projeto" no cadastro de Projetos (relogio_projetos) e definir todos os projetos importados via planilha como tipo "Fotografia".

## Alterações

### 1. Banco de dados (migration)
- Adicionar coluna `tipo_projeto_id uuid` (nullable) em `relogio_projetos`.
- Atualizar projetos existentes: definir `tipo_projeto_id` para o tipo "Fotografia" da respectiva empresa (quando existir).
- Para empresas que ainda não possuem o tipo "Fotografia", criar o registro em `relogio_tipos_projeto` e vincular os projetos.

### 2. Tipos TS
- `src/types/relogio.d.ts`: adicionar `tipo_projeto_id: string | null` em `RelogioProjeto`.
- `src/hooks/useProjetosRelogio.ts`: adicionar `tipo_projeto_id` em `ProjetoPayload` e propagar nos insert/update.

### 3. Formulário (`ProjetoFormModal.tsx`)
- Adicionar Select de "Tipo de Projeto" carregando a lista via `useTiposProjetoRelogio`.
- Default: "Fotografia" (quando criando novo e o tipo existir na empresa).
- Enviar `tipo_projeto_id` no submit.

### 4. Importação (`ImportarProjetosModal.tsx` + `useProjetosRelogio.importarProjetos`)
- Antes de iterar a importação, buscar o id do tipo "Fotografia" da empresa atual (criar se não existir).
- Incluir esse `tipo_projeto_id` em cada projeto inserido.

### 5. Listagem (`src/pages/relogio/projetos/index.tsx`)
- Adicionar coluna "Tipo" na tabela mostrando o nome do tipo de projeto.
- (Sem novos filtros, mantendo o layout atual.)

Nenhuma outra funcionalidade ou layout será alterada.