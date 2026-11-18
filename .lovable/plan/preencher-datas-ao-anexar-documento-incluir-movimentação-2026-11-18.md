# Preencher datas ao anexar documento (Incluir Movimentação)

## Causa
A leitura do documento pela IA hoje só extrai número, valor, favorecido, tipo de título e categoria. As datas nunca são pedidas à IA nem preenchidas no formulário.

## O que muda
- A IA passa a ler também a **data de emissão** e a **data de vencimento** do documento.
  - Nota fiscal: data de emissão; vencimento da primeira parcela/duplicata, se houver.
  - Guia de imposto: data de apuração/emissão como emissão e o campo "Pagar até"/"Vencimento" como primeiro vencimento.
- Ao anexar, o modal preenche **Data de Emissão** e **Data Primeiro Vencimento** (formato DD/MM/YYYY, sem fuso), e esses campos entram no aviso de "campos preenchidos".
- Se a IA não encontrar uma data, o campo fica como está.

## Detalhes técnicos
- `supabase/functions/ler-documento-movimentacao/index.ts`: adicionar `data_emissao` e `data_vencimento` (string `YYYY-MM-DD` ou null) ao schema e ao prompt; validar formato/ano ≥ 1900; devolver no JSON. Reimplantar a função.
- `src/hooks/useMovimentacaoForm.ts`: no retorno da leitura, `setDataEmissao(parseDateString(...))` e `setDataPrimeiroVenc(parseDateString(...))` quando válidas.
