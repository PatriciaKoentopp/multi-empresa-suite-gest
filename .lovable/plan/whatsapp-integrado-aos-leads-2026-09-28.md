# WhatsApp integrado aos Leads

## O que muda para o usuário
1. **Origem "WhatsApp" automática** — todo lead criado por uma mensagem recebida já vem com o campo Origem (aba Dados do Lead) preenchido como "WhatsApp". Se a origem não existir no cadastro de Origens da empresa, ela é criada automaticamente. Leads antigos criados pelo WhatsApp também recebem essa origem.
2. **Mensagens na aba Interações** — cada mensagem recebida ou enviada (pela página WhatsApp ou pelo lead) aparece como interação do tipo WhatsApp, com a data, o texto e a indicação "Recebida" ou "Enviada". O status da interação fica como "realizada".
3. **Enviar pelas Interações** — ao criar uma nova interação do tipo WhatsApp num lead ligado a um contato de WhatsApp, a descrição é enviada de verdade para o cliente, igual ao envio da página /crm/whatsapp (mesma regra das 24 horas e mesmos avisos de erro). Se o envio falhar, a interação não é gravada e aparece o motivo.
   - Se o lead não tiver contato de WhatsApp mas tiver telefone, o contato é criado/ligado usando o número de WhatsApp da empresa.
   - Interações WhatsApp que chegarem enquanto o lead estiver aberto aparecem na hora.

## Detalhes técnicos
- `whatsapp.server.ts` `processarMensagens`: ao criar lead, buscar/criar `origens` (nome "WhatsApp", empresa) e gravar `origem_id`; após inserir mensagem nova com lead ligado, inserir `leads_interacoes` (tipo `whatsapp`, descricao `"Recebida: <texto>"`, data = dia da mensagem em SP, status `realizada`) e atualizar `leads.ultimo_contato`.
- Nova função interna `enviarParaContato` reutilizada por `enviarMensagemWhatsapp` e nova server fn `enviarWhatsappLead({ leadId, texto })` (requireSupabaseAuth; acha contato por `lead_id`, ou cria por `telefone` só com dígitos no número ativo da empresa). Envios geram interação `"Enviada: <texto>"`; a página WhatsApp passa a registrar a interação também.
- `InteracoesTab`/`NovaInteracaoForm`: quando tipo = whatsapp, chamar `enviarWhatsappLead` em vez de inserir direto; recarregar lista. Assinatura realtime em `whatsapp_mensagens` filtrada pelo contato do lead para recarregar interações.
- Ajuste de dados (run_sql): definir `origem_id` WhatsApp nos leads com observação "Lead criado automaticamente pelo WhatsApp" e gerar interações para as mensagens já existentes.
- Sem mudança de estrutura no banco.
