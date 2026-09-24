# DARF e outras guias: tipo de título pelo imposto da guia

## O que muda para o usuário
Quando o documento anexado for uma guia de imposto (DARF, DAS, GPS etc.), o agente lê o **código da receita e a denominação** (por exemplo: 2172 - COFINS) e escolhe o **tipo de título** correspondente entre os já cadastrados na empresa. Exemplos com o seu cadastro atual:
- 2172 COFINS -> "DC - Cofins a Pagar"
- 8109 PIS -> "DP - Pis a Pagar"
- 2089 IRPJ -> "DIRPJ - IRPJ a Pagar"
- 2372 CSLL -> "DCSLL - CSLL a Pagar"
- 1708 / 0561 IRRF -> "DIRRF - IRRF a Recolher"
- 5952 CSLL/PIS/COFINS retidos -> "DCPC - CSLL/PIS/COFINS a Recolher"
- GPS / INSS -> "DI - INSS a Pagar" ou "DINSS - INSS a Recolher", conforme a guia

A **categoria** é copiada do último lançamento feito com o mesmo tipo de título, e não mais do último lançamento do favorecido. Se nenhum tipo de título servir, o campo fica em branco e aparece um aviso com o imposto identificado (por exemplo "COFINS - código 2172").

Para notas fiscais, nada muda: tipo de título e categoria continuam vindo do último lançamento do favorecido. O favorecido da guia continua sendo o órgão que recebe (Receita Federal).

## Detalhes técnicos
- Edge function `ler-documento-movimentacao`:
  - Antes de chamar a IA, buscar `tipos_titulos` da empresa com `status = 'ativo'` e `tipo` igual ao tipo da operação, e incluir a lista (id e nome) no prompt.
  - Acrescentar ao esquema de saída: `codigo_receita`, `denominacao_imposto` e `tipo_titulo_sugerido`. O último é um enum com os nomes dessa lista mais `"nenhum"`, montado em tempo de execução. Se a lista for grande (mais de 40 itens), usar texto livre e comparar o nome no código.
  - Prompt: nas guias, identificar o imposto pelo código e pela denominação e escolher o tipo de título equivalente. Separar imposto próprio de imposto retido (ex.: 5952 e 1708 são retidos).
  - Quando for `guia_imposto`: `tipo_titulo_id` vem da escolha da IA. `categoria_id` vem da última movimentação da empresa com esse `tipo_titulo_id` (ordem `created_at` desc). Retornar também `imposto_identificado`, para mostrar no aviso.
- `src/hooks/useMovimentacaoForm.ts`: quando for guia e não houver tipo de título, mostrar o aviso "Imposto identificado: X — selecione o tipo de título", no lugar de "Nenhum lançamento anterior deste favorecido".
- Redeploy da função.
