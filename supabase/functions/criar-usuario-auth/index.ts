
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Sempre defina os headers de CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Carrega secret do Supabase
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "Supabase key missing" }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  // Exige usuário logado, administrador de uma empresa
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) {
    return new Response(JSON.stringify({ error: "Não autenticado" }), { status: 401, headers: corsHeaders });
  }
  const meResp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { "apikey": SERVICE_ROLE_KEY, "Authorization": `Bearer ${token}` },
  });
  if (!meResp.ok) {
    return new Response(JSON.stringify({ error: "Não autenticado" }), { status: 401, headers: corsHeaders });
  }
  const me = await meResp.json();
  const perfilResp = await fetch(`${SUPABASE_URL}/rest/v1/usuarios?id=eq.${encodeURIComponent(me?.id ?? "")}&select=tipo,empresa_id`, {
    headers: { "apikey": SERVICE_ROLE_KEY, "Authorization": `Bearer ${SERVICE_ROLE_KEY}` },
  });
  const perfil = perfilResp.ok ? (await perfilResp.json())?.[0] : null;
  if (!perfil || perfil.tipo !== "Administrador" || !perfil.empresa_id) {
    return new Response(JSON.stringify({ error: "Apenas administradores podem cadastrar usuários" }), { status: 403, headers: corsHeaders });
  }

  // Lê body da requisição (a empresa é sempre a do administrador)
  const { email, nome, senha, tipo, status, vendedor } = await req.json();
  const empresa_id = perfil.empresa_id as string;
  if (tipo && tipo !== "Administrador" && tipo !== "Usuário") {
    return new Response(JSON.stringify({ error: "Tipo inválido" }), { status: 400, headers: corsHeaders });
  }
  if (!email || !nome || !senha) {
    return new Response(JSON.stringify({ error: "Dados obrigatórios ausentes" }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  // 1. Cria usuário no Auth via API service_role
  const createUserResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: { nome },
    }),
  });

  if (!createUserResponse.ok) {
    const error = await createUserResponse.json();
    return new Response(JSON.stringify({ error: error?.msg || error?.error_description || "Erro ao cadastrar usuário" }), {
      status: 400,
      headers: corsHeaders,
    });
  }
  const userData = await createUserResponse.json();
  const userId = userData.user?.id;
  if (!userId) {
    return new Response(JSON.stringify({ error: "Não foi possível obter o ID do usuário criado." }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  // 2. Insere na tabela usuarios
  const insertUsuarioResponse = await fetch(`${SUPABASE_URL}/rest/v1/usuarios`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
      "Prefer": "return=representation"
    },
    body: JSON.stringify([{
      id: userId,
      nome,
      email,
      tipo: tipo || "Usuário",
      status: status || "ativo",
      vendedor: vendedor || "nao",
      empresa_id: empresa_id ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }])
  });

  const insertData = await insertUsuarioResponse.json();

  if (!insertUsuarioResponse.ok) {
    return new Response(JSON.stringify({ error: insertData?.message || "Erro ao inserir usuário na tabela usuarios" }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  return new Response(JSON.stringify({
    ok: true,
    id: userId,
    usuario: insertData && insertData[0] ? insertData[0] : null,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
