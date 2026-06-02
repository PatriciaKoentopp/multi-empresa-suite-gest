## Alterações em `src/components/relogio/ImportarApontamentosModal.tsx`

### 1. Suporte a virada de dia (overnight)
- Ler nova coluna de **data de término** via `parseDateCell` com aliases: `Data de término`, `Data de termino`, `Data final`, `Data fim`.
- Criar função local `calcularDuracaoComDatas(dataIni, horaIni, dataFim, horaFim)`:
  - Calcula diferença em segundos entre os dois timestamps completos.
  - Se `dataFim` ausente e `horaFim < horaIni`, soma +24h (fallback).
  - Retorna decimal arredondado para 2 casas.
- Substituir o uso de `calcularDuracaoDecimal` no preview por essa nova função.
- `ApontamentoPayload` continua salvando `data` = data de início e `hora_fim` = hora de término (a duração já fica correta em `duracao_decimal`).

### 2. Exibir nome do projeto vindo da planilha
- Na coluna **Projeto** do preview, mostrar o nome lido da planilha (`nomeParsed`) em vez de sobrescrever com o nome do cadastro.
- Manter a resolução de `projeto_id` pelo código (sem alterar gravação no banco).
- Assim o usuário vê exatamente o que veio na planilha e percebe divergências de cadastro (ex.: código 209 cadastrado como "Edifício Sense" mas planilha trazendo "Edifício Montenegro").

Nenhum outro arquivo será alterado.