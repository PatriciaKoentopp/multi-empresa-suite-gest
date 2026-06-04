
## Revisão da rotina /backup

### Situação atual

`src/hooks/useBackup.ts` exporta 29 abas. Comparando com as 44 tabelas reais do schema `public`, faltam **15 tabelas**.

### Tabelas faltantes e classificação

**Dados de negócio — incluir no backup (11):**

| Tabela | Filtragem |
|---|---|
| `fechamentos_mensais` | `empresa_id` direto |
| `impostos_retidos` | `empresa_id` direto |
| `movimentacoes_impostos_retidos` | via `movimentacao_id` da empresa |
| `movimentacoes_parcelas_antecipacoes` | via `movimentacao_parcela_id` → parcela → movimentação da empresa |
| `numeracao_orcamentos` | `empresa_id` direto |
| `tabelas_precos` | `empresa_id` direto |
| `tabelas_precos_itens` | via `tabela_id` das tabelas de preço da empresa |
| `relogio_tipos_projeto` | `empresa_id` direto |
| `relogio_tarefas` | via `tipo_projeto_id` dos tipos da empresa |
| `relogio_projetos` | `empresa_id` direto |
| `relogio_apontamentos` | `empresa_id` direto |

**Não incluir (4) — operacionais/sistema:**

- `usuarios` — dados sensíveis de autenticação.
- `logs_transacoes` — log de auditoria; volume alto e sem valor para restauração.
- `spreadsheet_data` / `upload_files` — anexos/planilhas brutas vinculadas a uploads, fora do escopo de backup tabular.

(Caso queira incluir alguma destas, basta sinalizar e eu acrescento.)

### Alterações

1. **`src/hooks/useBackup.ts`**
   - Adicionar as 11 entradas em `backupTables` (com `name`/`description` em PT-BR), agrupadas por afinidade (fechamentos/impostos junto de movimentações; numeração junto de orçamentos; tabelas de preço logo após serviços; o bloco de Relógio ao final).
   - Adicionar `case` no `fetchTableData` para as tabelas que dependem de IDs intermediários:
     - `movimentacoes_impostos_retidos` → via `movimentacoes.id`.
     - `movimentacoes_parcelas_antecipacoes` → via `movimentacoes_parcelas.id` (que já é resolvida por `movimentacoes` da empresa).
     - `tabelas_precos_itens` → via `tabelas_precos.id`.
     - `relogio_tarefas` → via `relogio_tipos_projeto.id`.
   - As demais (`empresa_id` direto) caem no `default` existente, sem código novo.
   - Aplicar batching de 50 IDs nos filtros `in()` (já é padrão do projeto) onde a lista de IDs pode crescer (`movimentacoes_impostos_retidos`, `movimentacoes_parcelas_antecipacoes`, `tabelas_precos_itens`).

2. **Colunas de data extras** a serem reconhecidas pelo formatador `DD/MM/YYYY` (acrescentar ao array `dateColumns`):
   - `data_fechamento`, `mes_referencia` permanece texto, `hora_inicio`/`hora_fim` (HH:MM:SS — manter como texto).
   - `duracao_decimal` é numérica — não precisa.

3. **`src/pages/backup/index.tsx`** — sem mudanças estruturais; o grid de seleção lê de `backupTables`, portanto as novas tabelas aparecem automaticamente. Verificar apenas se há agrupamento visual por categoria; caso exista, encaixar as novas no grupo certo.

### Critérios de aceite

- Tela `/backup` lista as 11 novas tabelas, selecionáveis individualmente e via "Selecionar todas".
- Geração do `.xlsx` cria uma aba por tabela selecionada, com dados restritos à empresa atual.
- Datas continuam formatadas `DD/MM/YYYY`; valores monetários em pt-BR.
- Nenhuma alteração em layout, cores ou no fluxo de geração existente.
