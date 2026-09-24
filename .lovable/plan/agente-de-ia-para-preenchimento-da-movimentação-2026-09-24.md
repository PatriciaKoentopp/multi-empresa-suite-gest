# Agente de IA para preenchimento da movimentação

## O que muda para o usuário
Na tela Incluir Movimentação, ao anexar o PDF (normalmente uma nota fiscal), o sistema lê o documento automaticamente e preenche:
- **Número do documento**
- **Favorecido** (localizado no cadastro pelo CNPJ/CPF ou, se não houver, pelo nome)
- **Valor total**
- **Tipo de título** e **Categoria**: copiados do último documento lançado para esse favorecido

Durante a leitura aparece o aviso "Analisando documento com IA...". Ao final, um aviso informa o que foi preenchido. Se o favorecido não estiver cadastrado, ou não houver lançamento anterior dele, um aviso explica e os campos correspondentes ficam para preenchimento manual. Todos os campos continuam editáveis antes de salvar. Nada é gravado pela IA — a gravação continua só pelo botão Salvar.

O agente atua apenas ao incluir uma nova movimentação (não em edição ou visualização). Layout e demais funções da tela não mudam.

## Detalhes técnicos
- Nova edge function `ler-documento-movimentacao`:
  - Valida o usuário (JWT) e a empresa (mesma regra do assistente: perfil com empresa só usa a própria; admin usa a enviada).
  - Recebe a URL do PDF anexado + `empresaId` + `tipoOperacao`; baixa o arquivo e envia como entrada de arquivo para `openai/gpt-6-astra` (Responses API, streaming consumido no servidor, saída estruturada estrita: `numero_documento`, `cnpj_cpf_emitente`, `cnpj_cpf_destinatario`, `nome_favorecido`, `valor_total`, todos anuláveis).
  - Escolhe o documento do favorecido conforme o tipo (pagar = emitente; receber = destinatário), busca em `favorecidos` da empresa por documento normalizado (só dígitos) e, se não achar, por nome.
  - Busca em `movimentacoes` o último registro do favorecido na empresa (ordem `created_at` desc) e retorna `tipo_titulo_id` e `categoria_id`.
  - Trata 402/429/erros com mensagens em pt-BR.
- `src/hooks/useMovimentacaoForm.ts`: após upload bem-sucedido em `handleDocumentoChange` (apenas quando não é edição), chama a função, aplica `setNumDoc`, `setFavorecido`, `setValor` (formato 0,00), `setTipoTitulo`, `setCategoria` e expõe estado `isAnalisandoIa`.
- `src/pages/financeiro/incluir-movimentacao.tsx`: exibe o indicador de análise junto ao existente de upload e bloqueia Salvar enquanto analisa.
- `supabase/config.toml`: `verify_jwt = false` para a função (validação feita no código). Teste real com um PDF após o deploy.
