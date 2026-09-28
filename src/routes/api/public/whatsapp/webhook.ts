import { createFileRoute } from "@tanstack/react-router";
import { verifyWebhookRequest } from "@lovable.dev/webhooks-js";

export const Route = createFileRoute("/api/public/whatsapp/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { listarNomesCredenciais, processarEvento, processarPendentes } = await import("@/lib/whatsapp.server");
        const secrets = listarNomesCredenciais().map((n) => process.env[n]!).filter(Boolean);
        if (!secrets.length) return new Response("Not configured", { status: 500 });

        let verified: { payload: any };
        try {
          verified = await verifyWebhookRequest({ req: request, secrets, maxBodyBytes: 4 * 1024 * 1024 });
        } catch {
          return new Response("Invalid signature", { status: 401 });
        }

        const deliveryId = request.headers.get("X-Lovable-Delivery");
        const event = request.headers.get("X-Lovable-Event");
        if (!deliveryId || !event) return new Response("Missing headers", { status: 400 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const admin = supabaseAdmin as any;

        const ins = await admin.from("whatsapp_webhook_events")
          .upsert({ delivery_id: deliveryId, event, payload: verified.payload }, { onConflict: "delivery_id", ignoreDuplicates: true });
        if (ins.error) {
          console.error("Falha ao gravar evento WhatsApp", ins.error);
          return new Response("Storage error", { status: 500 });
        }
        const { data: row, error } = await admin.from("whatsapp_webhook_events")
          .select("id,event,payload,attempts,processed_at").eq("delivery_id", deliveryId).single();
        if (error || !row) return new Response("Storage error", { status: 500 });

        if (!row.processed_at) {
          const r = await processarEvento(admin, row);
          // Status ainda sem mensagem: fica pendente e será aplicado depois
          if (!r.ok && !r.pending) return new Response("Processing error", { status: 500 });
        }

        // Recuperação: aplica alguns eventos que ficaram pendentes
        await processarPendentes(admin, 3, row.id);
        return new Response("ok");
      },
    },
  },
});
