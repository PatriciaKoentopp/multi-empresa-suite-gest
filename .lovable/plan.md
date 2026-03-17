

## Plano: Incluir Logs de Autenticação (Login/Logout)

### Problema
O relatório de logs do sistema não registra eventos de autenticação (login e logout dos usuários).

### Solução
Registrar logs de login e logout diretamente no `auth-context.tsx`, inserindo na tabela `logs_transacoes` após login/logout bem-sucedido.

**Nota:** Não podemos usar o hook `useLogTransacao` dentro do `auth-context` porque ele depende de `useCompany` e `useAuth` (dependência circular). Usaremos inserção direta via Supabase.

### Arquivos a alterar

| Arquivo | Alteração |
|---------|-----------|
| `src/contexts/auth-context.tsx` | Inserir log após login e logout bem-sucedidos |

### Detalhes

Na função `login`, após sucesso e `fetchUserData`, inserir log com:
- acao: `login`
- modulo: `autenticacao`
- entidade: `usuario`
- descricao: `Login realizado: {email}`

Na função `logout`, antes do redirect, inserir log com:
- acao: `logout`
- modulo: `autenticacao`
- entidade: `usuario`
- descricao: `Logout realizado: {email}`

Para o logout, precisamos capturar os dados do usuário antes de limpar o estado, e buscar o `empresa_id` do `userData` antes de limpar.

