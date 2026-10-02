# Nova seção "Tarefas Realizadas" na Agenda Pessoal

Criar uma nova página no menu **Agenda Pessoal**, logo após **Painel da Tríade**, listando em formato de tabela as tarefas com status **concluída**, com filtros por **período de data** e por **papel**.

## O que será feito

1. **Nova página** `src/pages/agenda-pessoal/tarefas-realizadas/index.tsx`
   - Título "Tarefas Realizadas".
   - Filtros no topo:
     - **Período**: campos "De" e "Até" (data). Padrão: do dia 1º do mês corrente até hoje.
     - **Papel**: Select com "Todos" + os papéis cadastrados.
   - Listagem em tabela (padrão da página Papéis e Metas), colunas:
     - Data (DD/MM/YYYY), Horário (início–fim), Tarefa, Papel (com a cor do papel), Tríade (badge com as cores já usadas), Duração (formato "18h30"), Meta vinculada (quando houver).
   - Ordenação: data decrescente (mais recentes primeiro) e, na mesma data, por hora de início.
   - Contador de registros e total de horas do resultado filtrado.
   - Apenas leitura (sem editar/excluir por aqui — isso continua no Planejamento).
   - Dados via `useAgendaTarefas(inicio, fim)` + `useAgendaPapeis` de `src/hooks/useAgendaPessoal.ts`; filtro `status === "concluida"` aplicado na listagem.

2. **Nova rota** `src/routes/agenda-pessoal/tarefas-realizadas.tsx`
   - Mesmo padrão das rotas da Agenda Pessoal: `PrivateRoute` + `MainLayout`, com `head()` (título e descrição próprios).

3. **Menu** `src/config/navigation.ts`
   - Novo subitem de "Agenda Pessoal", na posição após "Painel da Tríade":
     - `Tarefas Realizadas` → `/agenda-pessoal/tarefas-realizadas`.

## Observações técnicas

- Sem mudança de banco: tudo vem das tabelas `agenda_tarefas` e `agenda_papeis` existentes.
- O filtro de menu por empresa (`useModulosParametros`) trata chaves desconhecidas como ativas, então nenhuma migração em `modulos_parametros` é necessária.
- Datas manipuladas como "yyyy-MM-dd" e exibidas em DD/MM/YYYY via `fmtData`, sem timezone (padrão do projeto).
