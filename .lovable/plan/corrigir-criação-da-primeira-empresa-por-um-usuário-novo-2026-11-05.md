# Corrigir criação da primeira empresa por um usuário novo

## Causa encontrada
- O usuário ivo@motorplace.com.br existe, mas está **sem empresa vinculada**.
- A empresa "Motor Place Administradora de Bens Ltda" **não foi gravada** no banco.
- As regras de acesso só permitem cadastrar/ver uma empresa cujo ID seja a empresa do próprio usuário. Como o usuário novo ainda não tem empresa, o cadastro é recusado (e nada aparece após salvar).
- Mesmo que fosse gravada, o usuário não seria ligado a ela automaticamente.

## Correção
1. Criar uma função segura no banco `criar_empresa_inicial(dados)` que:
   - só funciona se o usuário logado ainda **não** tem empresa;
   - grava a empresa e vincula o usuário a ela como Administrador;
   - devolve a empresa criada.
2. Em `createCompany` (contexto de empresa), quando o usuário não tem empresa, chamar essa função em vez do cadastro direto; depois recarregar a empresa atual para os dados aparecerem.
3. Usuários que já têm empresa continuam com o fluxo atual (sem mudança de layout).

Depois, o Ivo deve cadastrar a empresa novamente.

## Técnico
- Função `SECURITY DEFINER`, `search_path = public`, checa `auth.uid()` e `usuarios.empresa_id IS NULL`; `GRANT EXECUTE ... TO authenticated`.
- Regras atuais de `empresas`/`usuarios` não são alteradas.
