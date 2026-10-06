# Por que a mensagem do Instagram não chegou

## O que verifiquei
- A Meta validou o endereço com sucesso (15:56).
- A conta "Patrícia Corretora" (Instagram, ID 2145329802406998) está cadastrada, ativa, com funil e etapa.
- **Desde então, a Meta não enviou nenhuma mensagem ao app.** O problema está na configuração da Meta, não no CRM.

## O que conferir na Meta (nesta ordem)
1. **Assinaturas do Instagram:** Meta for Developers → seu app → Webhooks → escolha o objeto **Instagram** (não só "Page") → clique em **Assinar** no campo `messages`.
2. **Ligar a página ao app:** Messenger → Configurações da API do Instagram → em "Gerar tokens", clique em **Adicionar assinaturas** na sua página/conta e marque `messages`. Sem isso a Meta não encaminha nada.
3. **Modo do app:** se o app estiver em **Desenvolvimento**, só chegam mensagens enviadas por contas com função no app (administrador/testador). Mande a mensagem de outra conta do Instagram que tenha função no app, ou publique o app (modo Ao vivo).
4. **Acesso a mensagens no Instagram:** no app do Instagram → Configurações → Mensagens e respostas → Ferramentas conectadas → ligue **Permitir acesso às mensagens**.
5. **Token da página:** confirmar que o `META_PAGE_TOKEN` foi salvo (eu verifico).

## O que farei depois
- Acompanhar o registro do servidor enquanto você manda uma nova mensagem.
- Se chegar com um ID diferente do cadastrado (o Instagram às vezes envia o ID da conta do Instagram, não o da página), ajusto o cadastro para receber pelos dois IDs.

## Detalhes técnicos
- Logs: só GETs de verificação; nenhum POST em `/api/public/meta/webhook`.
- Possível ajuste: em `processarPayloadMeta`, buscar `meta_contas` também pelo `recipient.id` do evento, além de `entry.id`.
