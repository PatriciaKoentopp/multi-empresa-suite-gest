import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listarCredenciaisWhatsapp = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { listarNomesCredenciais } = await import("./whatsapp.server");
    return listarNomesCredenciais();
  });

export const enviarMensagemWhatsapp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ contatoId: z.string().uuid(), texto: z.string().trim().min(1).max(4096) }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    // RLS garante que o contato pertence à empresa do usuário
    const { data: contato, error } = await sb.from("whatsapp_contatos")
      .select("id, empresa_id, wa_id, numero:whatsapp_numeros(id, secret_name, ativo)")
      .eq("id", data.contatoId).maybeSingle();
    if (error) throw new Error(error.message);
    if (!contato) throw new Error("Contato não encontrado");
    if (!contato.numero?.ativo) throw new Error("O número de WhatsApp desta empresa está inativo");

    const { enviarTextoGateway, processarPendentes } = await import("./whatsapp.server");
    const r = await enviarTextoGateway(contato.numero.secret_name, contato.wa_id, data.texto);

    const agora = new Date().toISOString();
    const ins = await sb.from("whatsapp_mensagens").insert({
      empresa_id: contato.empresa_id,
      numero_id: contato.numero.id,
      contato_id: contato.id,
      direcao: "saida",
      wa_message_id: r.ok ? r.id ?? null : null,
      conteudo: data.texto,
      status: r.ok ? "accepted" : "failed",
      erro: r.ok ? null : r.erro,
      enviado_por: context.userId,
      provider_timestamp: agora,
    });
    if (ins.error) throw new Error(ins.error.message);
    await sb.from("whatsapp_contatos").update({ ultima_mensagem_em: agora }).eq("id", contato.id);

    // Aplica status que chegaram antes do registro da mensagem
    if (r.ok) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await processarPendentes(supabaseAdmin as any, 5);
    }
    if (!r.ok) throw new Error(`Falha no envio: ${r.erro}`);
    return { ok: true };
  });
