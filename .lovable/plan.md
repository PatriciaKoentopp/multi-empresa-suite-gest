# Retirar do CRM diretamente na página de Leads

## Objetivo
Permitir retirar um lead do CRM (e devolvê-lo) diretamente no cartão do lead em `/crm/leads`, com o mesmo comportamento da página `/crm/whatsapp`: o lead fica inativo e o contato de WhatsApp vinculado passa para "Fora do CRM" (deixa de gerar interações/leads automáticos).

## Mudanças

### 1. `src/pages/crm/leads/index.tsx`
- Nova função `handleRetirarDoCrm(leadId)`:
  - Atualiza `leads.status` para `'inativo'`.
  - Atualiza `whatsapp_contatos.status` para `'fora'` nos contatos com `lead_id = leadId` (se houver).
  - Remove o lead da lista exibida (filtro padrão é "ativos") e mostra toast "Lead retirado do CRM".
- Nova função `handleVoltarAoCrm(leadId)` (usada quando o filtro de status é "inativo"):
  - Atualiza `leads.status` para `'ativo'`.
  - Atualiza `whatsapp_contatos.status` para `'crm'` nos contatos vinculados.
  - Remove o lead da lista de inativos e mostra toast "Lead devolvido ao CRM".
- Passa as duas funções ao `LeadCard`, junto com o status atual do filtro.

### 2. `src/pages/crm/leads/lead-card.tsx`
- Novo item no menu de ações do cartão (ícone `UserMinus` em vermelho, mesmo padrão da página WhatsApp): **"Retirar do CRM"**, visível quando o lead está ativo.
- Quando o filtro da página é "Inativos", o item exibido é **"Voltar ao CRM"** (ícone `UserPlus` em verde), que reverte a operação.
- O item "Excluir" existente permanece inalterado.

## Comportamento resultante
- Lead ativo → "Retirar do CRM": lead some da lista de ativos, fica inativo e, se veio do WhatsApp, o contato passa para "Fora do CRM" na página de conversas.
- Filtro "Inativos" → "Voltar ao CRM": lead volta a ativo e o contato do WhatsApp volta para "No CRM".
- Leads sem vínculo com WhatsApp: apenas o status do lead muda, sem erro.

## Verificação
- `tsc` limpo e build OK.
- Conferência visual pelo usuário na prévia (acesso autenticado não disponível no sandbox).
