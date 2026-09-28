# Regra: WhatsApp sempre no lead aberto

## O que muda
- **Mensagem recebida:** se o contato já tem um lead **aberto** (situação "ativo"), a mensagem continua sendo registrada nas Interações desse lead, como hoje.
- **Sem lead aberto** (lead fechado, perdido/inativo ou apagado): o app abre um **novo lead** para o contato, igual ao primeiro lead — primeira etapa do funil configurado na Implantação, Origem "WhatsApp" — e a mensagem passa a ser registrada nele. O lead antigo fica intacto, com seu histórico.
- O novo lead herda do lead anterior o nome, telefone e o favorecido vinculado (quando houver).
- **Mensagem enviada pelo lead** (interação tipo WhatsApp): continua indo para o lead em que você está; a conversa passa a apontar para esse lead.
- **Contatos "Fora do CRM"** (retirados manualmente) continuam sem gerar lead — a regra acima vale só para contatos no CRM. Grupos seguem ignorados.

## Detalhes técnicos
- `src/lib/whatsapp.server.ts` (`processarMensagens`): antes de criar lead, se `contato.lead_id` existe, consultar `leads.status`; tratar como aberto só se `status = 'ativo'`. Caso contrário (ou lead inexistente), criar novo lead (copiando `favorecido_id`, `nome`, `telefone` do anterior) e atualizar `whatsapp_contatos.lead_id`.
- Corrigir no mesmo trecho o `.select("id")` do upsert de mensagem para garantir que `ultima_mensagem_em` seja gravado (pendência anterior).
- `src/lib/whatsapp.functions.ts` (`enviarWhatsappLead`): ao achar/criar o contato pelo telefone, sempre atualizar `lead_id` para o lead atual (hoje só atualiza se estiver vazio); na busca por `lead_id`, manter.
- Página WhatsApp: "Voltar ao CRM" em contato cujo lead está fechado continua reativando o lead (sem mudança).
