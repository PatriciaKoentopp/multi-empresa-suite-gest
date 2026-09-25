## Troca de senha no modal Editar Usuário

**Problema:** o campo de senha do modal é ignorado ao salvar — a senha digitada nunca é enviada para o sistema de login.

### O que muda para o usuário
- No modal **Editar Usuário**, os campos passam a ser **Nova senha (opcional)** e **Confirmar nova senha**.
- Se "Nova senha" ficar em branco, nada muda na senha.
- Se preenchida: mínimo 6 caracteres e a confirmação precisa ser igual; caso contrário aparece a mensagem "As senhas não conferem" e não grava.
- Ao gravar, a senha é realmente trocada e aparece "Senha alterada com sucesso".
- Somente administradores podem trocar a senha de outro usuário.
- Layout e demais campos permanecem iguais.

### Detalhes técnicos
- `src/components/usuarios/usuarios-form.tsx`: adicionar campo `confirmarSenha`; schema zod com `senha` opcional (vazio permitido, senão min 6) e `superRefine` exigindo igualdade; repassar `senha` no `onSubmit` (campo extra opcional).
- Nova edge function `alterar-senha-usuario` (`verify_jwt = false` no config.toml): valida JWT do chamador, confere na tabela `usuarios` que ele é `Administrador` (ou é o próprio usuário), valida `{ userId, senha }` com zod e chama `auth.admin.updateUserById(userId, { password })` com service role.
- `src/pages/admin/usuarios/index.tsx` em `handleSubmit` (edição): após atualizar `usuarios`, se houver senha, `supabase.functions.invoke('alterar-senha-usuario', ...)` e mostrar toast de sucesso/erro.
