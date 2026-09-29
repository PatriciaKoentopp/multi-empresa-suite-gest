// Server-only: Google Agenda por usuário (chave criptografada + sincronização)
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { callAsAppUser, appUserReconnectRequired } from "@/integrations/lovable/appUserConnector";

export const GATEWAY_BASE_URL = "https://connector-gateway.lovable.dev";
export const CONNECTOR_ID = "google_calendar";
export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
];
const TZ = "America/Sao_Paulo";

async function admin(): Promise<any> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

function key(): Buffer {
  const raw = process.env['APP_USER_CONNECTION_KEY_SECRET'];
  if (!raw) throw new Error("APP_USER_CONNECTION_KEY_SECRET is not set");
  return Buffer.from(raw, "base64");
}
function encrypt(plain: string) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), ct]).toString("base64");
}
function decrypt(stored: string) {
  const buf = Buffer.from(stored, "base64");
  const d = createDecipheriv("aes-256-gcm", key(), buf.subarray(0, 12));
  d.setAuthTag(buf.subarray(12, 28));
  return Buffer.concat([d.update(buf.subarray(28)), d.final()]).toString("utf8");
}

export async function salvarChave(userId: string, chave: string) {
  const db = await admin();
  const { error } = await db.from("app_user_connections").upsert(
    { user_id: userId, connector_id: CONNECTOR_ID, connection_key_ciphertext: encrypt(chave), updated_at: new Date().toISOString() },
    { onConflict: "user_id,connector_id" },
  );
  if (error) throw error;
}
export async function obterChave(userId: string): Promise<string | null> {
  const db = await admin();
  const { data, error } = await db.from("app_user_connections").select("connection_key_ciphertext")
    .eq("user_id", userId).eq("connector_id", CONNECTOR_ID).maybeSingle();
  if (error) throw error;
  return data ? decrypt(data.connection_key_ciphertext) : null;
}
export async function apagarChave(userId: string) {
  const db = await admin();
  await db.from("app_user_connections").delete().eq("user_id", userId).eq("connector_id", CONNECTOR_ID);
  await db.from("agenda_google_config").delete().eq("user_id", userId);
}

export class ReconnectError extends Error {}

export async function google(chave: string, path: string, init?: RequestInit) {
  const res = await callAsAppUser({
    gatewayBaseUrl: GATEWAY_BASE_URL, connectionAPIKey: chave, connectorId: CONNECTOR_ID,
    path: `/calendar/v3${path}`, init: { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } },
    requiredScopes: GOOGLE_SCOPES,
  });
  if (await appUserReconnectRequired(res)) throw new ReconnectError("reconnect");
  if (res.status === 204) return null;
  const text = await res.text();
  if (!res.ok) {
    if (res.status === 404 || res.status === 410) return null;
    console.error(`Google Calendar [${res.status}]: ${text}`);
    throw new Error(`Google Agenda recusou a operação [${res.status}]: ${text.slice(0, 300)}`);
  }
  return text ? JSON.parse(text) : null;
}

export async function obterConfig(userId: string) {
  const db = await admin();
  const { data } = await db.from("agenda_google_config").select("*").eq("user_id", userId).maybeSingle();
  return data as { calendar_id: string; email: string | null; ultima_sync: string | null } | null;
}
export async function gravarConfig(userId: string, campos: Record<string, unknown>) {
  const db = await admin();
  await db.from("agenda_google_config").upsert({ user_id: userId, ...campos }, { onConflict: "user_id" });
}

// ---------- Conversões ----------
const addMin = (hhmm: string, min: number) => {
  const [h, m] = hhmm.split(":").map(Number);
  const t = Math.min(h! * 60 + m! + min, 23 * 60 + 59);
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
};
const diaSeguinte = (d: string) => {
  const dt = new Date(`${d}T12:00:00Z`); dt.setUTCDate(dt.getUTCDate() + 1);
  return dt.toISOString().slice(0, 10);
};
function localSP(iso: string) {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
    .formatToParts(new Date(iso)).reduce<Record<string, string>>((a, x) => ((a[x.type] = x.value), a), {});
  return { data: `${p.year}-${p.month}-${p.day}`, hora: `${p.hour}:${p.minute}` };
}

function tarefaParaEvento(t: any) {
  const ev: any = { summary: t.titulo, description: t.descricao ?? "" };
  if (t.hora_inicio) {
    const ini = String(t.hora_inicio).slice(0, 5);
    const fim = t.hora_fim ? String(t.hora_fim).slice(0, 5) : addMin(ini, t.duracao_min || 60);
    ev.start = { dateTime: `${t.data}T${ini}:00`, timeZone: TZ };
    ev.end = { dateTime: `${t.data}T${fim > ini ? fim : addMin(ini, 60)}:00`, timeZone: TZ };
  } else {
    ev.start = { date: t.data };
    ev.end = { date: diaSeguinte(t.data) };
  }
  return ev;
}

function eventoParaCampos(ev: any) {
  if (ev.start?.date) {
    return { titulo: ev.summary || "(sem título)", descricao: ev.description ?? null, data: ev.start.date, hora_inicio: null, hora_fim: null, duracao_min: 0 };
  }
  const ini = localSP(ev.start.dateTime), fim = localSP(ev.end?.dateTime ?? ev.start.dateTime);
  const dur = Math.max(0, Math.round((new Date(ev.end?.dateTime ?? ev.start.dateTime).getTime() - new Date(ev.start.dateTime).getTime()) / 60000));
  return {
    titulo: ev.summary || "(sem título)", descricao: ev.description ?? null, data: ini.data,
    hora_inicio: ini.hora, hora_fim: fim.data === ini.data ? fim.hora : null, duracao_min: dur,
  };
}

// ---------- App -> Google ----------
export async function enviarTarefa(userId: string, chave: string, tarefaId: string) {
  const db = await admin();
  const { data: t } = await db.from("agenda_tarefas").select("*").eq("id", tarefaId).eq("user_id", userId).maybeSingle();
  if (!t) return;
  const cal = encodeURIComponent((await obterConfig(userId))?.calendar_id ?? "primary");
  if (t.status === "cancelada") {
    if (t.google_event_id) await google(chave, `/calendars/${cal}/events/${encodeURIComponent(t.google_event_id)}`, { method: "DELETE" });
    await db.from("agenda_tarefas").update({ google_event_id: null, google_updated_at: null }).eq("id", t.id);
    return;
  }
  const corpo = JSON.stringify(tarefaParaEvento(t));
  let ev = t.google_event_id
    ? await google(chave, `/calendars/${cal}/events/${encodeURIComponent(t.google_event_id)}`, { method: "PUT", body: corpo })
    : null;
  if (!ev) ev = await google(chave, `/calendars/${cal}/events`, { method: "POST", body: corpo });
  if (ev?.id) await db.from("agenda_tarefas").update({ google_event_id: ev.id, google_updated_at: ev.updated }).eq("id", t.id);
}

export async function removerEvento(userId: string, chave: string, googleEventId: string) {
  const cal = encodeURIComponent((await obterConfig(userId))?.calendar_id ?? "primary");
  await google(chave, `/calendars/${cal}/events/${encodeURIComponent(googleEventId)}`, { method: "DELETE" });
}

// ---------- Nos dois sentidos ----------
export async function sincronizar(userId: string, chave: string, inicio: string, fim: string) {
  const db = await admin();
  const cal = encodeURIComponent((await obterConfig(userId))?.calendar_id ?? "primary");

  // 1) Tarefas do app ainda sem evento
  const { data: novas } = await db.from("agenda_tarefas").select("id").eq("user_id", userId)
    .is("google_event_id", null).neq("status", "cancelada").gte("data", inicio).lte("data", fim);
  for (const t of novas ?? []) await enviarTarefa(userId, chave, t.id);

  // 2) Eventos do Google
  const eventos: any[] = [];
  let pageToken: string | undefined;
  do {
    const q = new URLSearchParams({
      timeMin: `${inicio}T00:00:00-03:00`, timeMax: `${diaSeguinte(fim)}T00:00:00-03:00`,
      singleEvents: "true", showDeleted: "true", maxResults: "250",
    });
    if (pageToken) q.set("pageToken", pageToken);
    const r = await google(chave, `/calendars/${cal}/events?${q}`);
    eventos.push(...(r?.items ?? []));
    pageToken = r?.nextPageToken;
  } while (pageToken);

  const ids = eventos.map((e) => e.id);
  const existentes: Record<string, any> = {};
  for (let i = 0; i < ids.length; i += 50) {
    const { data } = await db.from("agenda_tarefas").select("id, google_event_id, google_updated_at")
      .eq("user_id", userId).in("google_event_id", ids.slice(i, i + 50));
    for (const t of data ?? []) existentes[t.google_event_id] = t;
  }

  let importados = 0, atualizados = 0, removidos = 0;
  for (const ev of eventos) {
    const atual = existentes[ev.id];
    if (ev.status === "cancelled") {
      if (atual) { await db.from("agenda_tarefas").delete().eq("id", atual.id); removidos++; }
      continue;
    }
    if (!ev.start) continue;
    const campos = eventoParaCampos(ev);
    if (atual) {
      if (!atual.google_updated_at || new Date(ev.updated) > new Date(atual.google_updated_at)) {
        await db.from("agenda_tarefas").update({ ...campos, google_updated_at: ev.updated }).eq("id", atual.id);
        atualizados++;
      }
    } else {
      await db.from("agenda_tarefas").insert({
        ...campos, user_id: userId, triade: "circunstancial", status: "pendente",
        google_event_id: ev.id, google_updated_at: ev.updated,
      });
      importados++;
    }
  }
  await gravarConfig(userId, { ultima_sync: new Date().toISOString() });
  return { enviados: novas?.length ?? 0, importados, atualizados, removidos };
}
