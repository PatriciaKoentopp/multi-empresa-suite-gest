## Objetivo

Substituir a fonte de dados da página `/relatorios/fotos` da planilha `projetos.xlsx` (uploads em `useSpreadsheetData`) pelos dados já cadastrados no banco em `relogio_projetos` (campos `fotos_tiradas`, `fotos_enviadas`, `fotos_vendidas`, `nome`, `codigo`, `status`, `tipo_projeto_id`) e `relogio_apontamentos` (horas).

Esse é o mesmo padrão já usado em `/relatorios/projetos` através do hook `useRelatorioProjetosFotosDB`.

## Mudanças

### 1. `src/pages/relatorios/fotos/index.tsx`
- Remover: `useUploadFiles`, `useSpreadsheetData`, `useRelatorioFotos`, `UploadModal`, lista de "Planilhas Importadas", checkboxes de seleção, botão "Novo Upload", `AlertDialog` de exclusão de upload, estados `selectedUploads`, `consolidatedData`, `uploadToDelete`, `isModalOpen`, `deleteDialogOpen`.
- Passar a usar `useRelatorioProjetosFotosDB` (já existente).
- Calcular no próprio arquivo (com `useMemo`) as métricas que a página exibe a partir do array `projetosFotos`:
  - `totalHoras`, `totalProjetos`, `totalClientes`, `horasMediasPorProjeto`
  - `totalFotos` (somatórios + `tempoPorFotoVendida`, `percentualEnviadas`, `percentualVendidas`, `percentualVendidasTiradas`)
  - `projetosAgrupados` no formato esperado pelo `ProjetoAccordion`
- Manter exatamente a mesma UI restante: cards de métricas, gráfico "Resumo de Fotos", filtros (busca + % vendidas/tiradas mín/máx), `ProjetoAccordion` na lista "Visão por Projeto".
- Exibir skeleton enquanto `isLoading` do hook for true.

### 2. `src/components/relatorios/fotos/ProjetoAccordion.tsx`
- Manter o componente. Campos não presentes no banco (`membros`, `gerente`, `observacao`, lista `projetos[]` com nomes da planilha) serão preenchidos com valores vazios/array com o nome do projeto vindo do banco, mantendo o layout intacto.

### 3. Itens removidos da página (não existem no banco)
- Tabs "Ativos / Arquivados" (status vinha da planilha) — manter apenas a listagem única "Todos" para não inventar dados. Confirmar abaixo.
- Lista de "Planilhas Importadas" e fluxo de upload.

## Pontos a confirmar

1. As **tabs "Ativos / Arquivados"** devem ser removidas (o status "Ativo/Arquivado" vem da planilha e não existe no banco), ou devo mapear para o campo `status` de `relogio_projetos`?
2. Os hooks/componentes antigos (`useRelatorioFotos`, `UploadModal` de fotos, `useSpreadsheetData` para tipo "fotos") devem ser **excluídos** do projeto, ou apenas desconectados desta página?
