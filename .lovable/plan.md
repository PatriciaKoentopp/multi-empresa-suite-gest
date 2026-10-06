# Liberar a verificação do webhook da Meta

## Por que a Meta recusou
Para confirmar o endereço, a Meta chama o app e compara a palavra de verificação digitada com a palavra guardada no sistema. Hoje essa palavra (META_VERIFY_TOKEN) ainda não está guardada no app, e o site publicado ainda não tem o endereço novo. Então o app responde "proibido" e a Meta mostra esse erro.

## O que vou fazer
1. Abrir o formulário seguro para você cadastrar:
   - **META_VERIFY_TOKEN**: uma palavra que você inventa (ex.: `crm-meta-2026`). Use a mesma palavra no campo "Verificar token" da Meta.
   - **META_APP_SECRET**: Meta for Developers → seu app → Configurações do app → Básico → "Chave secreta do aplicativo" (botão Mostrar).
2. Pedir para você clicar em **Publicar** e depois **Atualizar**, para o site publicado receber o endereço do webhook.
3. Testar o endereço publicado com a palavra de verificação antes de você voltar à Meta.

## Na Meta, depois disso (passo 2)
- **URL de callback:** `https://multi-empresa-suite-gest.lovable.app/api/public/meta/webhook`
  (não use o endereço da Vercel nem o de pré-visualização)
- **Verificar token:** a mesma palavra cadastrada no META_VERIFY_TOKEN.
- Clicar em **Verificar e salvar**.

## Detalhes técnicos
- Nenhuma alteração de código: a rota GET já responde `hub.challenge` quando `hub.verify_token` confere com `process.env.META_VERIFY_TOKEN`.
- Teste: `curl "<url>?hub.mode=subscribe&hub.verify_token=...&hub.challenge=123"` deve retornar `123`.
