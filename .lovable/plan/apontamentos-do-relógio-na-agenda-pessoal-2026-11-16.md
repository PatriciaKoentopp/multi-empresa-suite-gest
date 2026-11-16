# Apontamentos do Relógio na Agenda Pessoal

## O que muda para você
1. **Tipos de Projeto** (/relogio/tipos-projeto): novo campo **Papel** (lista dos papéis da Agenda Pessoal do usuário logado), no modal e numa coluna da listagem.
2. Todo apontamento do Relógio passa a aparecer na Agenda Pessoal (Agenda, Planejamento, Painel da Tríade, Tarefas Realizadas) como tarefa:
   - Título: **Horas Apontadas**
   - Data, hora início, hora fim e duração do apontamento
   - Tríade: **Importante**
   - Papel: o do tipo de projeto do apontamento (vazio se o tipo não tiver papel)
   - Descrição: projeto / tarefa / observação
   - Status: **Realizada** (conta nas horas do Painel da Tríade)
3. Incluir, editar ou excluir um apontamento atualiza/remove automaticamente a tarefa correspondente (inclusive no Google Agenda, se conectado, como já ocorre com as tarefas).
4. Os apontamentos já existentes também são levados para a agenda de quem os registrou.

## Regras
- A agenda é pessoal: a tarefa vai para a agenda do usuário que fez o apontamento.
- A tarefa gerada é somente leitura na Agenda Pessoal (alterações devem ser feitas no Relógio), para não divergir dos apontamentos.

## Detalhes técnicos
- Migração:
  - `relogio_tipos_projeto.papel_id uuid` (FK `agenda_papeis`, on delete set null).
  - `relogio_apontamentos.user_id uuid default auth.uid()`.
  - `agenda_tarefas.relogio_apontamento_id uuid unique` (FK on delete cascade).
  - Trigger `security definer` em `relogio_apontamentos` (insert/update/delete) que faz upsert/delete em `agenda_tarefas` com titulo 'Horas Apontadas', triade 'importante', status 'realizada', papel do tipo de projeto (só se o papel pertencer ao mesmo usuário).
  - Carga inicial dos apontamentos antigos: sem `user_id` hoje — serão atribuídos ao usuário administrador da empresa (confirmar se preferir outro).
- `useTiposProjetoRelogio` + página tipos-projeto: campo Papel (Select de `agenda_papeis` do usuário).
- Agenda Pessoal: tarefas com `relogio_apontamento_id` abrem modal em modo leitura e sem checkbox/repetir/excluir; sincronização Google reutiliza o fluxo atual.
- Registrar a decisão no AGENTS.md.
