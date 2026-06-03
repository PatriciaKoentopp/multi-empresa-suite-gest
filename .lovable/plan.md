# Corrigir importação de apontamentos com códigos duplicados

## Problema
No `src/components/relogio/ImportarApontamentosModal.tsx`, o `Map` `projByCodigo` usa apenas `norm(p.codigo)` como chave. Quando vários projetos compartilham o mesmo código (ex.: "209" para Montenegro, Frame, Sense e Showroom Cidade das Águas), o `Map.set` sobrescreve entradas anteriores e sobra apenas o último projeto inserido. Resultado: todas as linhas importadas vão para o mesmo `projeto_id`, mesmo que o preview exiba o nome correto (o preview mostra o nome vindo da planilha via `parseCodigo`, sem refletir o projeto realmente resolvido).

## Solução
Resolver o projeto pela combinação de **código + nome** (com fallback ao código quando único).

### Alterações em `src/components/relogio/ImportarApontamentosModal.tsx`

1. Substituir `projByCodigo: Map<string, RelogioProjeto>` por dois índices:
   - `projsByCodigo: Map<string, RelogioProjeto[]>` — agrupa todos os projetos por código normalizado.
   - Lookup por (codigo + nome normalizado) executado em runtime.

2. Na resolução de cada linha:
   - Obter o array de candidatos por `norm(codigo)`.
   - Se houver 1 candidato → usar diretamente.
   - Se houver vários → escolher aquele cujo `norm(p.nome) === norm(nomeParsed)`. Se não casar exatamente, tentar match por `startsWith`/`includes` normalizado como fallback tolerante. Se ainda assim ambíguo, marcar a linha como inválida com motivo "Projeto ambíguo (código duplicado, nome não confere)".
   - Se não houver candidatos → manter erro atual "Projeto X não cadastrado".

3. Ajustar o motivo de erro quando o código existir mas o nome não bater, para deixar claro ao usuário (ex.: `Projeto "209 - Edifício X" não encontrado (código duplicado)`).

4. Preview: passar a exibir o nome do **projeto resolvido** (quando houver `projeto_id`) em vez de apenas o nome cru da planilha, para que o usuário confirme visualmente que o destino está correto antes de importar.

### Fora de escopo
- Nenhuma alteração em `useApontamentosRelogio.ts` (a gravação já usa `projeto_id` corretamente; o bug é puramente na resolução do id antes do insert).
- Nenhuma alteração de schema ou de outros fluxos.
