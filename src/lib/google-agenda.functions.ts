import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const load = () => import("./google-agenda.server");
const conector = () => import("@/integrations/lovable/appUserConnector");

export const iniciarConexaoGoogle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const s = await load();
    const { authorizeAppUserOAuth } = await conector();
    const clientKey = process.env['GOOGLE_CALENDAR_APP_USER_CONNECTOR_CLIENT_API_KEY'];
    if (!clientKey) throw new Error("Acesso do Google não configurado no projeto.");
    const request = getRequest();
    const url = new URL(request.url);
    const sandboxHost = url.hostname === "localhost" ? request.headers.get("x-forwarded-host") : null;
    const returnUrl = new URL("/oauth/google-calendar/return", sandboxHost ? `https://${sandboxHost}` : url.origin).toString();
    const chave = await s.obterChave(context.userId);
    const { authorizationUrl } = await authorizeAppUserOAuth({
      gatewayBaseUrl: s.GATEWAY_BASE_URL, connectorId: s.CONNECTOR_ID, appUserId: context.userId,
      clientAPIKey: clientKey, returnUrl, connectionAPIKey: chave ?? undefined,
      credentialsConfiguration: { scopes: s.GOOGLE_SCOPES },
    });
    return { authorizationUrl };
  });

export const concluirConexaoGoogle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ code: z.string().min(1).max(2000) }).parse(d))
  .handler(async ({ data, context }) => {
    const s = await load();
    const { exchangeAppUserOAuthCode } = await conector();
    const r = await exchangeAppUserOAuthCode(s.GATEWAY_BASE_URL, data.code);
    if (r.connectorId !== s.CONNECTOR_ID) throw new Error("Conexão retornou um serviço diferente.");
    await s.salvarChave(context.userId, r.connectionAPIKey);
    const cal = await s.google(r.connectionAPIKey, "/calendars/primary").catch(() => null);
    const atual = await s.obterConfig(context.userId);
    await s.gravarConfig(context.userId, { email: cal?.id ?? null, calendar_id: atual?.calendar_id ?? "primary" });
    return { ok: true };
  });

export const statusGoogleAgenda = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const s = await load();
    const chave = await s.obterChave(context.userId);
    if (!chave) return { conectado: false, reconectar: false, email: null, calendarId: "primary", ultimaSync: null, agendas: [] as { id: string; nome: string }[] };
    const cfg = await s.obterConfig(context.userId);
    try {
      const r = await s.google(chave, "/users/me/calendarList?minAccessRole=writer");
      const agendas = (r?.items ?? []).map((c: any) => ({ id: c.primary ? "primary" : c.id, nome: c.summary + (c.primary ? " (principal)" : "") }));
      return { conectado: true, reconectar: false, email: cfg?.email ?? null, calendarId: cfg?.calendar_id ?? "primary", ultimaSync: cfg?.ultima_sync ?? null, agendas };
    } catch (e) {
      if (e instanceof s.ReconnectError) return { conectado: false, reconectar: true, email: cfg?.email ?? null, calendarId: cfg?.calendar_id ?? "primary", ultimaSync: cfg?.ultima_sync ?? null, agendas: [] };
      throw e;
    }
  });

export const definirAgendaGoogle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ calendarId: z.string().min(1).max(300) }).parse(d))
  .handler(async ({ data, context }) => {
    const s = await load();
    await s.gravarConfig(context.userId, { calendar_id: data.calendarId });
    return { ok: true };
  });

export const desconectarGoogleAgenda = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const s = await load();
    const { disconnectAppUser } = await conector();
    const chave = await s.obterChave(context.userId);
    if (chave) await disconnectAppUser({ gatewayBaseUrl: s.GATEWAY_BASE_URL, connectionAPIKey: chave, connectorId: s.CONNECTOR_ID }).catch((e) => console.error(e));
    await s.apagarChave(context.userId);
    return { ok: true };
  });

const periodo = z.object({ inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), fim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });

export const sincronizarGoogleAgenda = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => periodo.parse(d))
  .handler(async ({ data, context }) => {
    const s = await load();
    const chave = await s.obterChave(context.userId);
    if (!chave) return { conectado: false };
    try {
      const r = await s.sincronizar(context.userId, chave, data.inicio, data.fim);
      return { conectado: true, ...r };
    } catch (e) {
      if (e instanceof s.ReconnectError) return { conectado: false, reconectar: true };
      throw e;
    }
  });

export const enviarTarefaGoogle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ tarefaId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const s = await load();
    const chave = await s.obterChave(context.userId);
    if (!chave) return { conectado: false };
    await s.enviarTarefa(context.userId, chave, data.tarefaId);
    return { conectado: true };
  });

export const removerEventoGoogle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ googleEventId: z.string().min(1).max(1024) }).parse(d))
  .handler(async ({ data, context }) => {
    const s = await load();
    const chave = await s.obterChave(context.userId);
    if (!chave) return { conectado: false };
    await s.removerEvento(context.userId, chave, data.googleEventId);
    return { conectado: true };
  });
