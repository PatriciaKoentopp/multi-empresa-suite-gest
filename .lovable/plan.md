## Objetivo
Adicionar o campo **Cidade** ao cadastro de projetos do Relógio, exibindo-o na mesma linha do campo **Tipo de Projeto** no modal.

## Alterações

### 1. Banco de dados
- Migration em `relogio_projetos`: adicionar coluna `cidade TEXT NULL`.

### 2. Tipos
- `src/types/relogio.d.ts`: adicionar `cidade: string | null` na interface `RelogioProjeto`.

### 3. Hook
- `src/hooks/useProjetosRelogio.ts`: adicionar `cidade?: string | null` no `ProjetoPayload`.

### 4. Modal de projeto (`src/components/relogio/ProjetoFormModal.tsx`)
- Novo estado `cidade` (string), inicializado a partir de `projeto?.cidade`.
- Envolver os campos **Tipo de Projeto** e **Cidade** em um `grid grid-cols-1 sm:grid-cols-2 gap-4`, ficando lado a lado na mesma linha.
- Enviar `cidade` no `onSubmit`.

## Observações
- Nenhuma alteração de layout/funcionalidade fora do solicitado.
- A coluna é opcional (nullable), sem impacto em registros existentes.
- Não será incluída na listagem/tabela de projetos nesta etapa (não solicitado).
