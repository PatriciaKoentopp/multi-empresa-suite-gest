# Conferência do app da Meta: o que falta

## O que já está certo
- App "ERP - Patrícia Corretora" está **Publicado**.
- Permissões de mensagens (`instagram_manage_messages`, `pages_messaging`, `pages_manage_metadata`, `pages_show_list`, `business_management`) estão **Prontas para teste**.
- No Messenger, o passo "Gere tokens de acesso" está concluído (página conectada).

## O que está faltando (pelas telas)
1. **Webhook do Messenger vazio** (tela "Configuração da API do Messenger", passo 1): URL e token em branco.
2. **Instagram não está ligado:** na tela "API do Instagram", o passo "Gerar tokens" ainda mostra **Adicionar conta** e o webhook está vazio.
3. **Ninguém além da Patrícia tem função no app** (Testadores: 0). Enquanto o app não passar pela análise da Meta (acesso avançado), **só chegam mensagens de quem tem função no app**. Mensagens de clientes comuns não são enviadas.
4. **Assinatura da página/conta** no campo `messages` não aparece feita.

## Caminho recomendado (combina com o app pronto)
O CRM usa o token da **página do Facebook**. Por isso, use o Instagram **pelo Messenger** (login do Facebook), e não pela opção "API do Instagram com login do Instagram".

1. **Casos de uso → Messenger from Meta → Personalizar → Configurações da API do Messenger**
   - Passo 1: URL de callback `https://multi-empresa-suite-gest.lovable.app/api/public/meta/webhook`; Verificar token = o valor salvo em META_VERIFY_TOKEN → **Verificar e salvar**.
   - Depois, em **Campos do webhook**, assine `messages` e `messaging_postbacks`.
   - Passo 2 (Gere tokens): ao lado da página, clique em **Adicionar assinaturas** e marque `messages`. Gere o token da página e confira se é o mesmo salvo em META_PAGE_TOKEN (se gerou outro, me avise para atualizar).
2. **Messenger from Meta → Configurações do Instagram**: conecte a conta do Instagram da Patrícia, preencha o mesmo webhook e assine `messages`.
3. **No Instagram (celular)**: Configurações → Mensagens e respostas → Ferramentas conectadas → **Permitir acesso às mensagens**.
4. **Teste**: Funções do app → Adicionar pessoas → Testador (uma conta Facebook/Instagram diferente da página). Aceite o convite e mande uma mensagem dessa conta para o Instagram da empresa.
5. **Para clientes reais**: Messenger → passo 3 "Faça a análise do app" → **Pedir permissão** para `pages_messaging` e `instagram_manage_messages` (acesso avançado). Exige verificação da empresa; a Meta leva alguns dias.

## O que eu faço no app
- Conferir o ID cadastrado (2145329802406998): se for o ID da conta do Instagram e não o da página, o recebimento já aceita os dois (ajuste feito na mudança anterior; precisa **Publicar → Atualizar**).
- Acompanhar o registro do servidor durante o teste do passo 4 e corrigir o que aparecer.
- Nenhuma outra alteração de código é necessária neste momento.

## Detalhes técnicos
- Código usa `graph.facebook.com/v21.0/me/messages` com token de página; o fluxo "Instagram Login" (graph.instagram.com, token IG) não é compatível sem mudanças — por isso o caminho via Messenger.
- Webhook aceita `object` = `page` e `instagram`; assinatura via META_APP_SECRET (chave secreta do app principal, não a "Chave secreta do app do Instagram").
