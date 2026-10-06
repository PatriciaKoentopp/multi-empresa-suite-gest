# CRM pronto para mensagens do Instagram e Facebook

## O que muda para você
1. **Nova página "Implantação Instagram/Facebook"** no menu CRM, logo após "Implantação do WhatsApp", no mesmo visual dela:
   - Cadastro de cada conta da empresa: canal (Instagram ou Facebook Messenger), nome, identificador da página/conta, credencial (token), funil e etapa inicial, ativo/inativo.
   - Tabela com as contas cadastradas, botões de editar (azul) e excluir (vermelho), como no padrão Favoritos.
   - Quadro "Como implantar" com os passos na Meta.
2. **Recebimento das mensagens**: quando alguém mandar Direct no Instagram ou mensagem na página do Facebook, a mensagem entra no CRM igual ao WhatsApp:
   - Se a pessoa já é um lead ligado àquela conta, a mensagem vai para o lead aberto.
   - Se é nova, cria o lead no funil e na etapa escolhidos, com origem "Instagram" ou "Facebook".
   - Cada mensagem registra uma interação do tipo "instagram" ou "facebook" (já existem na lista de tipos).
3. **Conversa no lead**: a aba de conversa do lead passa a mostrar também as mensagens do Instagram/Facebook, com o canal indicado, e permite responder (a Meta só libera resposta livre até 24h após a última mensagem do cliente).

## O que fica pendente do seu lado
- Criar na Meta o app com o produto Messenger/Instagram, ligar a conta Instagram profissional à página do Facebook e gerar o token da página. Depois de pronto, eu peço o token pelo formulário seguro e informo a URL do webhook e a palavra de verificação para colar na Meta.
- Até isso acontecer, a página de implantação funciona, mas nenhuma mensagem chega.

## Detalhes técnicos
- Tabela `meta_contas` (empresa_id, canal 'instagram'|'facebook', nome, page_id único, secret_name, funil_id, etapa_id, ativo) com RLS por empresa (`get_user_company_id()`) e GRANTs.
- Reaproveitar `whatsapp_contatos`/`whatsapp_mensagens` adicionando coluna `canal` (default 'whatsapp') e `meta_conta_id` nullable, para a aba de conversa e os contadores servirem aos três canais sem duplicar telas. `wa_id` passa a guardar o PSID/IGSID nos novos canais.
- Rota pública `GET/POST /api/public/meta/webhook`: GET responde ao desafio `hub.verify_token` (segredo META_VERIFY_TOKEN); POST valida `X-Hub-Signature-256` com META_APP_SECRET (HMAC, comparação segura), grava em `whatsapp_webhook_events` e roteia pela `page_id` para `meta_conta`.
- `src/lib/meta.server.ts` (processamento e envio via Graph API `/me/messages` com o token da conta) e `src/lib/meta.functions.ts` (server fns autenticadas: listar credenciais, enviar mensagem).
- Página `src/pages/crm/meta-implantacao/index.tsx` + rota `src/routes/crm/meta-implantacao.tsx` (PrivateRoute + MainLayout + head) e item em `src/config/navigation.ts`.
- Origens "Instagram"/"Facebook" criadas em `origens` se não existirem.
- Registrar a decisão no `AGENTS.md`.
