# Comprovante de pagamento na baixa (Contas a Pagar)

## O que muda para você
- **Modal Baixar Pagamento:** novo campo opcional **Comprovante (PDF)** para anexar o arquivo antes de confirmar a baixa. Só aceita PDF (até 10 MB).
- **Visualizar Baixa:** se houver comprovante gravado, aparece o botão **Baixar Comprovante**. Sem comprovante, mostra "Nenhum comprovante anexado".
- Nada mais na tela ou na lógica da baixa é alterado.

## Detalhes técnicos
- Banco: nova coluna `comprovante_path` (texto, opcional) em `movimentacoes_parcelas`.
- Armazenamento: pasta privada `comprovantes`, arquivos em `{empresa_id}/{parcela_id}/{data}.pdf`; regras de acesso permitem ler/gravar apenas arquivos da própria empresa (`get_user_company_id()`).
- `BaixarContaPagarModal.tsx`: input de arquivo; ao confirmar, envia o PDF e grava o caminho junto com o `update` da parcela. Falha no envio mostra aviso e não conclui a baixa.
- `VisualizarBaixaModal.tsx`: busca `comprovante_path` e gera link temporário (60s) com download do arquivo.
- Ao desfazer a baixa, o comprovante é mantido (não alterar lógica existente).
