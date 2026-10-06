# Responsável padrão = usuário logado (CRM > Leads)

## Objetivo
No modal de lead (`/crm/leads`), o campo **Responsável** deve vir preenchido com o usuário logado, tanto na aba **Dados do Lead** quanto na aba **Interações** (nova interação).

## Situação atual (confirmada no código)
- `src/pages/crm/leads/lead-form-modal.tsx`:
  - Lead novo: responsável padrão é o **primeiro vendedor ativo** da lista (linha ~251).
  - Lead existente: responsável vem do próprio lead; a nova interação herda o responsável do lead (linhas ~240-248).
- A tabela `usuarios` não tem coluna `user_id`; a ligação com o login é feita pelo **e-mail** (`usuarios.email` = e-mail do usuário autenticado).

## Mudanças
Em `src/pages/crm/leads/lead-form-modal.tsx`:

1. **Identificar o usuário logado**: ao abrir o modal, obter o e-mail do usuário autenticado (`supabase.auth.getUser()`) e localizar o registro correspondente em `usuarios` (mesmo e-mail, status ativo).
2. **Aba Dados do Lead**:
   - Lead novo: responsável padrão passa a ser o usuário logado (em vez do primeiro vendedor). Se o usuário logado não for encontrado na lista de usuários, mantém o comportamento atual (primeiro vendedor ativo).
   - Lead existente (edição): mantém o responsável já gravado no lead — não sobrescreve dados existentes.
3. **Aba Interações**: a nova interação passa a ter como responsável padrão o usuário logado (tanto para lead novo quanto existente), em vez de herdar o responsável do lead.
4. O campo continua **editável**: quem quiser pode trocar o responsável manualmente, como hoje.

## Fora de escopo
- Nenhuma mudança de layout, permissões ou banco de dados.
- Interações já gravadas não são alteradas.

## Detalhes técnicos
- Arquivo alterado: apenas `src/pages/crm/leads/lead-form-modal.tsx`.
- A busca do usuário logado usa `supabase.auth.getUser()` (já usado no mesmo arquivo, linha ~386) e compara `user.email` com `usuarios.email` (case-insensitive).
- O estado `novaInteracao.responsavelId` e `formData.responsavelId` passam a ser inicializados com o id encontrado.
