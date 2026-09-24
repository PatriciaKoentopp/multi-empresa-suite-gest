# Leitura de guias de impostos (DARF e similares) pelo agente de IA

## O que o documento contém
Consegui ler o DARF anexado:
- Número do documento: 07.01.26264.8212540-0
- CNPJ / Razão social: 48.175.393/0001-09 — JMURARA ADMINISTRADORA DE BENS LTDA (quem paga)
- Período de apuração: 31/08/2026 | Vencimento: 25/09/2026
- Código 2172 — COFINS | Valor total: R$ 960,89

## Problema atual
Hoje o agente trata todo PDF como nota fiscal: em contas a pagar, procura o favorecido pelo CNPJ do emitente. No DARF, o único CNPJ é o da própria empresa, que paga a guia. Por isso o agente não encontraria o favorecido certo (Receita Federal), mas o número e o valor já seriam lidos.

## O que muda
- O agente passa a reconhecer o tipo de documento: nota fiscal ou guia de imposto (DARF, DAS, GPS, DARE, GNRE, guias municipais).
- Em guias de imposto, o favorecido é o órgão que recebe a guia (Receita Federal, Secretaria da Fazenda do estado, Prefeitura). O sistema procura esse órgão no cadastro pelo nome (por exemplo, "Receita Federal"), nunca pelo CNPJ da própria empresa.
- O número do documento é lido exatamente como aparece (por exemplo 07.01.26264.8212540-0) e o valor total vem do campo "Valor Total do Documento".
- Tipo de título e categoria continuam vindo do último lançamento desse favorecido. Assim, um DARF de COFINS repete o que foi usado no último DARF lançado para a Receita Federal.
- Se o órgão não estiver cadastrado, aparece um aviso com o nome identificado.

## Detalhes técnicos
- Edge function `ler-documento-movimentacao`: acrescentar ao esquema de saída `tipo_documento` (enum `nota_fiscal` | `guia_imposto`) e `orgao_arrecadador` (anulável). Ajustar o prompt para descrever DARF/DAS/GPS/DARE/GNRE.
- Quando `guia_imposto`: ignorar os CNPJs lidos e buscar o favorecido pelo nome normalizado de `orgao_arrecadador`, com variações comuns ("Receita Federal", "Secretaria da Receita Federal", "RFB"). Caso contrário, manter a lógica atual.
- Redeploy da função. Nenhuma alteração na tela.
