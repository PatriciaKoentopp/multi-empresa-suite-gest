# Apontamento de Horas — Relógio

## Análise da planilha
Cada apontamento tem: **Projeto**, **Tarefa**, **Data início**, **Hora início**, **Data fim**, **Hora fim**, **Duração (HH:MM:SS)** e **Duração decimal** (ex.: 03:08:00 = 3,13h). A duração decimal é calculada como `(fim - início) em segundos / 3600`.

## Banco de dados (migration)
Criar tabela `relogio_apontamentos`:
- `id`, `empresa_id`, `projeto_id` (FK), `tarefa_id` (FK, nullable)
- `data` (date, sem timezone)
- `hora_inicio` (time), `hora_fim` (time, nullable enquanto cronômetro roda)
- `duracao_decimal` (numeric)
- `origem` ('manual' | 'cronometro')
- `status` ('em_andamento' | 'concluido')
- `observacao` (text, opcional)
- `created_at`, `updated_at`

RLS por `empresa_id` (mesmo padrão das outras tabelas relogio_*) + GRANTs para authenticated/service_role.

## Frontend

### Navegação
`src/config/navigation.ts` — adicionar "Apontamento" no menu Relógio, abaixo de "Projetos", apontando para `/relogio/apontamento`.

### Tipo
`src/types/relogio.d.ts` — adicionar interface `RelogioApontamento`.

### Hook
`src/hooks/useApontamentosRelogio.ts` — CRUD + cálculo decimal + busca de cronômetro ativo da empresa.

### Página `src/pages/relogio/apontamento/index.tsx`
Layout no padrão das demais páginas Relógio (header + tabela), com **dois botões** de novo apontamento:
1. **Novo Apontamento (Manual)** — abre modal com: Projeto, Tarefa (filtrada por tipo do projeto), Data (DD/MM/YYYY, sem TZ), Hora início (HH:MM), Hora fim (HH:MM). Calcula e exibe duração decimal automaticamente.
2. **Iniciar Cronômetro** — abre modal com Projeto + Tarefa, ao confirmar grava registro `em_andamento` com `hora_inicio = now()` local. Enquanto há cronômetro ativo a página exibe um card no topo com tempo corrido (atualizado por `setInterval` a cada 1s) e botão **Parar**, que grava `hora_fim` e calcula duração.

### Tabela de apontamentos
Colunas: Data, Projeto, Tarefa, Início, Fim, Duração (HH:MM:SS), Duração decimal, Origem, Ações (editar/excluir). Filtros por projeto e período.

### Modais
- `src/components/relogio/ApontamentoManualModal.tsx`
- `src/components/relogio/ApontamentoCronometroModal.tsx`

### Utilitários
Reutilizar `decimalToHHMMSS` / `hhmmssToDecimal` de `src/utils/timeUtils.ts`. Datas sempre via `dateToISOString`/`parseDateString` (12:00 PM, sem timezone).

## Regras técnicas
- Datas no formato DD/MM/YYYY na UI; persistir como `YYYY-MM-DD` sem conversão de timezone.
- Duração decimal = `(segundos_fim - segundos_inicio) / 3600`, arredondada a 2 casas.
- Cronômetro: apenas 1 ativo por usuário/empresa por vez (validação no modal).
- Manter padrão de cores/botões das páginas Relógio existentes.
