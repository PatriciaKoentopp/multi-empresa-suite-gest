# Filtro Tipo de Projeto em /relatorios/tempo

## Objetivo
Incluir o filtro **Tipo de Projeto** (com opção "Todos") na página `/relatorios/tempo`, aplicando-o a todos os cards (métricas, evolução anual, distribuição de tarefas e projetos agrupados).

## Alterações

### 1. `src/hooks/useRelatorioTempoDB.ts`
- Buscar também `relogio_tipos_projeto` (id, nome) da empresa atual.
- Incluir `tipo_projeto_id` no select de `relogio_projetos`.
- Acrescentar no `HoraTrabalhadaData` retornado dois novos campos auxiliares:
  - `tipo_projeto_id` (string | null)
  - `tipo_projeto_nome` (string)
- Expor no retorno do hook: `tiposProjeto: { id, nome }[]` (apenas os tipos que possuem apontamentos, ordenados por nome).

### 2. `src/pages/relatorios/tempo/index.tsx`
- Novo estado `filtroTipoProjeto` (default `"todos"`).
- Adicionar `<Select>` "Tipo de Projeto" na mesma linha dos filtros Ano/Mês (manter padrão visual atual), com a opção "Todos os Tipos" + lista vinda do hook.
- Aplicar o filtro junto com Ano/Mês em `horasFiltradas` (antes de passar para `useRelatorioTempo`), garantindo que **todos os cards** (métricas, evolução anual, pizza de tarefas e projetos agrupados) reflitam o filtro.
- Filtros de Código/Cliente continuam funcionando como hoje (aplicados depois).

## Sem alterações
- Layout geral, cores, ícones e demais funcionalidades permanecem inalterados.
- Banco de dados, RLS e edge functions não são tocados.
