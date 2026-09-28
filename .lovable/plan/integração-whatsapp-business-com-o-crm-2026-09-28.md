# Integração WhatsApp Business com o CRM

## Limitações importantes (da própria Meta)
- **Grupos não chegam pela API oficial.** Só conversas individuais. Na prática, os grupos já ficam fora do CRM.
- **Contatos pessoais chegam normalmente.** Por isso existe a triagem manual (aprovar ou ignorar).
- Responder um contato é livre por até 24h depois da última mensagem dele. Depois disso, só é possível enviar um modelo de mensagem aprovado pela Meta (a aprovação leva até 48h).
- Como o número já é usado no celular, o celular continua funcionando junto. As conversas antigas só podem ser importadas nas primeiras 24h depois de conectar.

## Etapas

### 1. Migrar o app para a nova estrutura (TanStack Start)
Para o usuário, nada muda. Isso é o que permite ao app receber mensagens em tempo real. Esta etapa é feita pelo comando próprio de migração, antes das demais.

### 2. Conectar o WhatsApp Business
Pelo cartão de conexão do Lovable: login na Meta, escolha do número e verificação. O número fica vinculado ao Lovable Labs, que é parceiro verificado da Meta.

### 3. Caixa de triagem (nova página "CRM > WhatsApp")
Cada número novo que manda mensagem entra como **Pendente**, com nome, telefone e a última mensagem. Para cada contato há três ações:
- **Enviar ao funil:** cria o lead no funil e na etapa escolhidos, com a origem "WhatsApp".
- **Vincular a lead existente:** quando o número já é de um lead.
- **Ignorar:** o contato vai para a lista de bloqueados e as próximas mensagens dele não aparecem mais no CRM. Dá para desfazer a qualquer momento.

Se o telefone já pertence a um lead cadastrado, a mensagem entra direto nesse lead, sem passar pela triagem.

### 4. Conversa dentro do lead
Nova aba **WhatsApp** no modal do lead, com o histórico no formato de chat (enviadas e recebidas, data DD/MM/YYYY e hora) e um campo para responder. Fora da janela de 24h, o campo é trocado pela escolha de um modelo aprovado. Cada mensagem enviada ou recebida também é registrada como interação do tipo "whatsapp", para aparecer na Agenda.

### 5. Indicadores
- Na página de Leads, o cartão do lead mostra quantas mensagens não foram lidas.
- A página de triagem mostra quantos contatos estão pendentes.

### 6. Importar o histórico
Na página de triagem, um botão importa as conversas das primeiras 24h depois da conexão.

## Seção técnica
- Tabelas, todas com `empresa_id` e liberadas pelas regras de acesso por empresa, com GRANTs:
  - `whatsapp_contatos`: telefone, nome, status (pendente/crm/ignorado), lead_id, não lidas
  - `whatsapp_mensagens`: contato_id, direção, tipo, texto, mídia, wa_message_id único, status de entrega, data
  - `whatsapp_webhook_inbox`: registro bruto do que a Meta enviou, sem duplicar pelo id de entrega
- Recebimento: rota pública `POST /api/public/whatsapp/webhook`, com verificação de assinatura. Ela grava na inbox, ignora bloqueados, cria ou atualiza o contato e registra a mensagem.
- Envio e modelos: funções de servidor que usam o gateway (`/messages`, `/message_templates`, `/smb_app_data`) e conferem se o usuário pertence à empresa.
- Atualização da tela em tempo real (Supabase Realtime) nas tabelas de mensagens e contatos.
- Telefones normalizados em E.164 com a função `formatarNumeroWhatsApp` que já existe, usada também para comparar com `leads.telefone`.
- A origem "WhatsApp" é criada em `origens` se ainda não existir.
- As cores dos botões e ícones seguem o padrão da página Favoritos.
