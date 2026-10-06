import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listarCredenciaisMetaFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { listarCredenciaisMeta } = await import("./meta.server");
    return listarCredenciaisMeta();
  });

export const enviarMensagemMeta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ contatoId: z.string().uuid(), texto: z.string().trim().min(1).max(2000) }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    // RLS garante que o contato pertence à empresa do usuário
    const { data: contato, error } = await sb.from("meta_contatos")
      .select("id, empresa_id, sender_id, lead_id, conta:meta_contas(id, canal, secret_name, ativo)")
      .eq("id", data.contatoId).maybeSingle();
    if (error) throw new Error(error.message);
    if (!contato) throw new Error("Contato não encontrado");
    if (!contato.conta?.ativo) throw new Error("A conta desta empresa está inativa");

    const { enviarTextoMeta, registrarInteracaoMeta } = await import("./meta.server");
    const r = await enviarTextoMeta(contato.conta.secret_name, contato.sender_id, data.texto);
    const agora = new Date().toISOString();
    await sb.from("meta_mensagens").insert({
      empresa_id: contato.empresa_id, contato_id: contato.id, direcao: "saida",
      mid: r.ok ? r.id ?? null : null, conteudo: data.texto, status: r.ok ? "sent" : "failed",
      erro: r.ok ? null : r.erro, enviado_por: context.userId, provider_timestamp: agora,
    });
    await sb.from("meta_contatos").update({ ultima_mensagem_em: agora }).eq("id", contato.id);
    if (!r.ok) throw new Error(`Falha no envio: ${r.erro}`);
    await registrarInteracaoMeta(sb, contato.lead_id, contato.conta.canal, agora, context.userId);
    return { ok: true };
  });
