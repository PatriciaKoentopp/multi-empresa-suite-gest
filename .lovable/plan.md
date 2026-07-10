Tornar a tarefa obrigatória ao criar/editar apontamentos e ao iniciar o cronômetro na página /relogio/apontamento.

Alterações:
1. **ApontamentoManualModal** (`src/components/relogio/ApontamentoManualModal.tsx`)
   - Adicionar validação `if (!tarefaId) return toast.error("Selecione uma tarefa")` no `handleSave`.
   - Marcar visualmente o campo "Tarefa" como obrigatório (`Tarefa *`).
   - Desabilitar o botão "Salvar" enquanto a tarefa não for selecionada.

2. **ApontamentoCronometroModal** (`src/components/relogio/ApontamentoCronometroModal.tsx`)
   - Adicionar validação `if (!tarefaId) return toast.error("Selecione uma tarefa")` no `handleStart`.
   - Marcar visualmente o campo "Tarefa" como obrigatório (`Tarefa *`).
   - Desabilitar o botão "Iniciar" enquanto a tarefa não for selecionada.

3. **UX complementar**
   - Se o projeto selecionado não possuir tarefas ativas, exibir no Select de tarefa uma mensagem informativa e manter o botão desabilitado.
   - Manter o comportamento existente de limpar a tarefa ao trocar de projeto.

Não serão alterados: importação em massa, hook `useApontamentosRelogio`, schema do banco ou apontamentos já existentes sem tarefa.