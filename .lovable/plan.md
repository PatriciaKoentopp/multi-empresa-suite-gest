## Ajuste no parser de importação de Projetos

Atualizar o `ImportarProjetosModal.tsx` para interpretar a planilha no formato real do usuário, onde a coluna **Projeto** concentra código, nome e contadores de fotos.

### Formato esperado da planilha
3 colunas: `Projeto`, `Cliente`, `Status`.

A célula `Projeto` segue o padrão:
```
<codigo> - <nome> (vendidas) [enviadas] {tiradas}
```
- Antes do primeiro ` - ` → **Código**
- Depois do ` - ` (até o primeiro `(`, `[` ou `{`) → **Nome**
- `(N)` → **Fotos Vendidas**
- `[N]` → **Fotos Enviadas**
- `{N}` → **Fotos Tiradas**
- Qualquer grupo ausente → 0 (em branco)

### Regras de parsing
- Regex para extrair: `^\s*([^\s-][^-]*?)\s*-\s*(.*)$` separa código e o restante.
- Sobre o restante, aplicar: `/\((\d+)\)/`, `/\[(\d+)\]/`, `/\{(\d+)\}/` para vendidas, enviadas e tiradas.
- Nome = restante após remover os três grupos `()`, `[]`, `{}`, com trim.
- Status: "Ativo" → `ativo`; "Arquivado"/"Inativo" → `arquivado`; vazio → `ativo`.

### Cliente
- Coluna `Cliente` lida da planilha (não mais embutida no nome, conforme imagem real).
- Match por nome normalizado contra `favorecidos`.
- Se vazio ou não encontrado: deixar `favorecido_id = null` e marcar para resolução manual (sem bloquear linha como inválida — projetos sem cliente são permitidos, como `0 - Administrativo`).

### Validação de linha
- **Válida** se houver código e nome.
- Cliente é **opcional**: se vazio, importa sem favorecido; se preenchido mas não encontrado, mostrar aviso e permitir importar em branco (informar manualmente depois).

### Mudança no banco
- `relogio_projetos.favorecido_id` precisa virar **NULL permitido** (hoje é `NOT NULL`). Migration para alterar a coluna.

### Preview do modal
- Adicionar colunas mostrando os valores extraídos: Código, Nome, Cliente (com status do match: ✓ encontrado / ⚠ não encontrado / — vazio), Tiradas, Enviadas, Vendidas, Status.
- Linhas com cliente preenchido mas não encontrado: destaque amarelo, ainda importáveis.
- Linhas sem código ou nome: destaque vermelho, não importáveis.

### Arquivos afetados
- `src/components/relogio/ImportarProjetosModal.tsx` — novo parser e preview.
- `src/hooks/useProjetosRelogio.ts` — `ProjetoPayload.favorecido_id` passa a aceitar `string | null`.
- `src/components/relogio/ProjetoFormModal.tsx` — permitir cliente vazio.
- `src/pages/relogio/projetos/index.tsx` — coluna Cliente exibe "—" quando vazio.
- `src/types/relogio.d.ts` — `favorecido_id: string | null`.
- Nova migration: `ALTER TABLE relogio_projetos ALTER COLUMN favorecido_id DROP NOT NULL`.
