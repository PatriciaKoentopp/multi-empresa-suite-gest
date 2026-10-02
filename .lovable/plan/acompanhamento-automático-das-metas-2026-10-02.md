# Acompanhamento automático das Metas

## Situação atual
- A meta tem só um campo "Progresso (%)" digitado à mão; nada o atualiza.
- As tarefas já podem ser ligadas a uma meta (campo Meta no modal da tarefa) e têm duração e situação (pendente/concluída).

## O que muda

### 1. Modal Nova/Editar Meta
Novo campo **Tipo de contabilização**:
- **Quantidade** — ex.: 12 idas à academia. Campos: **Quantidade alvo** e **Unidade** (ex.: "vezes", "treinos").
- **Tempo** — ex.: 40 horas de estudo. Campo: **Horas alvo**.
- **Manual** — mantém o progresso digitado como hoje (para metas que não dependem de tarefas).

O campo "Progresso (%)" só aparece no tipo Manual. Metas já existentes ficam como Manual, sem perder o valor atual.

### 2. Cálculo automático do progresso
Considera apenas tarefas **concluídas** ligadas à meta:
- Quantidade: cada tarefa concluída conta 1.
- Tempo: soma da duração das tarefas concluídas.
- Progresso = realizado / alvo (limitado a 100%).
Ao marcar/desmarcar uma tarefa como realizada (Planejamento ou Agenda Unificada), a meta se atualiza sozinha.

### 3. Tabela de Metas
- Coluna **Tipo** (Quantidade / Tempo / Manual).
- Coluna **Realizado / Alvo** — ex.: "7 / 12 vezes" ou "18h30 / 40h".
- Barra de progresso usa o valor calculado.
- Quando chega a 100%, aparece a etiqueta "Atingida" (a situação continua sendo alterada pelo usuário, sem mudança automática).

Layout, cores dos botões e ícones permanecem no padrão atual.

## Detalhes técnicos
- Migração em `agenda_metas`: `tipo_medicao text not null default 'manual'` (check: quantidade/tempo/manual), `valor_alvo numeric null`, `unidade text null`.
- `useAgendaMetas`: após carregar metas, buscar `agenda_tarefas` com `status='concluida'` e `meta_id in (...)` (em lotes de 50) e calcular `realizado` por meta (contagem ou soma de `duracao_min`); expor `realizado` e `percentual` em cada meta. Sem trigger no banco — o cálculo é feito na leitura, então sempre reflete as tarefas.
- `AgendaMeta` ganha `tipo_medicao`, `valor_alvo`, `unidade`; para tempo, `valor_alvo` em horas (convertido para minutos no cálculo).
- `src/pages/agenda-pessoal/metas/index.tsx`: novos campos no modal (Select de tipo + inputs condicionais) e novas colunas na tabela.
