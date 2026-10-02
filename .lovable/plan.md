# Reunião do CRM na Agenda Pessoal (e no Google Agenda)

## O que muda para você
Em **CRM > Leads > aba Interações**, ao escolher o tipo **Reunião**:
- Aparecem dois campos extras: **Hora início** e **Hora fim** (opcionais; sem horário, a reunião entra como compromisso do dia inteiro).
- Ao clicar em registrar, a interação é gravada como hoje **e** é criada uma tarefa na **Agenda Pessoal** do usuário logado, com:
  - Título: "Reunião - {nome do lead}"
  - Data e horários informados
  - Descrição da interação
  - Tríade "Importante", sem papel (pode ser reclassificada depois)
- Se a conta Google estiver conectada, a tarefa é enviada automaticamente ao **Google Agenda**, igual às demais tarefas pessoais.
- Os demais tipos de interação continuam funcionando exatamente como hoje.

## Observações
- A reunião vai para a agenda de **quem está logado** (a agenda pessoal é privada de cada usuário), mesmo que o responsável escolhido seja outra pessoa.
- Editar ou excluir a interação depois **não** altera a tarefa da agenda; ajustes são feitos na própria Agenda Pessoal.
- Se o Google não estiver conectado ou falhar, a interação e a tarefa são gravadas mesmo assim, com um aviso.

## Detalhes técnicos
- `NovaInteracaoForm.tsx`: inputs `type="time"` `horaInicio`/`horaFim` exibidos só quando `tipo === "reuniao"`; estado `novaInteracao` ganha os dois campos (lead-form-modal.tsx).
- `lead-form-modal.tsx` (`adicionarInteracao`): após inserir em `leads_interacoes`, se reunião, inserir em `agenda_tarefas` (`user_id` = auth user, `data` no formato YYYY-MM-DD sem timezone, `hora_inicio`/`hora_fim`, `duracao_min` calculada, `triade: "importante"`, `status: "pendente"`) e chamar a server fn `enviarTarefaGoogle` existente, ignorando erro de "não conectado".
- Sem alterações de banco.
