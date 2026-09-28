# Abrir o lead do Ivo Koentopp Júnior e corrigir casos parecidos

## O que foi encontrado
- A mensagem "teste 125" chegou às 19:09, antes da nova regra estar no site publicado. Por isso ela ficou ligada ao lead antigo do Ivo, que está **inativo**, e esse lead não aparece em /crm/leads (a página mostra os ativos).

## O que será feito
1. **Corrigir os contatos que já estão nessa situação:** para cada contato do WhatsApp que está no CRM mas ligado a um lead fechado ou inativo, e que tem mensagem recebida depois que o lead foi encerrado:
   - abrir um lead novo na primeira etapa do funil, com Origem "WhatsApp" e o mesmo nome, telefone e favorecido do lead anterior;
   - ligar a conversa a esse lead novo;
   - registrar nas Interações do lead novo as mensagens recebidas depois que o lead anterior foi encerrado (ex.: "Recebida: teste 125").
   O Ivo entra nessa correção.
2. **Daqui para frente:** a regra já está pronta. Ela passa a valer no site no ar assim que ele for publicado de novo (as mensagens do WhatsApp chegam sempre pelo site publicado).

## Detalhes técnicos
- Correção de dados (run_sql) em `leads`, `whatsapp_contatos` e `leads_interacoes`: selecionar contatos `status='crm'` cujo lead tem `status <> 'ativo'` e com mensagem de entrada com `created_at > leads.updated_at`; inserir o lead usando a etapa do `whatsapp_numeros` (ou o primeiro funil ativo / primeira etapa pela ordem), `origem_id` = origem "WhatsApp" da empresa; atualizar `lead_id`; inserir as interações (tipo 'whatsapp', data em horário de SP, status 'Realizado').
- Nenhuma mudança de código ou de layout.
