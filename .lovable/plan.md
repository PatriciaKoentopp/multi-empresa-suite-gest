## Diagnóstico

A nota **38/1 - Edemar Construção Civil Ltda** existe no banco e deveria aparecer em `/financeiro/movimentacao` ao selecionar **Mês Anterior**:

- Movimentação: `173bd38d-eb19-4a57-b2dd-6bb0dcf4cd75`
- Número do documento: `38`
- Parcela: `1`
- Data de lançamento: `27/04/2026`
- Favorecido: `Edemar Construção Civil Ltda`
- Empresa: mesma empresa do contas a pagar

O problema encontrado está na página de movimentação: ela carrega a tabela diretamente da tabela `movimentacoes`, mas não filtra por empresa e não busca/estrutura as parcelas como o restante do financeiro. Além disso, o campo exibido como **Título/Parcela** é montado de forma incompleta: a tela passa apenas `numeroParcela: mov.numero_documento` e não preenche `numeroTitulo`, fazendo a tabela montar valores incorretos como `-/38` em vez de `38/1`.

Isso também deixa a página mais suscetível a inconsistências quando há muitos lançamentos, pois ela carrega movimentações de todas as empresas e filtra tudo no frontend.

## Plano de correção

### 1. Ajustar o carregamento da página `/financeiro/movimentacao`
Arquivo: `src/pages/financeiro/movimentacao/index.tsx`

Alterar a consulta para:
- usar a empresa atual (`currentCompany`) como nas páginas de contas a pagar/receber;
- buscar também `movimentacoes_parcelas` da movimentação;
- filtrar no banco por `empresa_id` da empresa selecionada;
- ordenar de forma previsível por `data_lancamento`.

### 2. Montar corretamente o campo Título/Parcela
No mapeamento da movimentação para a tabela:

- `numeroTitulo` receberá `mov.numero_documento`;
- `numeroParcela` receberá o número da primeira parcela encontrada, normalmente `1`;
- com isso, a tabela exibirá `38/1` para a nota do Edemar.

### 3. Corrigir a comparação de datas no filtro de período
Ainda em `src/pages/financeiro/movimentacao/index.tsx`, trocar a comparação baseada em `new Date('YYYY-MM-DD')` por `parseDateString`, seguindo a regra do projeto para evitar problemas de timezone.

Isso manterá o filtro de **Mês Atual**, **Mês Anterior** e **Selecionar Período** funcionando no formato esperado, sem deslocamento de dia.

### 4. Ajustar dependências do carregamento
A página passará a recarregar as movimentações quando a empresa atual estiver disponível ou for alterada, igual ao padrão usado em outras páginas financeiras.

## O que NÃO será alterado

- Layout da página.
- Botões, cores ou ícones.
- Regras de baixa, edição ou exclusão.
- Estrutura do banco de dados.
- Rotinas de contas a pagar/receber.