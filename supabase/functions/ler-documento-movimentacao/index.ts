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

    const { data: ttData } = await admin
      .from("tipos_titulos")
      .select("id, nome")
      .eq("empresa_id", empresaId)
      .eq("status", "ativo")
      .eq("tipo", tipoOperacao);
    const tiposTitulos = ttData || [];

    const schema = z.object({
      tipo_documento: z.enum(["nota_fiscal", "guia_imposto"]),
      orgao_arrecadador: z.string().nullable(),
      codigo_receita: z.string().nullable(),
      denominacao_imposto: z.string().nullable(),
      tipo_titulo_sugerido: z.string().nullable(),
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
                  "Leia este documento brasileiro. Primeiro classifique tipo_documento: 'guia_imposto' para guias de arrecadação (DARF, DAS, GPS, DARE, GNRE, guias de ISS/IPTU municipais) ou 'nota_fiscal' para notas fiscais e demais documentos. Extraia: número do documento exatamente como aparece (em guias, o campo 'Número do Documento', mantendo pontos e traço; em notas, apenas o número da nota), CNPJ/CPF e nome do emitente (prestador/fornecedor), CNPJ/CPF e nome do destinatário (tomador/cliente) e o valor total do documento em reais (número decimal; em guias, o 'Valor Total do Documento'). Em guias de imposto, o CNPJ exibido é do contribuinte que paga: preencha orgao_arrecadador com o órgão que recebe a guia (ex.: 'Receita Federal' para DARF/DAS/GPS, 'Secretaria da Fazenda' para DARE/GNRE, 'Prefeitura de <cidade>' para guias municipais). Em guias, preencha cnpj_cpf_destinatario e nome_destinatario com o CNPJ/CPF e nome do contribuinte. Em notas fiscais, orgao_arrecadador = null. Use null quando não encontrar.\n\n" +
                  "Em guias de imposto, preencha codigo_receita (ex.: '2172') e denominacao_imposto (ex.: 'COFINS') a partir da composição do documento, e escolha em tipo_titulo_sugerido o nome EXATO de um dos tipos de título abaixo que corresponda ao imposto, distinguindo imposto próprio de imposto retido (ex.: 5952 = CSLL/PIS/COFINS retidos; 1708 e 0561 = IRRF; 2172 = COFINS; 8109 = PIS; 2089 = IRPJ; 2372 = CSLL; GPS = INSS). Se nenhum servir, use 'nenhum'. Em notas fiscais, codigo_receita, denominacao_imposto e tipo_titulo_sugerido = null.\n\nTipos de título disponíveis:\n" +
                  (tiposTitulos.map((t: any) => `- ${t.nome}`).join("\n") || "(nenhum cadastrado)"),
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

    const isGuia = extraido.tipo_documento === "guia_imposto";

    // Verifica se o documento pertence à empresa logada
    const soDigitos = (v: string | null | undefined) => String(v || "").replace(/\D/g, "");
    const { data: empresa } = await admin.from("empresas").select("cnpj, razao_social, nome_fantasia").eq("id", empresaId).maybeSingle();
    const cnpjEmpresa = soDigitos(empresa?.cnpj);
    const docEmpresaNoDocumento = soDigitos(
      tipoOperacao === "receber" && !isGuia ? extraido.cnpj_cpf_emitente : extraido.cnpj_cpf_destinatario,
    );
    const nomeEmpresaNoDocumento =
      tipoOperacao === "receber" && !isGuia ? extraido.nome_emitente : extraido.nome_destinatario;
    if (cnpjEmpresa && docEmpresaNoDocumento && docEmpresaNoDocumento !== cnpjEmpresa) {
      return json({
        empresa_divergente: true,
        documento_empresa: nomeEmpresaNoDocumento
          ? `${nomeEmpresaNoDocumento} (${docEmpresaNoDocumento})`
          : docEmpresaNoDocumento,
        empresa_logada: empresa?.nome_fantasia || empresa?.razao_social || "",
      });
    }
    const docFav = isGuia ? null : tipoOperacao === "pagar" ? extraido.cnpj_cpf_emitente : extraido.cnpj_cpf_destinatario;
    const nomeFav = isGuia
      ? extraido.orgao_arrecadador
      : tipoOperacao === "pagar" ? extraido.nome_emitente : extraido.nome_destinatario;

    const { data: favs } = await admin
      .from("favorecidos")
      .select("id, nome, nome_fantasia, documento")
      .eq("empresa_id", empresaId);

    const buscarPorNome = (nome: string) => {
      const n = normNome(nome);
      if (!n || !favs) return null;
      return (
        favs.find((f: any) => normNome(f.nome) === n || normNome(f.nome_fantasia) === n) ||
        favs.find((f: any) => {
          const a = normNome(f.nome);
          const b = normNome(f.nome_fantasia);
          return (a.length > 3 && (a.includes(n) || n.includes(a))) || (b.length > 3 && (b.includes(n) || n.includes(b)));
        }) ||
        null
      );
    };

    let favorecido: any = null;
    const dig = soDigitos(docFav);
    if (dig && favs) favorecido = favs.find((f: any) => soDigitos(f.documento) === dig) || null;
    if (!favorecido && nomeFav) favorecido = buscarPorNome(nomeFav);
    if (!favorecido && isGuia && nomeFav && /receita federal|rfb|darf/i.test(normNome(nomeFav) + " " + nomeFav)) {
      for (const alt of ["Receita Federal", "Secretaria da Receita Federal", "Receita Federal do Brasil", "RFB"]) {
        favorecido = buscarPorNome(alt);
        if (favorecido) break;
      }
    }

    let tipo_titulo_id: string | null = null;
    let categoria_id: string | null = null;
    const imposto_identificado = isGuia
      ? [extraido.denominacao_imposto, extraido.codigo_receita ? `código ${extraido.codigo_receita}` : null].filter(Boolean).join(" - ") || null
      : null;

    if (isGuia) {
      const sug = normNome(extraido.tipo_titulo_sugerido);
      if (sug && sug !== "nenhum") {
        const tt =
          tiposTitulos.find((t: any) => normNome(t.nome) === sug) ||
          tiposTitulos.find((t: any) => normNome(t.nome).includes(sug) || sug.includes(normNome(t.nome)));
        if (tt) {
          tipo_titulo_id = tt.id;
          const { data: ultima } = await admin
            .from("movimentacoes")
            .select("categoria_id")
            .eq("empresa_id", empresaId)
            .eq("tipo_titulo_id", tt.id)
            .not("categoria_id", "is", null)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          categoria_id = ultima?.categoria_id ?? null;
        }
      }
    } else if (favorecido) {
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
      is_guia: isGuia,
      imposto_identificado,
    });
  } catch (e) {
    console.error(e);
    return json({ error: "Erro ao processar o documento." }, 500);
  }
});
