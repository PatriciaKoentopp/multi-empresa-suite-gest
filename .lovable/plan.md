## Objetivo

No `/relatorios/projetos`, agrupar os projetos pelo **código** (numeroProjeto normalizado), de forma que múltiplos registros de `relogio_projetos` com o mesmo código apareçam como uma única linha — somando fotos e horas, e mesclando clientes.

## Alteração

Apenas em `src/hooks/useRelatorioProjetosFotosDB.ts`:

- Após montar a lista atual de projetos (um por linha do banco), agrupar por `numeroProjeto`:
  - `fotosTiradas`, `fotosEnviadas`, `fotosVendidas`, `totalHoras` → soma.
  - `cliente` → união dos nomes distintos (não vazios), concatenados por `, `.
- Aplicar o filtro existente (cliente preenchido e algum valor > 0) **após** o agrupamento.

Restante do fluxo (`useRelatorioProjetos`, página, tabela, gráficos, métricas, exportação Excel) permanece inalterado, pois já consome `ProjetoFotosInput` por `numeroProjeto`.

## Fora do escopo

- Nenhuma mudança em layout, filtros, métricas, gráficos ou em `/relatorios/fotos`.
- Sem alterações em schema ou em outras telas.
