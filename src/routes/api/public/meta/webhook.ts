import { createFileRoute } from "@tanstack/react-router";

async function assinaturaValida(body: string, header: string | null, secret: string) {
  if (!header?.startsWith("sha256=")) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body)));
  const esperado = Array.from(sig).map((b) => b.toString(16).padStart(2, "0")).join("");
  const recebido = header.slice(7);
  if (recebido.length !== esperado.length) return false;
  let diff = 0;
  for (let i = 0; i < esperado.length; i++) diff |= esperado.charCodeAt(i) ^ recebido.charCodeAt(i);
  return diff === 0;
}

export const Route = createFileRoute("/api/public/meta/webhook")({
  server: {
    handlers: {
      // Verificação do webhook pela Meta
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const token = process.env["META_VERIFY_TOKEN"];
        if (token && url.searchParams.get("hub.mode") === "subscribe" && url.searchParams.get("hub.verify_token") === token) {
          return new Response(url.searchParams.get("hub.challenge") ?? "", { status: 200 });
        }
        return new Response("Forbidden", { status: 403 });
      },
      POST: async ({ request }) => {
        const secret = process.env["META_APP_SECRET"];
        if (!secret) return new Response("Not configured", { status: 500 });
        const body = await request.text();
        if (body.length > 4 * 1024 * 1024) return new Response("Too large", { status: 413 });
        if (!(await assinaturaValida(body, request.headers.get("X-Hub-Signature-256"), secret))) {
          return new Response("Invalid signature", { status: 401 });
        }
        let payload: any;
        try { payload = JSON.parse(body); } catch { return new Response("Bad request", { status: 400 }); }
        if (payload?.object !== "page" && payload?.object !== "instagram") return new Response("ok");

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { processarPayloadMeta } = await import("@/lib/meta.server");
        try {
          await processarPayloadMeta(supabaseAdmin as any, payload);
        } catch (e) {
          console.error("Falha ao processar evento Meta", e);
          return new Response("Processing error", { status: 500 });
        }
        return new Response("ok");
      },
    },
  },
});
