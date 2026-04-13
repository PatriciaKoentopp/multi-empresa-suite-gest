

## Plano: Relatório de Razão Contábil na página de Relatórios

### Objetivo
Criar uma nova página de relatório "Razão Contábil" acessível via `/relatorios/razao-contabil`, que exibe os lançamentos contábeis agrupados por conta e ordenados por data, no formato de razão auxiliar da contabilidade. Incluir filtros de data e conta, com opção de gerar todas as contas.

### Arquivos a criar/modificar

| Arquivo | Ação |
|---------|------|
| `src/pages/relatorios/razao-contabil/index.tsx` | Criar — página do relatório |
| `src/pages/relatorios/index.tsx` | Modificar — adicionar card do novo relatório |
| `src/App.tsx` | Modificar — adicionar rota `/relatorios/razao-contabil` |

### Estrutura da página `razao-contabil/index.tsx`

**Filtros:**
- Período: Mês Atual / Mês Anterior / Personalizado (com campos Data Inicial e Data Final no formato DD/MM/AAAA)
- Conta Contábil: Select com "Todas as Contas" + lista de contas ativas do plano de contas
- Botão "Gerar PDF"
- Botão voltar para `/relatorios`

**Exibição dos dados:**
- Reutiliza o hook `useLancamentosContabeis` para buscar os lançamentos e plano de contas
- Agrupa os lançamentos por conta contábil (código + descrição)
- Dentro de cada conta, ordena por data de lançamento (ascendente)
- Para cada conta, exibe:
  - Cabeçalho com código e nome da conta
  - Tabela com colunas: Data | Histórico | Débito | Crédito | Saldo
  - Saldo acumulado por conta (débitos somam, créditos subtraem, considerando o tipo da conta)
  - Totalizador ao final de cada conta
- Quando "Todas as Contas" selecionado, exibe todas as contas que possuem lançamentos no período, uma após a outra

**Layout:**
- Segue o padrão visual das outras páginas de relatório (header com botão voltar, Card com filtros, tabelas)
- Cores de botões e ícones seguindo o padrão do projeto (azul para ações principais)

### Alterações em `relatorios/index.tsx`
- Adicionar novo card "Razão Contábil" com ícone `BookOpen` e cor teal
- Incluir na lista de cards ativos (sem `opacity-60`)

### Alterações em `App.tsx`
- Importar o componente `RazaoContabil`
- Adicionar rota protegida `/relatorios/razao-contabil`

### Detalhes técnicos
- O hook `useLancamentosContabeis` já carrega todos os lançamentos com `conta`, `conta_nome`, `conta_codigo`, `tipo` (debito/credito), `valor`, `saldo` e `data`
- A lógica de agrupamento e ordenação será feita com `useMemo` no componente
- Para o cálculo de saldo por conta no relatório, será recalculado localmente considerando apenas os lançamentos filtrados por período

