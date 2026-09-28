import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listarCredenciaisWhatsapp = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { listarNomesCredenciais } = await import("./whatsapp.server");
    return listarNomesCredenciais();
  });

async function enviarParaContato(sb: any, userId: string, contatoId: string, texto: string) {
  // RLS garante que o contato pertence à empresa do usuário
  const { data: contato, error } = await sb.from("whatsapp_contatos")
    .select("id, empresa_id, wa_id, lead_id, numero:whatsapp_numeros(id, secret_name, ativo)")
    .eq("id", contatoId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!contato) throw new Error("Contato não encontrado");
  if (!contato.numero?.ativo) throw new Error("O número de WhatsApp desta empresa está inativo");

  const { enviarTextoGateway, processarPendentes, registrarInteracaoLead } = await import("./whatsapp.server");
  const r = await enviarTextoGateway(contato.numero.secret_name, contato.wa_id, texto);

  const agora = new Date().toISOString();
  const ins = await sb.from("whatsapp_mensagens").insert({
    empresa_id: contato.empresa_id,
    numero_id: contato.numero.id,
    contato_id: contato.id,
    direcao: "saida",
    wa_message_id: r.ok ? r.id ?? null : null,
    conteudo: texto,
    status: r.ok ? "accepted" : "failed",
    erro: r.ok ? null : r.erro,
    enviado_por: userId,
    provider_timestamp: agora,
  });
  if (ins.error) throw new Error(ins.error.message);
  await sb.from("whatsapp_contatos").update({ ultima_mensagem_em: agora }).eq("id", contato.id);

  if (!r.ok) throw new Error(`Falha no envio: ${r.erro}`);
  await registrarInteracaoLead(sb, contato.lead_id, "saida", texto, agora, userId);
  // Aplica status que chegaram antes do registro da mensagem
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await processarPendentes(supabaseAdmin as any, 5);
  return { ok: true };
}

export const enviarMensagemWhatsapp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ contatoId: z.string().uuid(), texto: z.string().trim().min(1).max(4096) }).parse(d))
  .handler(async ({ data, context }) => enviarParaContato(context.supabase as any, context.userId, data.contatoId, data.texto));

export const enviarWhatsappLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ leadId: z.string().uuid(), texto: z.string().trim().min(1).max(4096) }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    const { data: lead, error } = await sb.from("leads").select("id, empresa_id, nome, telefone").eq("id", data.leadId).maybeSingle();
    if (error) throw new Error(error.message);
    if (!lead) throw new Error("Lead não encontrado");

    let { data: contato } = await sb.from("whatsapp_contatos").select("id").eq("lead_id", lead.id).limit(1).maybeSingle();
    if (!contato) {
      let fone = String(lead.telefone ?? "").replace(/\D/g, "");
      if (!fone) throw new Error("O lead não tem telefone cadastrado");
      if (fone.length <= 11) fone = `55${fone}`;
      const { data: numero } = await sb.from("whatsapp_numeros").select("id").eq("empresa_id", lead.empresa_id).eq("ativo", true).order("created_at").limit(1).maybeSingle();
      if (!numero) throw new Error("Nenhum número de WhatsApp ativo nesta empresa");
      const { data: existente } = await sb.from("whatsapp_contatos").select("id, lead_id").eq("numero_id", numero.id).eq("wa_id", fone).maybeSingle();
      if (existente) {
        if (!existente.lead_id) await sb.from("whatsapp_contatos").update({ lead_id: lead.id }).eq("id", existente.id);
        contato = existente;
      } else {
        const ins = await sb.from("whatsapp_contatos").insert({ empresa_id: lead.empresa_id, numero_id: numero.id, wa_id: fone, nome: lead.nome, lead_id: lead.id, status: "crm" }).select("id").single();
        if (ins.error) throw new Error(ins.error.message);
        contato = ins.data;
      }
    }
    return enviarParaContato(sb, context.userId, contato.id, data.texto);
  });
