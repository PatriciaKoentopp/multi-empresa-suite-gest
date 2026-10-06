# Concluir a implantação do webhook Meta (Instagram/Facebook)

## Situação atual (verificada agora)
- O endereço `https://multi-empresa-suite-gest.lovable.app/api/public/meta/webhook` **já está no ar na versão publicada** e responde corretamente (403 quando o token de verificação não confere — comportamento esperado).
- Os segredos `META_VERIFY_TOKEN` e `META_APP_SECRET` **já estão salvos** no projeto.
- Nenhuma alteração de código é necessária. Os próximos passos são de configuração no painel da Meta e no app.

## Passos (execução)

### 1. Validar o webhook na Meta
Em **Meta for Developers → seu app → Webhooks** (objeto *Page* e/ou *Instagram*):
- **URL de callback:** `https://multi-empresa-suite-gest.lovable.app/api/public/meta/webhook`
- **Verificar token:** exatamente o valor salvo em `META_VERIFY_TOKEN` (idêntico, sem espaços, maiúsculas/minúsculas contam).
- Clique em **Verificar e salvar**.
- Se o token exato não for conhecido, eu abro o formulário seguro para você salvar um novo valor em `META_VERIFY_TOKEN` e você cola o mesmo valor na Meta.

### 2. Assinar os campos do webhook
No mesmo painel da Meta, assinar os campos:
- `messages`
- `messaging_postbacks`

### 3. Token da página (META_PAGE_TOKEN)
- Em **Meta for Developers → Messenger/Instagram → Access Tokens**, gerar o **token de acesso da página** (de longa duração).
- Salvar no projeto pelo formulário seguro (nome `META_PAGE_TOKEN`, ou `META_PAGE_TOKEN_2`, `_3`... para cada conta/página adicional).

### 4. Cadastrar a conta no app
- No CRM → **Implantação Instagram/Facebook**, cadastrar a conta: canal (Instagram ou Facebook), **ID da Página**, credencial (`META_PAGE_TOKEN`), **funil** e **etapa inicial**.

### 5. Teste ponta a ponta
- Enviar uma mensagem real pelo Instagram/Facebook para a página.
- Conferir se o lead é criado (ou a mensagem entra no lead aberto), com interação registrada e conversa visível na aba Meta do lead.

## Observações
- A janela de resposta gratuita da Meta é de 24h após a última mensagem do cliente.
- Contas adicionais repetem os passos 3 e 4 (uma credencial por página).
- Pendente à parte: 21 avisos de segurança antigos do banco, sem relação com esta mudança — corrigir somente se você quiser.
