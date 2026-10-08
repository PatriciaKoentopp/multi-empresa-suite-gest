# Mostrar no CRM as mensagens enviadas pelo celular

## O que foi encontrado (últimos 7 dias)
- Mensagens **recebidas** dos clientes: 594 chegaram e 593 estão gravadas — essas estão aparecendo.
- Mensagens **enviadas pelo celular** (app WhatsApp Business): 682 chegaram ao sistema, mas **nenhuma foi gravada**. O sistema não trata esse tipo de aviso, por isso as suas respostas pelo celular não aparecem nas conversas.
- Por consequência, 797 avisos de "entregue/lida" estão parados esperando essas mensagens.

## O que muda
- As mensagens enviadas pelo celular passam a aparecer na conversa (página WhatsApp e aba WhatsApp do lead) como balão de mensagem enviada, com data/hora DD/MM/AAAA HH:MM e os ícones de entregue/lida.
- As 682 mensagens já recebidas e não exibidas são recuperadas.
- Não criam interações novas no lead, exceto a "Início da conversa pelo WhatsApp" quando o lead ainda não tiver nenhuma (regra atual).
- Grupos continuam ignorados; contatos "Fora do CRM" seguem sem gerar lead.

## Detalhes técnicos
- `src/lib/whatsapp.server.ts`: nova `processarEcos(admin, value)` para `whatsapp.smb_message_echoes` lendo `value.message_echoes[]` (`to` = contato, `id`, `timestamp`); acha/cria contato pelo `to` (mesma regra de lead aberto de `processarMensagens`), upsert em `whatsapp_mensagens` com `direcao='saida'`, `status='sent'`, `onConflict wa_message_id`, atualiza `ultima_mensagem_em` e chama `registrarInteracaoLead` (que já evita duplicar).
- `processarEvento`: adicionar o ramo do novo evento.
- Recuperação: reprocessar os eventos `smb_message_echoes` já guardados (marcar `processed_at = null` e rodar em lotes), depois os `whatsapp.status` pendentes passam a casar.
