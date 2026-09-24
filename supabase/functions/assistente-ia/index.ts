import { createClient } from "npm:@supabase/supabase-js@2";
import { createOpenAI } from "npm:@ai-sdk/openai";
import { streamText, tool, stepCountIs } from "npm:ai";
import { z } from "npm:zod";
import { createLovableAiGatewayRunIdFetch, getLovableAiGatewayRunId } from "../_shared/ai-gateway.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const MAPA_APP = `
MAPA DE MENUS DO APLICATIVO (use para instruir o usuário):
- Dashboard: /dashboard
- Administrativo: Empresas /admin/empresas, Usuários /admin/usuarios, Permissões /admin/permissoes, Parâmetros /admin/parametros, Fechamento Mensal /admin/fechamento-mensal
- Cadastros: Grupo de Favorecidos, Grupos de Produtos/Serviços, Favorecidos /cadastros/favorecidos, Profissões, Origens, Motivos de Perda, Conta Corrente, Tipos de Títulos, Impostos Retidos
- Financeiro: Painel Financeiro /financeiro/painel-financeiro, Fluxo de Caixa /financeiro/fluxo-caixa, Movimentação /financeiro/movimentacao, Contas a Pagar /financeiro/contas-a-pagar, Contas a Receber /financeiro/contas-receber, Antecipações /financeiro/antecipacoes
- Contábil: Plano de Contas, Lançamentos, DRE /contabil/dre, Balanço
- Vendas: Painel de Vendas, Produtos, Serviços, Tabela de Preços, Orçamentos /vendas/orcamento, Contratos, Faturamento
- CRM: Painel, Leads /crm/leads, Agenda, Conf. do Funil, Marketing
- Relógio: Tipos de Projeto, Projetos /relogio/projetos, Apontamento /relogio/apontamento, Visualização, Painel de Tempo, Painel de Projetos, Horas por Projeto, Planilha de Fotos
- Relatórios: /relatorios (financeiro, vendas, projetos, fotos, aniversariantes, notas fiscais, classificação ABC, logs de transações, contas a pagar/receber em aberto, antecipações em aberto)
- Backup: /backup

REGRAS DE NEGÓCIO DO SISTEMA:
- Receitas e despesas são reconhecidas pelo regime de caixa (data_pagamento das parcelas).
- Meses fechados (tabela fechamentos_mensais) bloqueiam alterações financeiras.
- Antecipações: valor_disponivel é calculado automaticamente; status pode ser ativa, utilizada, cancelada ou devolvida.
- Vendas efetivadas são orçamentos com tipo/status de venda; parcelas ficam em movimentacoes_parcelas.
- Horas de projeto vêm de relogio_apontamentos; fotos (tiradas/enviadas/vendidas) ficam em relogio_projetos.
`;

function systemPrompt(empresaId: string, empresaNome: string, hoje: string) {
  return `Você é o Assistente de Análise do ERP da empresa "${empresaNome}". Responda SEMPRE em português do Brasil.

Data de hoje: ${hoje}.
ID da empresa do usuário: ${empresaId}

SUAS CAPACIDADES
1. Consultar os dados da empresa com as ferramentas disponíveis e analisar desempenho (financeiro, contábil, vendas, CRM, projetos, horas e fotos).
2. Fazer projeções simples com base no histórico e nas parcelas em aberto, sempre deixando claro que são estimativas.
3. Explicar como usar o aplicativo e onde executar cada rotina.

REGRAS OBRIGATÓRIAS
- Você é SOMENTE LEITURA. Nunca crie, altere ou apague registros. Quando o usuário precisar de uma ação, explique o caminho no menu e o passo a passo.
- Toda consulta SQL DEVE filtrar por empresa_id = '${empresaId}' (direta ou indiretamente via join). Consultas sem esse filtro são rejeitadas.
- Use somente SELECT (pode usar WITH, JOIN, agregações, filtros de data). Um comando por chamada, sem ponto e vírgula.
- Sempre limite os resultados (LIMIT 200 no máximo) e prefira agregações a listas longas.
- Antes de consultar tabelas que você não conhece, chame consultar_schema.
- Se uma consulta falhar, corrija o SQL e tente novamente (no máximo 3 tentativas para a mesma pergunta).
- Formate valores como R$ 1.234,56 e datas como DD/MM/AAAA. Nunca use outro formato de data.
- Responda de forma objetiva, com tabelas em markdown quando houver vários números, e destaque variações e conclusões.
- Se os dados não existirem, diga isso claramente em vez de inventar números.

${MAPA_APP}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY não configurada." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autenticado." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userResult, error: userError } = await authClient.auth.getUser();
    if (userError || !userResult?.user) {
      return new Response(JSON.stringify({ error: "Sessão inválida. Faça login novamente." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: usuario } = await admin
      .from("usuarios")
      .select("empresa_id, nome")
      .eq("id", userResult.user.id)
      .maybeSingle();

    const usuarioEmpresaId = usuario?.empresa_id as string | undefined;

    const body = await req.json();
    const messages = body?.messages;
    const empresaIdSolicitada = body?.empresaId as string | null | undefined;

    // Segurança: se o usuário tem empresa vinculada no perfil, ele só pode
    // consultar essa empresa (ignora o empresaId enviado pelo cliente).
    // Se o usuário não tem empresa vinculada (admin), usa o empresaId do cliente.
    const empresaId = usuarioEmpresaId ?? (empresaIdSolicitada || undefined);
    if (!empresaId) {
      return new Response(JSON.stringify({ error: "Usuário sem empresa vinculada." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: empresa } = await admin
      .from("empresas")
      .select("nome_fantasia, razao_social")
      .eq("id", empresaId)
      .maybeSingle();

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Nenhuma mensagem enviada." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const hoje = new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
    const nomeEmpresa = (empresa?.nome_fantasia || empresa?.razao_social || "sua empresa") as string;

    const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(req));
    const lovable = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey,
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
      fetch: runIdFetch.fetch,
    });

    const result = streamText({
      model: lovable.responses("openai/gpt-6-astra"),
      system: systemPrompt(empresaId, nomeEmpresa, hoje),
      messages: messages.slice(-20).map((m: any) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content ?? ""),
      })),
      stopWhen: stepCountIs(25),
      tools: {
        consultar_schema: tool({
          description:
            "Lista todas as tabelas do banco de dados da aplicação com suas colunas e tipos. Use antes de montar consultas sobre tabelas desconhecidas.",
          inputSchema: z.object({
            filtro: z
              .string()
              .nullable()
              .describe("Texto para filtrar nomes de tabelas (ex.: 'relogio'). Use null para listar tudo."),
          }),
          execute: async ({ filtro }) => {
            const { data, error } = await admin.rpc("ia_listar_schema");
            if (error) return { erro: error.message };
            const lista = (data as any[]) ?? [];
            const filtrada = filtro
              ? lista.filter((t) => String(t.tabela).toLowerCase().includes(filtro.toLowerCase()))
              : lista;
            return { tabelas: filtrada };
          },
        }),
        consultar_dados: tool({
          description:
            "Executa uma consulta SELECT somente-leitura no banco da empresa. A consulta precisa conter o filtro empresa_id da empresa do usuário e retornar no máximo 200 linhas.",
          inputSchema: z.object({
            objetivo: z.string().describe("O que esta consulta pretende responder."),
            sql: z.string().describe("Comando SELECT completo, sem ponto e vírgula final."),
          }),
          execute: async ({ sql }) => {
            const { data, error } = await admin.rpc("ia_executar_consulta", {
              p_empresa_id: empresaId,
              p_sql: sql,
            });
            if (error) return { erro: error.message };
            const linhas = (data as any[]) ?? [];
            return {
              total_linhas: linhas.length,
              linhas: linhas.slice(0, 200),
            };
          },
        }),
      },
      providerOptions: {
        openai: {
          forceReasoning: true,
          reasoningEffort: "low",
          reasoningSummary: "auto",
          store: false,
          include: ["reasoning.encrypted_content"],
        },
      },
    });

    return result.toTextStreamResponse({
      headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro inesperado";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
