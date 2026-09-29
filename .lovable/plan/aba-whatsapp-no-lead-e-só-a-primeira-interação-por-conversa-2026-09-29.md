# Aba "WhatsApp" no lead e só a primeira interação por conversa

## O que muda para o usuário
- No lead (página /crm/leads), aparece uma nova aba **WhatsApp**, depois de "Interações".
- A aba mostra a conversa igual à página /crm/whatsapp: balões de mensagens recebidas e enviadas, data/hora DD/MM/AAAA HH:MM, ícones de status (enviada, entregue, lida, falhou), campo para escrever e botão Enviar.
- Novas mensagens aparecem na hora, com o lead aberto.
- Se o lead ainda não tem conversa, a aba mostra um aviso, e a primeira mensagem enviada usa o telefone do lead (mesma regra de hoje).
- Na aba **Interações**, só entra **uma** interação do tipo WhatsApp por lead: "Início da conversa pelo WhatsApp", que marca quando a conversa começou (recebida ou enviada). As mensagens seguintes não geram mais interações.
- Uma interação do tipo WhatsApp registrada à mão na aba Interações continua enviando a mensagem (comportamento atual), mas sem criar interações repetidas.

## Mensagens antigas
- As interações "Recebida: ..." / "Enviada: ..." já criadas: manter só a primeira de cada lead (renomeada para "Início da conversa pelo WhatsApp") e remover as demais. As mensagens continuam guardadas e visíveis na nova aba.

## Detalhes técnicos
- `whatsapp.server.ts` `registrarInteracaoLead`: antes de inserir, verificar se já existe `leads_interacoes` com `lead_id` e `tipo='whatsapp'`; se existir, apenas atualizar `leads.ultimo_contato`. Descrição fixa "Início da conversa pelo WhatsApp".
- Novo componente `src/pages/crm/leads/components/WhatsappTab.tsx`: busca `whatsapp_contatos` por `lead_id`, carrega `whatsapp_mensagens` por `contato_id` (ordem `created_at`), zera `nao_lidas`, realtime em `whatsapp_mensagens` filtrado por `contato_id`; envio via `enviarWhatsappLead` (server function existente). Visual copiado do chat de `/crm/whatsapp`.
- `lead-form-modal.tsx`: novo `TabsTrigger`/`TabsContent` "whatsapp" após "interacoes", mesmo estilo; exibido só em lead existente.
- Limpeza de dados via SQL: por lead, manter a interação whatsapp mais antiga (atualizar descrição) e excluir as demais do tipo whatsapp.
- A regra só passa a valer para mensagens recebidas depois de publicar o site.
