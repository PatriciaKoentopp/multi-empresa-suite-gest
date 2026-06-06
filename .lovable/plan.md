## Contexto
O modal `ProjetoFormModal` serve tanto para criar quanto para editar projetos no módulo Relógio. Atualmente a tabela `relogio_projetos` não possui campos de data de etapas do projeto.

## Objetivo
Incluir 5 novos campos de data no modal de projeto, sem considerar timezone.

## Campos a adicionar
1. **Data Fotos** — `data_fotos`
2. **Data Prévia** — `data_previa`
3. **Data Seleção** — `data_selecao`
4. **Data Prazo** — `data_prazo`
5. **Data Entrega** — `data_entrega`

## Passos

### 1. Migração de banco
Adicionar à tabela `relogio_projetos` as colunas:
- `data_fotos date`
- `data_previa date`
- `data_selecao date`
- `data_prazo date`
- `data_entrega date`

Todas nullable (projeto pode não ter todas as datas definidas ainda).
Incluir GRANTs e RLS policy padrão.

### 2. Tipagem TypeScript
- Atualizar `RelogioProjeto` em `src/types/relogio.d.ts` com os 5 campos (`string | null`).
- Atualizar `ProjetoPayload` em `src/hooks/useProjetosRelogio.ts` com os 5 campos (`string | null`, usando `dateToISOString`).

### 3. Modal de projeto (`ProjetoFormModal.tsx`)
- Adicionar 5 estados de data (`Date | undefined`).
- Usar o componente `DateInput` existente para renderizar cada campo (sem timezone, formato DD/MM/YYYY).
- Layout: grid de 3 colunas para as datas (igual ao padrão de Fotos Tiradas/Enviadas/Vendidas), com duas linhas (3 + 2).
- Ao preencher `onSubmit`, converter as datas para `YYYY-MM-DD` via `dateToISOString` antes de enviar ao Supabase.
- Na inicialização do modal (useEffect quando abre para edição), popular os estados a partir de `parseDateString(projeto.data_fotos)` etc.

### 4. CSV export (listagem de projetos)
- Atualizar `handleExportar` em `src/pages/relogio/projetos/index.tsx` para incluir as 5 colunas de data (após adição, se solicitado futuramente — fora do escopo desta tarefa).

## Notas técnicas
- Todas as datas serão do tipo `date` no Postgres e exibidas no formato DD/MM/YYYY.
- Conversão: `parseDateString` para entrada, `dateToISOString` para envio ao banco.
- O modal é compartilhado entre criação e edição, então os campos estarão disponíveis em ambos.