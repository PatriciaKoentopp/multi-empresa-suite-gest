# Corrigir o erro "accounts.google.com está bloqueado" na conexão do Google Agenda

## O que está acontecendo

Ao clicar em "Conectar minha conta Google", a janelinha que abre é bloqueada pelo navegador (ERR_BLOCKED_BY_RESPONSE). Isso tem duas causas possíveis, e o plano cobre as duas:

1. **Configuração no Google Cloud Console** — a URL de retorno ainda não foi cadastrada no aplicativo OAuth do Google.
2. **Bloqueio da janelinha (pop-up)** — alguns navegadores/extensões bloqueiam a abertura da página do Google dentro da janela secundária. Como alternativa, o app passa a abrir a autorização do Google na própria aba, sem depender de pop-up.

## Passo 1 — Configuração manual no Google Cloud Console (feita por você)

A URL `https://connector-gateway.lovable.dev/api/v1/app-users/oauth2/callback` deve ser cadastrada no Google, não no app:

1. Acesse https://console.cloud.google.com/apis/credentials
2. Abra o **Cliente OAuth 2.0** criado para este conector (o mesmo cujo ID/segredo foram usados na configuração do conector no Lovable).
3. Em **URIs de redirecionamento autorizados**, adicione:
   `https://connector-gateway.lovable.dev/api/v1/app-users/oauth2/callback`
4. Salve.
5. Verifique também em **Tela de permissão OAuth** (consent screen):
   - App em modo "Em produção" (ou, se em teste, o e-mail do usuário da jmurara adicionado como usuário de teste).
   - Escopo `https://www.googleapis.com/auth/calendar` (ou `calendar.events`) incluído.

## Passo 2 — Ajuste no app (feito por mim)

Em `src/pages/agenda-pessoal/google-agenda/index.tsx`:

- Trocar o fluxo de pop-up por **redirecionamento na mesma aba**: ao clicar em "Conectar", o app navega direto para a URL de autorização do Google (sem `window.open`), eliminando o ERR_BLOCKED_BY_RESPONSE.
- O Google devolve o usuário para a rota de retorno já existente (`/oauth/google-calendar/return`), que conclui a conexão e redireciona de volta para `/agenda-pessoal/google-agenda` com aviso de sucesso/erro.
- Manter o pop-up como não é mais necessário; o fluxo fica mais simples e funciona em qualquer navegador.

## Verificação

- Após o cadastro da URL no Google Cloud Console e o ajuste no app, testar o botão "Conectar minha conta Google" com um usuário da jmurara: a tela de autorização do Google deve abrir normalmente e, ao autorizar, a página deve voltar mostrando "Conectado".
