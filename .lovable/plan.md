# Implantação de Saldos Mensais para o DRE

## Objetivo
Para uma empresa nova (ex.: Motor Place, iniciando em novembro/2026), lançar de uma vez **o total de cada categoria por mês** (jan a out/2026), para o DRE mostrar o ano completo sem refazer lançamento por lançamento.

## Como vai funcionar para você
- Nova página **Contábil > Implantação de Saldos DRE**.
- Escolha o **ano** e veja uma tabela: linhas = categorias do Plano de Contas que entram no DRE (Receita/Despesa); colunas = meses (Jan a Out, até o mês anterior à implantação).
- Digite o valor total de cada categoria em cada mês, como na planilha. Total por linha e por mês no rodapé.
- Opção **Importar do Excel** (mesmo layout: categoria + meses) para colar os valores do balancete/contador.
- Botão **Salvar**: grava os saldos; ao reabrir, os valores aparecem para corrigir. Zerar uma célula remove aquele saldo.
- Os saldos aparecem no DRE (mensal, anual e comparativo) e na Análise do DRE como lançamentos normais daquela categoria naquele mês.

## O que NÃO é afetado
- Saldo das contas correntes, fluxo de caixa operacional, contas a pagar/receber e relatórios financeiros: os saldos de implantação ficam identificados e **fora** desses cálculos.
- Meses fechados (fechamento mensal) continuam bloqueados — a implantação deve ser feita antes do fechamento.

## Detalhes técnicos
- O DRE lê `fluxo_caixa` ligado a `movimentacoes` (categoria_id → plano_contas). Cada célula salva cria 1 movimentação + 1 registro em `fluxo_caixa` no último dia do mês, com marca de origem "implantacao_dre" (ampliar a restrição de `origem`) e sem conta corrente.
- Filtrar `origem = 'implantacao_dre'` fora dos saldos de conta, Fluxo de Caixa e relatórios financeiros; DRE e Análise DRE continuam incluindo.
- Rota nova `src/routes/contabil/implantacao-saldos.tsx` + página em `src/pages/contabil/implantacao-saldos/`, item no menu Contábil, botões/ícones no padrão da página Favoritos, datas DD/MM/YYYY.
- Log em `logs_transacoes` ao salvar.
