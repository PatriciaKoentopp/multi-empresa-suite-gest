# Corrigir erro ao cadastrar a empresa Motor Place

## Causa encontrada
O sistema recusou o cadastro com a mensagem "valor muito longo". O campo **Estado** foi preenchido com "Santa Catarina", mas o sistema só aceita a sigla de 2 letras ("SC"). A empresa não foi gravada.

As duas mensagens apareceram porque a tela mostra "Empresa cadastrada" antes de saber se o cadastro deu certo.

## Correção (só na tela de cadastro da empresa)
1. **Campo Estado:** limitar a 2 letras maiúsculas e avisar "Informe a sigla do estado (ex.: SC)" se tiver mais que isso. O aviso aparece antes de salvar.
2. **Proteção extra no salvar:** se vier o nome completo de um estado (ex.: "Santa Catarina"), converter para a sigla.
3. **Mensagens:** mostrar "Empresa cadastrada" somente depois que o cadastro der certo. Em caso de erro, mostrar só a mensagem de erro, com o motivo.

Visual da tela sem alterações. Depois, o Ivo cadastra de novo usando "SC".

## Técnico
- `empresas.estado` é `varchar(2)`.
- Em `src/pages/empresas/index.tsx` e `company-modal.tsx`: validação zod `length(2)` + `maxLength={2}` + maiúsculas; mapa nome→UF na hora de montar o objeto.
- `createCompany`/`updateCompany` no contexto passam a retornar `true` ou `false` (sucesso ou erro) e repassam a mensagem do erro. As páginas aguardam esse retorno antes de mostrar a mensagem.
