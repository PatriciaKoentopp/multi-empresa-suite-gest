## Corrigir parser da coluna "Projeto" na importação de apontamentos

### Problema
O parser atual em `ImportarApontamentosModal.tsx` (`parseCodigo`) procura pelo separador exato `" - "` (espaço-hífen-espaço) e ainda remove conteúdo entre `()`, `[]` e `{}` do nome. Isso faz com que linhas onde o separador aparece como `-` (sem espaços) ou cujo nome contém parênteses/colchetes sejam exibidas com código vazio ou nome incompleto.

### Correção

Em `src/components/relogio/ImportarApontamentosModal.tsx`, ajustar a função `parseCodigo` para:

1. Localizar o **primeiro `-`** da string (independente de ter espaços ao redor).
2. Usar a parte **antes** do `-` como `codigo` (trim).
3. Usar a parte **após** o `-` como `nome` (trim), **sem remover** trechos entre parênteses/colchetes/chaves.
4. Se não houver `-`, manter comportamento atual (texto inteiro vira nome, código vazio).

A resolução do projeto continua sendo feita por `codigo` normalizado contra `relogio_projetos.codigo` (mesma lógica já existente).

### Arquivos alterados
- `src/components/relogio/ImportarApontamentosModal.tsx` — apenas a função `parseCodigo`.

Nenhuma outra alteração de layout, hook ou banco.
