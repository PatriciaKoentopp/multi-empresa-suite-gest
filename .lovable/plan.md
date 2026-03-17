

## Plano: Logs de Transações

### O que será feito

1. **Criar tabela `logs_transacoes`** no Supabase para registrar automaticamente as ações realizadas no sistema
2. **Adicionar card "Logs do Sistema"** na página `/relatorios`
3. **Criar página `/relatorios/logs`** com listagem, filtros e busca dos logs
4. **Registrar route no App.tsx**
5. **Adicionar configuração do card** no `useDashboardCards`

### Tabela `logs_transacoes`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid PK | |
| empresa_id | uuid NOT NULL | |
| usuario_id | uuid | Quem executou |
| usuario_nome | text | Nome do usuário (snapshot) |
| acao | varchar | criar, editar, excluir, baixar, desfazer, efetivar, etc. |
| modulo | varchar | financeiro, vendas, cadastros, crm, etc. |
| entidade | varchar | movimentacao, orcamento, favorecido, lead, etc. |
| entidade_id | uuid | ID do registro afetado |
| descricao | text | Descrição legível da ação |
| dados_anteriores | jsonb | Dados antes da alteração (opcional) |
| dados_novos | jsonb | Dados após a alteração (opcional) |
| created_at | timestamptz | Data/hora do log |

RLS: empresa_id = get_user_company_id() (SELECT only para segurança, INSERT liberado para a empresa).

### Página `/relatorios/logs`

- Filtros: período (data início/fim), módulo, ação, busca por descrição
- Tabela com colunas: Data/Hora, Usuário, Módulo, Ação, Descrição
- Paginação
- Badge colorido por tipo de ação (criar=verde, excluir=vermelho, editar=azul, etc.)

### Arquivos a criar/alterar

| Arquivo | Ação |
|---------|------|
| Migration SQL | Criar tabela `logs_transacoes` + RLS |
| `src/pages/relatorios/logs/index.tsx` | Nova página de listagem de logs |
| `src/pages/relatorios/index.tsx` | Adicionar card "Logs do Sistema" |
| `src/App.tsx` | Adicionar rota `/relatorios/logs` |
| `src/hooks/useDashboardCards.ts` | Adicionar card `logs` na config de `relatorios` |

Nota: A inserção de logs nas operações existentes (baixas, efetivações, etc.) pode ser feita incrementalmente depois. Neste primeiro momento, criaremos a infraestrutura (tabela + página de visualização) e um hook `useLogTransacao` reutilizável para facilitar a integração futura.

