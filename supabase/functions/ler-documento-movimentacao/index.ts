import { createClient } from "npm:@supabase/supabase-js@2";
import { createOpenAI } from "npm:@ai-sdk/openai";
import { streamText, Output } from "npm:ai";
import { z } from "npm:zod";
import { createLovableAiGatewayRunIdFetch, getLovableAiGatewayRunId } from "../_shared/ai-gateway.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const soDigitos = (s?: string | null) => (s || "").replace(/\D/g, "");
const normNome = (s?: string | null) =>
  (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "LOVABLE_API_KEY não configurada." }, 500);

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "Não autenticado." }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const authClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userResult, error: userError } = await authClient.auth.getUser();
    if (userError || !userResult?.user) return json({ error: "Sessão inválida. Faça login novamente." }, 401);

    const admin = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: usuario } = await admin.from("usuarios").select("empresa_id").eq("id", userResult.user.id).maybeSingle();

    const body = await req.json();
    const empresaId = (usuario?.empresa_id as string | undefined) ?? (body?.empresaId || undefined);
    if (!empresaId) return json({ error: "Empresa não identificada." }, 400);

    const pdfBase64 = body?.pdfBase64 as string | undefined;
    const fileName = (body?.fileName as string) || "documento.pdf";
    const tipoOperacao = body?.tipoOperacao === "receber" ? "receber" : "pagar";
    if (!pdfBase64) return json({ error: "Documento não enviado." }, 400);

    const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(req));
    const lovable = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey,
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
      fetch: runIdFetch.fetch,
    });

    const schema = z.object({
      numero_documento: z.string().nullable(),
      cnpj_cpf_emitente: z.string().nullable(),
      nome_emitente: z.string().nullable(),
      cnpj_cpf_destinatario: z.string().nullable(),
      nome_destinatario: z.string().nullable(),
      valor_total: z.number().nullable(),
    });

    let extraido: z.infer<typeof schema>;
    try {
      const result = streamText({
        model: lovable.responses("openai/gpt-6-astra"),
        output: Output.object({ schema }),
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  "Leia este documento (geralmente uma nota fiscal brasileira) e extraia: número do documento/nota (apenas o número), CNPJ/CPF e nome do emitente (prestador/fornecedor), CNPJ/CPF e nome do destinatário (tomador/cliente) e o valor total do documento em reais (número decimal). Use null quando não encontrar.",
              },
              { type: "file", filename: fileName, data: pdfBase64, mediaType: "application/pdf" },
            ],
          },
        ],
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
      extraido = await result.output;
    } catch (e) {
      const status = (e as any)?.statusCode ?? (e as any)?.status;
      if (status === 402) return json({ error: "Créditos de IA insuficientes. Adicione créditos para continuar." }, 402);
      if (status === 429) return json({ error: "Muitas solicitações. Tente novamente em instantes." }, 429);
      console.error("Erro IA:", e);
      return json({ error: "Não foi possível ler o documento com IA." }, 500);
    }

    const docFav = tipoOperacao === "pagar" ? extraido.cnpj_cpf_emitente : extraido.cnpj_cpf_destinatario;
    const nomeFav = tipoOperacao === "pagar" ? extraido.nome_emitente : extraido.nome_destinatario;

    const { data: favs } = await admin
      .from("favorecidos")
      .select("id, nome, nome_fantasia, documento")
      .eq("empresa_id", empresaId);

    let favorecido: any = null;
    const dig = soDigitos(docFav);
    if (dig && favs) favorecido = favs.find((f: any) => soDigitos(f.documento) === dig) || null;
    if (!favorecido && nomeFav && favs) {
      const n = normNome(nomeFav);
      favorecido =
        favs.find((f: any) => normNome(f.nome) === n || normNome(f.nome_fantasia) === n) ||
        favs.find((f: any) => {
          const a = normNome(f.nome);
          return a.length > 3 && (a.includes(n) || n.includes(a));
        }) ||
        null;
    }

    let tipo_titulo_id: string | null = null;
    let categoria_id: string | null = null;
    if (favorecido) {
      const { data: ultima } = await admin
        .from("movimentacoes")
        .select("tipo_titulo_id, categoria_id")
        .eq("empresa_id", empresaId)
        .eq("favorecido_id", favorecido.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      tipo_titulo_id = ultima?.tipo_titulo_id ?? null;
      categoria_id = ultima?.categoria_id ?? null;
    }

    return json({
      numero_documento: extraido.numero_documento,
      valor_total: extraido.valor_total,
      favorecido_id: favorecido?.id ?? null,
      favorecido_nome: favorecido?.nome ?? nomeFav ?? null,
      favorecido_encontrado: !!favorecido,
      tipo_titulo_id,
      categoria_id,
    });
  } catch (e) {
    console.error(e);
    return json({ error: "Erro ao processar o documento." }, 500);
  }
});
