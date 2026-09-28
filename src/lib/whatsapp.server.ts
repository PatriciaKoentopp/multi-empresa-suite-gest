// Lógica de servidor do WhatsApp Business (envio via gateway + processamento do webhook).
import type { SupabaseClient } from "@supabase/supabase-js";

export const GATEWAY_URL = "https://connector-gateway.lovable.dev/whatsapp";
const SECRET_NAME_RE = /^WHATSAPP_API_KEY(_\d+)?$/;
const MAX_ATTEMPTS = 30;

export function listarNomesCredenciais(): string[] {
  return Object.keys(process.env).filter((k) => SECRET_NAME_RE.test(k)).sort();
}

export function lerCredencial(secretName: string): string {
  if (!SECRET_NAME_RE.test(secretName)) throw new Error("Credencial inválida");
  const v = process.env[secretName];
  if (!v) throw new Error(`Credencial ${secretName} não está configurada`);
  return v;
}

export async function enviarTextoGateway(secretName: string, to: string, texto: string) {
  const LOVABLE_API_KEY = process.env["LOVABLE_API_KEY"];
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");
  const key = lerCredencial(secretName);
  const res = await fetch(`${GATEWAY_URL}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: to.replace(/\D/g, ""),
      type: "text",
      text: { body: texto },
    }),
  });
  const body = await res.text();
  if (!res.ok) {
    console.error(`WhatsApp envio falhou [${res.status}]: ${body}`);
    return { ok: false as const, erro: `[${res.status}] ${body}` };
  }
  const json = JSON.parse(body);
  return { ok: true as const, id: json?.messages?.[0]?.id as string | undefined };
}

class PendingError extends Error {}

const RANK: Record<string, number> = { accepted: 0, sent: 1, delivered: 2, read: 3, failed: 4 };

function tsFromUnix(t: any): string | null {
  const n = Number(t);
  return Number.isFinite(n) && n > 0 ? new Date(n * 1000).toISOString() : null;
}

function textoMensagem(m: any): { tipo: string; conteudo: string } {
  const tipo = m.type ?? "text";
  if (tipo === "text") return { tipo, conteudo: m.text?.body ?? "" };
  if (tipo === "button") return { tipo, conteudo: m.button?.text ?? "" };
  if (tipo === "interactive")
    return { tipo, conteudo: m.interactive?.button_reply?.title ?? m.interactive?.list_reply?.title ?? "" };
  if (tipo === "reaction") return { tipo, conteudo: `Reagiu ${m.reaction?.emoji ?? ""}` };
  if (tipo === "location") return { tipo, conteudo: `Localização: ${m.location?.latitude}, ${m.location?.longitude}` };
  const media = m[tipo];
  const legenda = media?.caption || media?.filename || "";
  const rotulos: Record<string, string> = { image: "Imagem", audio: "Áudio", video: "Vídeo", document: "Documento", sticker: "Figurinha" };
  return { tipo, conteudo: `[${rotulos[tipo] ?? tipo}${media?.id ? ` ${media.id}` : ""}]${legenda ? ` ${legenda}` : ""}` };
}

export function dataSP(iso: string): string {
  return new Date(new Date(iso).getTime() - 3 * 3600 * 1000).toISOString().slice(0, 10);
}

/** Registra mensagem do WhatsApp como interação do lead e atualiza o último contato. */
export async function registrarInteracaoLead(db: SupabaseClient<any>, leadId: string | null | undefined, direcao: "entrada" | "saida", texto: string, quandoIso: string, responsavelId?: string | null) {
  if (!leadId) return;
  const data = dataSP(quandoIso);
  const ins = await db.from("leads_interacoes").insert({
    lead_id: leadId,
    tipo: "whatsapp",
    descricao: `${direcao === "entrada" ? "Recebida" : "Enviada"}: ${texto}`,
    data,
    responsavel_id: responsavelId ?? null,
    status: "Realizado",
  });
  if (ins.error) throw ins.error;
  await db.from("leads").update({ ultimo_contato: data }).eq("id", leadId);
}

async function obterOrigemWhatsapp(admin: SupabaseClient<any>, empresaId: string): Promise<string | null> {
  const { data, error } = await admin.from("origens").select("id").eq("empresa_id", empresaId).ilike("nome", "whatsapp").limit(1);
  if (error) throw error;
  if (data?.[0]) return data[0].id;
  const ins = await admin.from("origens").insert({ empresa_id: empresaId, nome: "WhatsApp", status: "ativo" }).select("id").single();
  if (ins.error) throw ins.error;
  return ins.data.id;
}

async function obterEtapaPadrao(admin: SupabaseClient<any>, numero: any) {
  if (numero.funil_id && numero.etapa_id) return { funil_id: numero.funil_id, etapa_id: numero.etapa_id };
  let funilId = numero.funil_id as string | null;
  if (!funilId) {
    const { data, error } = await admin.from("funis").select("id").eq("empresa_id", numero.empresa_id).eq("ativo", true).order("created_at").limit(1);
    if (error) throw error;
    funilId = data?.[0]?.id ?? null;
  }
  if (!funilId) return null;
  const { data: etapas, error } = await admin.from("funil_etapas").select("id").eq("funil_id", funilId).order("ordem").limit(1);
  if (error) throw error;
  if (!etapas?.[0]) return null;
  return { funil_id: funilId, etapa_id: etapas[0].id };
}

async function processarMensagens(admin: SupabaseClient<any>, value: any) {
  const phoneNumberId = value?.metadata?.phone_number_id;
  if (!phoneNumberId) return;
  const { data: numero, error: nErr } = await admin.from("whatsapp_numeros").select("*").eq("phone_number_id", phoneNumberId).maybeSingle();
  if (nErr) throw nErr;
  if (!numero || !numero.ativo) return; // número não implantado: evento fica guardado

  const nomes = new Map<string, string>();
  for (const c of value.contacts ?? []) if (c?.wa_id) nomes.set(c.wa_id, c.profile?.name ?? "");

  for (const m of value.messages ?? []) {
    const from: string = m.from ?? "";
    // Grupos são sempre ignorados
    if (!from || m.group_id || m.context?.group_id || from.includes("-") || from.includes("@g.us")) continue;

    let { data: contato, error } = await admin.from("whatsapp_contatos").select("*").eq("numero_id", numero.id).eq("wa_id", from).maybeSingle();
    if (error) throw error;
    const nome = nomes.get(from) || null;
    if (!contato) {
      const ins = await admin.from("whatsapp_contatos")
        .upsert({ empresa_id: numero.empresa_id, numero_id: numero.id, wa_id: from, nome, status: "crm" }, { onConflict: "numero_id,wa_id", ignoreDuplicates: false })
        .select("*").single();
      if (ins.error) throw ins.error;
      contato = ins.data;
    }

    // Regra: interações ficam no lead aberto; sem lead aberto, abre um novo lead
    let leadAnterior: any = null;
    if (contato.status === "crm" && contato.lead_id) {
      const { data: l } = await admin.from("leads").select("id, status, nome, telefone, favorecido_id").eq("id", contato.lead_id).maybeSingle();
      if (l && l.status === "ativo") leadAnterior = null;
      else { leadAnterior = l; contato.lead_id = null; }
    }
    if (contato.status === "crm" && !contato.lead_id) {
      const etapa = await obterEtapaPadrao(admin, numero);
      if (etapa) {
        const leadIns = await admin.from("leads").insert({
          empresa_id: numero.empresa_id,
          funil_id: etapa.funil_id,
          etapa_id: etapa.etapa_id,
          nome: leadAnterior?.nome || contato.nome || nome || `+${from}`,
          telefone: leadAnterior?.telefone || from,
          favorecido_id: leadAnterior?.favorecido_id ?? null,
          observacoes: "Lead criado automaticamente pelo WhatsApp",
          origem_id: await obterOrigemWhatsapp(admin, numero.empresa_id),
          status: "ativo",
        }).select("id").single();
        if (leadIns.error) throw leadIns.error;
        const up = await admin.from("whatsapp_contatos").update({ lead_id: leadIns.data.id }).eq("id", contato.id);
        if (up.error) throw up.error;
        contato.lead_id = leadIns.data.id;
      }
    }

    const { tipo, conteudo } = textoMensagem(m);
    const quando = tsFromUnix(m.timestamp) ?? new Date().toISOString();
    const msgIns = await admin.from("whatsapp_mensagens")
      .upsert({
        empresa_id: numero.empresa_id,
        numero_id: numero.id,
        contato_id: contato.id,
        direcao: "entrada",
        wa_message_id: m.id,
        tipo,
        conteudo,
        status: "received",
        provider_timestamp: quando,
      }, { onConflict: "wa_message_id", ignoreDuplicates: true })
      .select("id");
    if (msgIns.error) throw msgIns.error;
    if ((msgIns.data?.length ?? 0) > 0) {
      const up = await admin.from("whatsapp_contatos").update({
        ultima_mensagem_em: quando,
        nao_lidas: (contato.nao_lidas ?? 0) + 1,
        ...(nome && !contato.nome ? { nome } : {}),
      }).eq("id", contato.id);
      if (up.error) throw up.error;
      await registrarInteracaoLead(admin, contato.lead_id, "entrada", conteudo, quando);
    }
  }
}

async function processarStatus(admin: SupabaseClient<any>, value: any) {
  for (const s of value.statuses ?? []) {
    const { data: msg, error } = await admin.from("whatsapp_mensagens").select("id,status,status_timestamps,erro").eq("wa_message_id", s.id).maybeSingle();
    if (error) throw error;
    if (!msg) throw new PendingError(`Mensagem ${s.id} ainda não registrada`);
    const ts = tsFromUnix(s.timestamp);
    const timestamps = { ...(msg.status_timestamps ?? {}) } as Record<string, string>;
    if (ts && !timestamps[s.status]) timestamps[s.status] = ts;
    const novoStatus = (RANK[s.status] ?? -1) > (RANK[msg.status] ?? -1) ? s.status : msg.status;
    const erro = s.errors?.length ? s.errors.map((e: any) => `${e.code ?? ""} ${e.title ?? ""} ${e.message ?? e.error_data?.details ?? ""}`.trim()).join("; ") : msg.erro;
    const up = await admin.from("whatsapp_mensagens").update({ status: novoStatus, status_timestamps: timestamps, erro }).eq("id", msg.id);
    if (up.error) throw up.error;
  }
}

export async function processarEvento(admin: SupabaseClient<any>, row: { id: string; event: string; payload: any; attempts: number }) {
  const value = row.payload?.entry?.[0]?.changes?.[0]?.value;
  try {
    if (row.event === "whatsapp.message") await processarMensagens(admin, value);
    else if (row.event === "whatsapp.status") await processarStatus(admin, value);
    const { error } = await admin.from("whatsapp_webhook_events").update({ processed_at: new Date().toISOString(), processing_error: null }).eq("id", row.id);
    if (error) throw error;
    return { ok: true, pending: false };
  } catch (e: any) {
    const pending = e instanceof PendingError;
    const attempts = row.attempts + 1;
    await admin.from("whatsapp_webhook_events").update({
      attempts,
      processing_error: String(e?.message ?? e),
      // desiste após muitas tentativas para não bloquear a fila
      ...(attempts >= MAX_ATTEMPTS ? { processed_at: new Date().toISOString() } : {}),
    }).eq("id", row.id);
    return { ok: false, pending, error: String(e?.message ?? e) };
  }
}

/** Reprocessa eventos pendentes (menos tentativas primeiro, para não travar a fila). */
export async function processarPendentes(admin: SupabaseClient<any>, limite = 5, excluirId?: string) {
  let q = admin.from("whatsapp_webhook_events").select("id,event,payload,attempts")
    .is("processed_at", null).lt("attempts", MAX_ATTEMPTS)
    .order("attempts", { ascending: true }).order("received_at", { ascending: true }).limit(limite);
  if (excluirId) q = q.neq("id", excluirId);
  const { data, error } = await q;
  if (error) { console.error("Erro ao buscar pendentes WhatsApp", error); return; }
  for (const row of data ?? []) await processarEvento(admin, row);
}
