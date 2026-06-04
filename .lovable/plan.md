## Diagnóstico

A página `/relogio/apontamento` está lenta por estes motivos (cada um confirmado no código):

1. **Carrega TODOS os apontamentos da empresa** (`useApontamentosRelogio.fetchData`) em loop de 1000 em 1000, sem filtro de período. Hoje a base tem **2.374 registros** — todos vão para a memória do navegador toda vez que a página abre, e a cada mutação (criar/editar/excluir/parar cronômetro) o hook faz `refetch` completo.
2. **Cronômetro reseta `tick` a cada 1s** (`setTick`) no componente da página, fazendo a tabela inteira re-renderizar a cada segundo sempre que houver cronômetro ativo.
3. **Busca sem debounce** — cada tecla refaz o filtro sobre os 2.3k registros e re-renderiza todas as linhas (cada uma com `DropdownMenu` em Portal).
4. **Filtro de Projeto é um `Select` simples** com todos os 162 projetos — mesmo problema visto antes.
5. **`useTiposProjetoRelogio` carrega `relogio_tarefas` completas em lotes** só para exibir o nome da tarefa na coluna.
6. **Mutações fazem `refetch` da tabela inteira** (`criarApontamento`, `atualizarApontamento`, `excluirApontamento`, `pararCronometro`) — equivalente a recarregar a página a cada ação.

## Plano de otimização

### 1. Carregamento dos apontamentos
- Adicionar **filtro de período padrão** no `useApontamentosRelogio` (últimos 90 dias) com opção de "Todos" via UI. O filtro vai para o servidor (`gte('data', ...)`), não para o cliente.
- Sempre incluir o apontamento `em_andamento` (consulta `or` separada) para o card do cronômetro continuar funcionando independente do período.

### 2. Mutações sem refetch (atualização local)
- `criarApontamento`, `atualizarApontamento`, `excluirApontamento`, `pararCronometro`: usar `setApontamentos` localmente com o registro retornado pelo Supabase (`.select().single()`) em vez de `fetchData()`. Mesma abordagem que aplicamos em `useProjetosRelogio`.

### 3. Isolar o card do cronômetro
- Extrair `<CronometroCard>` em componente próprio que gerencia internamente o `tick`/`setInterval` e o cálculo de `tempoDecorrido`. Assim o `tick` deixa de re-renderizar a página inteira (e a tabela) a cada segundo.

### 4. Debounce e memoização da tabela
- `useDebouncedValue(searchTerm, 250)` (hook já existe) para o filtro.
- Criar `ApontamentoRow` envolvido em `React.memo`, recebendo strings já calculadas (`projTexto`, `tarefaNome`, `durHHMMSS`, `formatedDate`) e callbacks estáveis (`onEdit`, `onDelete`).

### 5. Filtro "Projeto" com Combobox
- Substituir o `Select` por `Popover + Command` (mesmo padrão usado em `/relogio/projetos`), renderizando apenas os itens visíveis e com busca embutida.

### 6. Query enxuta de tarefas
- Substituir o uso de `useTiposProjetoRelogio` na página por uma query leve `relogio_tarefas` (`id, nome`) via `useQuery`, suficiente para a coluna Tarefa e o `tarefaMap`. Os modais (Manual/Cronômetro/Importar) continuam recebendo `tiposProjeto`/`tarefas` carregados sob demanda quando abertos.

## Detalhes técnicos

- Arquivos a alterar:
  - `src/hooks/useApontamentosRelogio.ts` — filtro de período, retorno do registro nos mutates, update local.
  - `src/pages/relogio/apontamento/index.tsx` — debounce, Combobox, query leve, extração do cronômetro.
  - Novos: `src/components/relogio/CronometroCard.tsx`, `src/components/relogio/ApontamentoRow.tsx`.
- Layout, cores, ícones e fluxos não mudam (mantém padrão da página Favorecidos).
- Os modais (`ApontamentoManualModal`, `ApontamentoCronometroModal`, `ImportarApontamentosModal`) continuam usando `useTiposProjetoRelogio` quando abertos — sem impacto no load inicial.

## Pergunta antes de implementar

O filtro de período padrão (últimos 90 dias) é o item de **maior impacto** — hoje você baixa 2.374 linhas a cada acesso. Posso aplicar com seletor "Últimos 90 dias / Últimos 12 meses / Este ano / Todos" (padrão 90 dias)? Se preferir manter o carregamento total, eu aplico só os itens 2–6 (que já trazem ganho grande, sem mexer no que aparece na tela).