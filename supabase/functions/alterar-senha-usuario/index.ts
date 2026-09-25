import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Não autenticado" }, 401);

    const userClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: uErr } = await userClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (uErr || !user) return json({ error: "Não autenticado" }, 401);

    const parsed = z.object({ userId: z.string().uuid(), senha: z.string().min(6).max(72) }).safeParse(await req.json());
    if (!parsed.success) return json({ error: "Dados inválidos" }, 400);
    const { userId, senha } = parsed.data;

    const admin = createClient(url, service);
    if (userId !== user.id) {
      const { data: me } = await admin.from("usuarios").select("tipo").eq("id", user.id).maybeSingle();
      if (me?.tipo !== "Administrador") return json({ error: "Apenas administradores podem alterar a senha de outros usuários" }, 403);
    }

    const { error } = await admin.auth.admin.updateUserById(userId, { password: senha });
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
