import { useEffect, useState } from "react";
import { format, startOfMonth, endOfMonth, addMonths } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarCheck, Link2, RefreshCw, Unlink } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import {
  concluirConexaoGoogle, definirAgendaGoogle, desconectarGoogleAgenda, iniciarConexaoGoogle,
  sincronizarGoogleAgenda, statusGoogleAgenda,
} from "@/lib/google-agenda.functions";

type Status = Awaited<ReturnType<typeof statusGoogleAgenda>>;

const fmtDataHora = (iso?: string | null) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${format(d, "dd/MM/yyyy HH:mm")}`;
};

export function esperarOAuth(popup: Window) {
  return new Promise<string | null>((resolve, reject) => {
    let poll: number | undefined;
    const limpar = () => { window.removeEventListener("message", onMsg); if (poll !== undefined) window.clearInterval(poll); };
    const onMsg = (e: MessageEvent) => {
      const t = e.data?.type;
      if (e.origin !== window.location.origin || e.source !== popup || e.data?.connectorId !== "google_calendar"
        || (t !== "appUserConnectorOAuthComplete" && t !== "appUserConnectorOAuthFailed")) return;
      limpar();
      if (t === "appUserConnectorOAuthComplete") resolve(typeof e.data?.code === "string" ? e.data.code : null);
      else { popup.close(); reject(new Error("A conexão com o Google falhou.")); }
    };
    window.addEventListener("message", onMsg);
    poll = window.setInterval(() => { if (!popup.closed) return; limpar(); reject(new Error("A janela do Google foi fechada antes de concluir.")); }, 500);
  });
}

export default function GoogleAgendaPage() {
  const status = useServerFn(statusGoogleAgenda);
  const iniciar = useServerFn(iniciarConexaoGoogle);
  const concluir = useServerFn(concluirConexaoGoogle);
  const desconectar = useServerFn(desconectarGoogleAgenda);
  const definir = useServerFn(definirAgendaGoogle);
  const sincronizar = useServerFn(sincronizarGoogleAgenda);
  const [st, setSt] = useState<Status | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const carregar = async () => {
    try { setSt(await status()); } catch (e: any) { toast.error("Erro ao consultar o Google Agenda", { description: e.message }); }
  };
  useEffect(() => { carregar(); }, []);

  const conectar = async () => {
    const popup = window.open("", "google-agenda-oauth", "width=600,height=720");
    if (!popup) return toast.error("O navegador bloqueou a janela. Libere pop-ups e tente de novo.");
    setOcupado(true);
    try {
      const { authorizationUrl } = await iniciar();
      const espera = esperarOAuth(popup);
      popup.location.href = authorizationUrl;
      const code = await espera;
      if (code) await concluir({ data: { code } });
      toast.success(st?.reconectar ? "Google Agenda reconectado" : "Google Agenda conectado");
      await carregar();
    } catch (e: any) {
      popup.close();
      toast.error("Não foi possível conectar", { description: e.message });
    } finally { setOcupado(false); }
  };

  const sairGoogle = async () => {
    setOcupado(true);
    try { await desconectar(); toast.success("Google Agenda desconectado"); await carregar(); }
    catch (e: any) { toast.error("Erro ao desconectar", { description: e.message }); }
    finally { setOcupado(false); }
  };

  const trocarAgenda = async (calendarId: string) => {
    await definir({ data: { calendarId } });
    toast.success("Agenda do Google atualizada");
    await carregar();
  };

  const sincronizarAgora = async () => {
    setOcupado(true);
    try {
      const hoje = new Date();
      const r: any = await sincronizar({ data: {
        inicio: format(startOfMonth(addMonths(hoje, -1)), "yyyy-MM-dd"),
        fim: format(endOfMonth(addMonths(hoje, 2)), "yyyy-MM-dd"),
      } });
      if (!r.conectado) toast.error("Conecte sua conta Google novamente");
      else toast.success("Sincronização concluída", { description: `${r.enviados} enviadas, ${r.importados} importadas, ${r.atualizados} atualizadas, ${r.removidos} removidas.` });
      await carregar();
    } catch (e: any) { toast.error("Erro na sincronização", { description: e.message }); }
    finally { setOcupado(false); }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Implantação Google Agenda</h1>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><CalendarCheck className="h-5 w-5 text-blue-600" /> Minha conta Google</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {!st ? <p className="text-sm text-muted-foreground">Carregando...</p> : (
            <>
              <div className="flex items-center gap-2 text-sm">
                <span>Situação:</span>
                {st.conectado ? <Badge className="bg-green-100 text-green-800 border-green-200">Conectado</Badge>
                  : st.reconectar ? <Badge className="bg-amber-100 text-amber-800 border-amber-200">Precisa reconectar</Badge>
                  : <Badge variant="outline">Não conectado</Badge>}
                {st.email && <span className="text-muted-foreground">({st.email})</span>}
              </div>
              {st.reconectar && <p className="text-sm text-muted-foreground">Seu acesso ao Google Agenda precisa ser renovado.</p>}
              {st.conectado && (
                <>
                  <div className="max-w-md space-y-1">
                    <Label>Agenda usada na sincronização</Label>
                    <Select value={st.calendarId} onValueChange={trocarAgenda}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{st.agendas.map((a) => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <p className="text-sm">Última sincronização: <span className="font-medium">{fmtDataHora(st.ultimaSync)}</span></p>
                </>
              )}
              <div className="flex flex-wrap gap-2">
                {!st.conectado && (
                  <Button variant="blue" onClick={conectar} disabled={ocupado}>
                    <Link2 className="mr-2 h-4 w-4" /> {st.reconectar ? "Reconectar" : "Conectar minha conta Google"}
                  </Button>
                )}
                {st.conectado && (
                  <>
                    <Button variant="blue" onClick={sincronizarAgora} disabled={ocupado}><RefreshCw className="mr-2 h-4 w-4" /> Sincronizar agora</Button>
                    <Button variant="outline" onClick={conectar} disabled={ocupado}><Link2 className="mr-2 h-4 w-4" /> Reconectar</Button>
                    <Button variant="outline" onClick={sairGoogle} disabled={ocupado} className="text-red-600"><Unlink className="mr-2 h-4 w-4" /> Desconectar</Button>
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                A conexão é individual: cada usuário liga a própria conta. As tarefas criadas no app vão para o Google e os eventos do Google aparecem na Agenda Pessoal.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
