# Assistente IA de Análise de Dados

Um assistente de conversa, disponível em todo o app por um botão flutuante, que responde perguntas sobre os dados da empresa (financeiro, contábil, vendas, CRM, relógio/projetos e fotos), faz análises e projeções simples, e explica como usar as rotinas do aplicativo.

## Como vai funcionar

- Botão flutuante no canto inferior direito, presente em todas as páginas internas do sistema.
- Ao clicar, abre um painel de conversa com histórico salvo por usuário (é possível retomar conversas anteriores e iniciar novas).
- A IA responde em português, com valores em R$ e datas em DD/MM/AAAA.
- A IA apenas consulta dados. Ela nunca cria, altera ou exclui registros: quando a resposta exige uma ação, ela indica o caminho no menu e o passo a passo da rotina.
- Todos os dados consultados são restritos à empresa do usuário logado.

## Tipos de pergunta atendidos

- Desempenho: "como foram as vendas de 2026 comparado a 2025?", "qual meu ticket médio por projeto?"
- Financeiro: saldos, contas a pagar/receber vencidas e a vencer, fluxo de caixa, DRE por período.
- Previsões: projeção de recebimentos/pagamentos pelas parcelas em aberto e tendência baseada no histórico mensal (apresentada como estimativa, não garantia).
- Projetos e fotos: horas apontadas, fotos tiradas/enviadas/vendidas, eficiência, R$/foto e R$/hora.
- CRM: leads por funil, etapa e origem.
- Uso do app: onde fica cada rotina e como executá-la (lançar movimentação, baixar conta, efetivar venda, fechar mês, gerar relatórios etc.).

## Detalhes técnicos

**Banco de dados (nova migração)**
- `ia_conversas`: id, empresa_id, usuario_id, titulo, created_at, updated_at.
- `ia_mensagens`: id, conversa_id, papel (user/assistant), conteudo, created_at.
- GRANTs para `authenticated` e `service_role`, RLS habilitada e políticas restringindo cada usuário às suas próprias conversas.

**Função de servidor `assistente-ia`** (Lovable AI Gateway, modelo `openai/gpt-6-astra` na Responses API, com streaming e reasoning)
- Recebe o histórico da conversa, valida o JWT do usuário e resolve `empresa_id` a partir de `usuarios`.
- Expõe ferramentas de leitura ao modelo, todas com filtro fixo de `empresa_id` no servidor:
  - `consultar_schema`: lista tabelas e colunas disponíveis.
  - `consultar_dados`: executa SELECT parametrizado (tabela, colunas, filtros, período, ordenação, limite) via função SQL `security definer` que bloqueia qualquer comando que não seja leitura.
  - `resumo_financeiro`, `resumo_vendas`, `resumo_projetos`: agregações prontas que reproduzem os cálculos já usados nos painéis (regime de caixa, horas por projeto, fotos, eficiência).
- Prompt do sistema com o mapa de menus/rotinas do app para as perguntas de "como fazer", e com as regras de negócio já consolidadas (regime de caixa, fechamento mensal, antecipações).
- Tratamento dos erros do gateway conforme os códigos (créditos, limite de uso), exibindo a mensagem ao usuário sem repetir a chamada.

**Frontend**
- `src/components/ia/AssistenteIaButton.tsx` (botão flutuante) e `AssistenteIaPanel.tsx` (painel de chat com lista de conversas, streaming da resposta e indicador de "pensando").
- `src/hooks/useAssistenteIa.ts`: carrega/salva conversas e mensagens e consome o streaming da função.
- Montagem do botão em `src/components/layout/main-layout.tsx`, aparecendo apenas para usuário autenticado.
- Cores dos botões e ícones seguindo o padrão da página Favoritos; layout e demais páginas permanecem inalterados.
