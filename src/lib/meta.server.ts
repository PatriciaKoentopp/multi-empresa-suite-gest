// Lógica de servidor do Instagram/Facebook Messenger (Graph API da Meta).
import type { SupabaseClient } from "@supabase/supabase-js";
import { dataSP } from "./whatsapp.server";

const SECRET_NAME_RE = /^META_PAGE_TOKEN(_\d+)?$/;
const GRAPH = "https://graph.facebook.com/v21.0";

export function listarCredenciaisMeta(): string[] {
  return Object.keys(process.env).filter((k) => SECRET_NAME_RE.test(k)).sort();
}

function lerToken(secretName: string): string {
  if (!SECRET_NAME_RE.test(secretName)) throw new Error("Credencial inválida");
  const v = process.env[secretName];
  if (!v) throw new Error(`Credencial ${secretName} não está configurada`);
  return v;
}

export async function enviarTextoMeta(secretName: string, recipientId: string, texto: string) {
  const token = lerToken(secretName);
  const res = await fetch(`${GRAPH}/me/messages?access_token=${encodeURIComponent(token)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipient: { id: recipientId }, messaging_type: "RESPONSE", message: { text: texto } }),
  });
  const body = await res.text();
  if (!res.ok) {
    console.error(`Meta envio falhou [${res.status}]: ${body}`);
    return { ok: false as const, erro: `[${res.status}] ${body}` };
  }
  return { ok: true as const, id: JSON.parse(body)?.message_id as string | undefined };
}

export async function registrarInteracaoMeta(db: SupabaseClient<any>, leadId: string | null | undefined, canal: string, quandoIso: string, responsavelId?: string | null) {
  if (!leadId) return;
  const data = dataSP(quandoIso);
  const { data: existentes } = await db.from("leads_interacoes").select("id").eq("lead_id", leadId).eq("tipo", canal).limit(1);
  if (!existentes || existentes.length === 0) {
    await db.from("leads_interacoes").insert({
      lead_id: leadId, tipo: canal, data, responsavel_id: responsavelId ?? null, status: "Realizado",
      descricao: `Início da conversa pelo ${canal === "instagram" ? "Instagram" : "Facebook"}`,
    });
  }
  await db.from("leads").update({ ultimo_contato: data }).eq("id", leadId);
}

async function obterOrigem(admin: SupabaseClient<any>, empresaId: string, canal: string) {
  const nome = canal === "instagram" ? "Instagram" : "Facebook";
  const { data } = await admin.from("origens").select("id").eq("empresa_id", empresaId).ilike("nome", nome).limit(1);
  if (data?.[0]) return data[0].id as string;
  const ins = await admin.from("origens").insert({ empresa_id: empresaId, nome, status: "ativo" }).select("id").single();
  if (ins.error) throw ins.error;
  return ins.data.id as string;
}

async function obterEtapa(admin: SupabaseClient<any>, conta: any) {
  if (conta.funil_id && conta.etapa_id) return { funil_id: conta.funil_id, etapa_id: conta.etapa_id };
  let funilId = conta.funil_id as string | null;
  if (!funilId) {
    const { data } = await admin.from("funis").select("id").eq("empresa_id", conta.empresa_id).eq("ativo", true).order("created_at").limit(1);
    funilId = data?.[0]?.id ?? null;
  }
  if (!funilId) return null;
  const { data: etapas } = await admin.from("funil_etapas").select("id").eq("funil_id", funilId).order("ordem").limit(1);
  return etapas?.[0] ? { funil_id: funilId, etapa_id: etapas[0].id } : null;
}

async function buscarNome(conta: any, senderId: string): Promise<string | null> {
  try {
    const token = lerToken(conta.secret_name);
    const campos = conta.canal === "instagram" ? "name,username" : "first_name,last_name";
    const r = await fetch(`${GRAPH}/${senderId}?fields=${campos}&access_token=${encodeURIComponent(token)}`);
    if (!r.ok) return null;
    const j: any = await r.json();
    return j.name || j.username || [j.first_name, j.last_name].filter(Boolean).join(" ") || null;
  } catch { return null; }
}

/** Processa o payload do webhook da Meta (object = page | instagram). */
export async function processarPayloadMeta(admin: SupabaseClient<any>, payload: any) {
  for (const entry of payload?.entry ?? []) {
    const pageId = String(entry.id ?? "");
    const recipientId = String(entry.messaging?.[0]?.recipient?.id ?? "");
    console.log(`Meta evento recebido: entry.id=${pageId} recipient.id=${recipientId}`);
    const ids = [pageId, recipientId].filter(Boolean);
    const { data: contas } = await admin.from("meta_contas").select("*").in("page_id", ids).limit(1);
    const conta = contas?.[0];
    if (!conta || !conta.ativo) { console.warn(`Meta: nenhuma conta ativa para ${ids.join(",")}`); continue; }

    for (const ev of entry.messaging ?? []) {
      const m = ev.message;
      if (!m || m.is_echo) continue;
      const senderId = String(ev.sender?.id ?? "");
      if (!senderId || senderId === pageId) continue;

      let { data: contato } = await admin.from("meta_contatos").select("*").eq("conta_id", conta.id).eq("sender_id", senderId).maybeSingle();
      if (!contato) {
        const nome = await buscarNome(conta, senderId);
        const ins = await admin.from("meta_contatos").upsert(
          { empresa_id: conta.empresa_id, conta_id: conta.id, sender_id: senderId, nome },
          { onConflict: "conta_id,sender_id" }).select("*").single();
        if (ins.error) throw ins.error;
        contato = ins.data;
      }

      // Interações ficam no lead aberto; sem lead aberto, abre um novo
      let leadAnterior: any = null;
      if (contato.lead_id) {
        const { data: l } = await admin.from("leads").select("id, status, nome, favorecido_id").eq("id", contato.lead_id).maybeSingle();
        if (!l || l.status !== "ativo") { leadAnterior = l; contato.lead_id = null; }
      }
      if (!contato.lead_id) {
        const etapa = await obterEtapa(admin, conta);
        if (etapa) {
          const leadIns = await admin.from("leads").insert({
            empresa_id: conta.empresa_id, funil_id: etapa.funil_id, etapa_id: etapa.etapa_id,
            nome: leadAnterior?.nome || contato.nome || `${conta.canal === "instagram" ? "Instagram" : "Facebook"} ${senderId.slice(-6)}`,
            favorecido_id: leadAnterior?.favorecido_id ?? null,
            observacoes: `Lead criado automaticamente pelo ${conta.canal === "instagram" ? "Instagram" : "Facebook"}`,
            origem_id: await obterOrigem(admin, conta.empresa_id, conta.canal),
            status: "ativo",
          }).select("id").single();
          if (leadIns.error) throw leadIns.error;
          await admin.from("meta_contatos").update({ lead_id: leadIns.data.id }).eq("id", contato.id);
          contato.lead_id = leadIns.data.id;
        }
      }

      const anexos = (m.attachments ?? []).map((a: any) => `[${a.type ?? "anexo"}]`).join(" ");
      const conteudo = [m.text, anexos].filter(Boolean).join(" ") || "[mensagem]";
      const quando = ev.timestamp ? new Date(Number(ev.timestamp)).toISOString() : new Date().toISOString();
      const msgIns = await admin.from("meta_mensagens").upsert({
        empresa_id: conta.empresa_id, contato_id: contato.id, direcao: "entrada", mid: m.mid ?? null,
        conteudo, status: "received", provider_timestamp: quando,
      }, { onConflict: "mid", ignoreDuplicates: true }).select("id");
      if (msgIns.error) throw msgIns.error;
      if ((msgIns.data?.length ?? 0) > 0) {
        await admin.from("meta_contatos").update({ ultima_mensagem_em: quando, nao_lidas: (contato.nao_lidas ?? 0) + 1 }).eq("id", contato.id);
        await registrarInteracaoMeta(admin, contato.lead_id, conta.canal, quando);
      }
    }
  }
}
