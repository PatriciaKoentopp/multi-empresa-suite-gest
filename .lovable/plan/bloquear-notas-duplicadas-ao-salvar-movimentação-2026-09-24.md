# Bloquear notas duplicadas ao salvar movimentação

## O que muda para o usuário
Ao clicar em Salvar, antes de gravar, o sistema verifica se já existe na empresa outra movimentação com o **mesmo número do documento, a mesma data de emissão e o mesmo favorecido**. Se existir, a gravação é bloqueada e aparece a mensagem:

"Documento já cadastrado — já existe uma movimentação com o número X, emitida em DD/MM/AAAA, para este favorecido."

Regras:
- Vale para inclusão e edição (na edição, a própria movimentação é ignorada na comparação).
- Só verifica quando o número do documento está preenchido (movimentações sem número continuam livres).
- Não se aplica a transferências (não têm favorecido).
- A comparação do número ignora espaços no início e no fim.

Nenhuma outra função ou parte da tela muda.

## Detalhes técnicos
- `src/hooks/useMovimentacaoForm.ts`, em `handleSalvar`, logo após a verificação de período fechado: consulta `movimentacoes` filtrando `empresa_id`, `favorecido_id`, `data_emissao` (formato YYYY-MM-DD) e `numero_documento` (valor com trim), com `.neq('id', movimentacaoEditando.id)` quando for edição, `limit(1)`. Se houver resultado, `toast.error` e `return` sem gravar.
