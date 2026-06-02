## Importar Apontamentos de Horas

Adicionar rotina de importação de planilha Excel/CSV na página **Apontamento** (`/relogio/apontamento`), seguindo o mesmo padrão já usado em `ImportarProjetosModal.tsx`.

### Formato esperado da planilha

Colunas (conforme `horas20261.xlsx`):
- `Projeto` — formato `codigo - nome (vend) [env] {tir}` (mesmo parser já existente)
- `Tarefa` — nome da tarefa (pode ficar vazio)
- `Data de início` — data (sem timezone, formato DD/MM/YYYY na UI)
- `Hora de início` — HH:MM:SS
- `Data final` — usada apenas para validação
- `Hora de término` — HH:MM:SS
- `Duração (decimal)` — ignorada; recalculada a partir do início/fim

### Regras de mapeamento

1. **Projeto**: extrair `codigo` via parser existente e localizar por `codigo` (+ `empresa_id`) na tabela `relogio_projetos`. Se não encontrado → linha inválida.
2. **Tarefa**:
   - Aliases: `Sessão de Fotos` → `Sessão`; `Produção de Fotos` → `Produção`.
   - Buscar tarefa por nome (case/acentos-insensível) dentro do `tipo_projeto_id` do projeto resolvido na tabela `relogio_tarefas`.
   - Vazio ou não encontrada → `tarefa_id = null` (apontamento permitido sem tarefa, com aviso amarelo no preview se nome veio preenchido mas não casou).
3. **Data**: usar `Data de início` como string `YYYY-MM-DD` (sem timezone, padrão já adotado no projeto).
4. **Horas**: normalizar para `HH:MM:SS`. `hora_fim` obrigatória.
5. **Duração decimal**: calculada via `calcularDuracaoDecimal` já existente em `useApontamentosRelogio`.
6. **Origem**: gravar como `manual` (planilha importada).
7. **Status**: `concluido`.
8. Validações de linha: projeto encontrado, hora início < hora fim, datas válidas. Linhas inválidas exibidas em vermelho e desmarcadas da importação.

### Arquivos

**Novo:** `src/components/relogio/ImportarApontamentosModal.tsx`
- Mesma estrutura visual do `ImportarProjetosModal` (Dialog 1000px, ScrollArea com tabela de preview, contadores de válidas/com problema/aviso, botão azul "Importar N apontamento(s)").
- Lê `.xlsx/.xls/.csv` via `XLSX`.
- Recebe `projetos` e `tarefas` por props para resolver IDs.
- Aplica aliases "Sessão de Fotos"/"Produção de Fotos".
- Chama `onImport(items)` retornando `{ inserted, errors }`.

**Editado:** `src/hooks/useApontamentosRelogio.ts`
- Nova função `importarApontamentos(items: ApontamentoPayload[])` que insere em lote via `supabase.from('relogio_apontamentos').insert([...])` em chunks de 50 (regra do projeto para `in()`, aplico mesma cautela ao insert).
- Retorna `{ inserted, errors }`.

**Editado:** `src/pages/relogio/apontamento/index.tsx`
- Botão "Importar" (variant `outline`, ícone `Upload`) ao lado dos botões Manual/Cronômetro, no mesmo padrão da página de Projetos.
- Carrega lista de tarefas via hook existente `useTarefasRelogio` (ou similar) e projetos via `useProjetosRelogio`.
- Abre o novo modal.

### Pontos técnicos

- Datas tratadas como strings `YYYY-MM-DD` extraídas diretamente do objeto Excel (sem `new Date()` para evitar timezone).
- Horas formatadas com `pad` de 2 dígitos, suportando entrada `HH:MM` ou `HH:MM:SS`.
- Sem alteração de schema; reutiliza tabela `relogio_apontamentos` existente.
- Mantém padrão de cores e ícones igual ao da página Favoritos / demais importações.

Nenhuma migração de banco necessária.
