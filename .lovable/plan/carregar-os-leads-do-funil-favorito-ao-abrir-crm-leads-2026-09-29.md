# Carregar os leads do funil favorito ao abrir /crm/leads

## Causa
Ao abrir a página, o funil favorito é selecionado na tela, mas a primeira busca de leads é feita sempre para o **primeiro funil da lista**. Resultado: o seletor mostra o favorito, mas os leads carregados são de outro funil (ou nenhum). Só ao trocar de funil e voltar a busca é refeita com o funil certo.

## Correção
- Na carga inicial, guardar o funil escolhido (favorito, ou o primeiro se não houver favorito) e usar esse mesmo funil na primeira busca de leads.
- Nada mais muda na página.

## Detalhes técnicos
- `src/pages/crm/leads/index.tsx`: no carregamento inicial, criar `funilInicialId` (prioritário encontrado ou `funisFormatados[0].id`), usar em `setSelectedFunilId` e trocar `fetchLeads(empresaIdToUse, funisFormatados[0].id, funisFormatados)` por `fetchLeads(empresaIdToUse, funilInicialId, funisFormatados)`.
