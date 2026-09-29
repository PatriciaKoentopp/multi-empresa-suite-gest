# Google Agenda na Agenda Pessoal (por usuário)

Sim, a ideia está certa, com uma diferença em relação ao WhatsApp. No WhatsApp o administrador liga um número para cada empresa. Aqui **cada usuário liga a própria conta Google**, então a tela de implantação é pessoal: cada um entra nela e clica em "Conectar minha conta Google".

## Passo único do administrador (antes de tudo)
Cadastrar uma vez o acesso do Google (um "cliente OAuth" criado no Google Cloud) nas configurações de conectores da área de trabalho do Lovable. Depois, eu ligo esse acesso ao projeto. Isso vale para todos os usuários de todas as empresas, incluindo a jmurara. Nenhum usuário precisa fazer essa parte.

## Nova página: Agenda Pessoal > Implantação Google Agenda
- Mostra se a conta Google do usuário está conectada, e com qual e-mail.
- Botões **Conectar minha conta Google**, **Reconectar** e **Desconectar**.
- Escolha da agenda do Google usada na sincronização (padrão: a agenda principal).
- Botão **Sincronizar agora** e data/hora da última sincronização (DD/MM/AAAA HH:MM).
- Segue o padrão visual da página Implantação WhatsApp e as cores de botões e ícones de Favoritos.

## Sincronização nos dois sentidos
- **Do app para o Google:** ao criar, editar, concluir ou excluir uma tarefa pessoal, o evento correspondente é criado, atualizado ou removido no Google. Tarefas sem horário viram eventos de dia inteiro.
- **Do Google para o app:** ao abrir a Agenda Pessoal (e em "Sincronizar agora"), os eventos do Google do mês aparecem como tarefas pessoais. Chegam como "Circunstancial", sem papel, e podem ser reclassificados. Alterações e exclusões feitas no Google também são trazidas.
- Tudo continua privado: cada usuário vê só a própria agenda.

## Detalhes técnicos
- Conector de usuário `google_calendar` (escopos `calendar.events`, `calendar.readonly` e `userinfo.email`), com a janela de consentimento aberta em popup e retorno em `/oauth/google-calendar/return`.
- Nova tabela `app_user_connections` (acessível só pelo servidor), com a chave de conexão criptografada por usuário.
- Nova tabela `agenda_google_config` (user_id, calendar_id, email, ultima_sync, sync_token), com RLS por `auth.uid()`.
- `agenda_tarefas` ganha as colunas `google_event_id` e `google_updated_at` para ligar cada tarefa ao seu evento e evitar duplicatas.
- Server functions em `src/lib/google-agenda.functions.ts` com `requireSupabaseAuth`: iniciar e concluir a conexão, status, desconectar, listar agendas, sincronizar, e enviar/remover evento. O hook `useAgendaTarefas` chama o envio após salvar ou excluir.
- Nova rota `src/routes/agenda-pessoal/google-agenda.tsx` e item no menu Agenda Pessoal.
