# Corrigir a conexão do Google Agenda

## Causa

O cliente OAuth criado no Google é do tipo **"Computador"** (aparece "ID do cliente para Computador" na tela). Esse tipo não tem o campo de URL de retorno e não funciona para aplicativos na web — por isso o Google bloqueia a janela de autorização.

## Passo 1 — Criar um novo cliente no Google (feito por você)

1. Acesse https://console.cloud.google.com/apis/credentials
2. Clique em **Criar credenciais > ID do cliente OAuth**.
3. Em **Tipo de aplicativo**, escolha **Aplicativo da Web** (não "Computador").
4. Nome: por exemplo "Lovable ERP Web".
5. Em **URIs de redirecionamento autorizados**, clique em **Adicionar URI** e cole:
   `https://connector-gateway.lovable.dev/api/v1/app-users/oauth2/callback`
6. Clique em **Criar** e copie o **ID do cliente** e a **Chave secreta** exibidos.
7. Em **Tela de permissão OAuth**: se o app estiver "Em teste", adicione o e-mail dos usuários da jmurara em **Usuários de teste**; confirme que a **Google Calendar API** está ativada em "APIs e serviços > Biblioteca".
8. O cliente antigo do tipo "Computador" pode ser excluído.

## Passo 2 — Atualizar o acesso no Lovable (feito por você, com minha ajuda)

- Nas configurações da área de trabalho, em **Conectores de usuário do app > Google Calendar**, editar o cliente existente e trocar o ID do cliente e a chave secreta pelos novos.
- Confirmar que a opção de **acesso offline** está ligada (necessária para a sincronização continuar funcionando).
- Se preferir, eu abro a janela de conexão novamente para você escolher o cliente atualizado.

## Passo 3 — Testar

- Em Agenda Pessoal > Implantação Google Agenda, clicar em **Conectar minha conta Google**. A tela de autorização do Google deve abrir normalmente e, ao autorizar, a página mostra "Conectado".
- Se ainda aparecer bloqueio, eu analiso a mensagem exata e ajusto o app. Nenhuma alteração no app é necessária por enquanto.
