# Agenda do CRM: esconder leads retirados e ver todos os leads do dia

## O que muda
1. **Leads retirados do CRM não aparecem mais na agenda.** Leads inativos (retirados pelo menu "Retirar do CRM" ou pela página WhatsApp) deixam de aparecer. Leads ativos e fechados continuam aparecendo como hoje.
2. **Clique no dia para ver todos os leads.** Ao clicar num dia do calendário (ou no "+N mais"), abre uma janela com o título "Agenda de DD/MM/AAAA" listando todas as interações daquele dia, com o mesmo ícone, cor e nome do lead usados hoje. Clicar num item abre o lead, igual ao clique atual no calendário.
- O calendário continua mostrando 3 itens por dia; o resto do layout não muda.

## Detalhes técnicos
- `src/pages/crm/agenda/index.tsx`:
  - Na consulta de `leads_interacoes`, incluir `status` em `leads!inner(...)` e filtrar `.neq("leads.status", "inativo")`.
  - Novo estado `diaSelecionado: Date | null`; `DayCell` recebe `onDayClick` (clique na célula e no "+N mais"; o clique no chip já usa `stopPropagation`).
  - `Dialog` (shadcn) com a lista rolável (`max-h` com overflow) das interações do dia, reutilizando `InteracaoChip`.
