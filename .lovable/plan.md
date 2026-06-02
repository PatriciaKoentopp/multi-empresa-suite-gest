# Trocar fonte de dados do Relatório de Projetos

Hoje a página `/relatorios/projetos` cruza dados de **vendas (DB)** com **fotos/horas (planilha de upload)**. A solicitação é manter toda a lógica, layout, métricas, filtros, gráficos e exportação intactos, e apenas trocar a fonte de fotos/horas para o banco — usando os mesmos dados que alimentam as páginas `/relogio/projetos` (cadastro) e `/relogio/apontamento` (horas).

## Mapeamento de dados

Origem nova (DB):
- `relogio_projetos`: `codigo` (número do projeto), `nome` (cliente/descrição), `fotos_tiradas`, `fotos_enviadas`, `fotos_vendidas`, `status`.
- `relogio_apontamentos`: `projeto_id`, `duracao_decimal` → somatório por projeto = `totalHoras`.

Equivalência com o que hoje vem da planilha (via `useRelatorioFotos`):

```text
numeroProjeto   ← relogio_projetos.codigo (normalizado)
cliente         ← relogio_projetos.nome
fotosVendidas   ← relogio_projetos.fotos_vendidas
fotosEnviadas   ← relogio_projetos.fotos_enviadas
fotosTiradas    ← relogio_projetos.fotos_tiradas
totalHoras      ← SUM(relogio_apontamentos.duracao_decimal) por projeto_id
```

O cruzamento com vendas continua sendo por `numeroProjeto` (igual a `orcamentos.codigo_projeto`), mantendo `useRelatorioProjetos` praticamente inalterado — só muda o segundo parâmetro de entrada.

## Mudanças no código

### 1. Novo hook `useRelatorioProjetosFotosDB`
Substitui o papel de `useRelatorioFotos` para esta página. Lê `relogio_projetos` + `relogio_apontamentos` da empresa atual e devolve `projetosAgrupados` no mesmo shape consumido por `useRelatorioProjetos` (apenas os campos que ele lê: `numeroProjeto`, `cliente`, `fotosVendidas`, `fotosEnviadas`, `fotosTiradas`, `totalHoras`).

Critério para incluir um projeto (equivalente ao "projeto completo" da planilha hoje): `cliente` preenchido E (`fotos_vendidas > 0` OU `fotos_enviadas > 0` OU `fotos_tiradas > 0` OU `totalHoras > 0`). Mantém o comportamento de só considerar projetos com algum dado, sem alterar regras de métrica.

### 2. Refator mínimo em `useRelatorioProjetos`
Aceitar diretamente uma lista já no formato de `ProjetoFotosAgrupado` em vez de invocar `useRelatorioFotos` internamente. Toda a lógica de combinação, métricas, `projetosCompletos / projetosSemVenda / projetosSemFotos` permanece igual.

### 3. Página `src/pages/relatorios/projetos/index.tsx`
- Remover: card "Planilhas de Fotos", seleção de uploads, `UploadModal`, botão "Nova Planilha", estado/efeitos de `selectedUploads`, `spreadsheetData`, `consolidatedData`, `uploads`, `useUploadFiles`, `useSpreadsheetData`, dialog de deletar upload.
- Carregar automaticamente os dados de fotos/horas via o novo hook quando a empresa estiver definida.
- Renderizar filtros, métricas, gráficos e tabela sempre que houver dados (sem depender de upload selecionado).
- Atualizar a descrição do header (ex.: "Análise integrada de vendas, projetos e apontamentos").

### 4. Sem mudanças em
- `ProjetosMetricsCards`, `ProjetosTable`, `ProjetosTimelineCharts`, `ProjetosTimelineVendidasCharts`, `useExcelProjetos`.
- Layout, cores, ícones, ordenação, filtros (cliente / nº projeto / status / datas) e exportação Excel.
- Página `/relatorios/fotos` (que continua usando a planilha) — não será tocada.

## Detalhes técnicos

- Normalização de `codigo` segue o padrão já usado no hook (`String(...).trim().replace(/^0+/, '')`) para casar com `orcamentos.codigo_projeto`.
- Soma de horas: agregação em memória após `select('projeto_id, duracao_decimal').eq('empresa_id', ...)` (mesma tabela já lida em `useApontamentosRelogio`).
- Filtro por status do projeto (`ativo`/`arquivado`) não entra no escopo desta solicitação — todos os projetos do cadastro entram, exatamente como a planilha atual não filtra status.
