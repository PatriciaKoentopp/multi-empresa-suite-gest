import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, UserMinus, UserPlus, ExternalLink, Check, CheckCheck, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { useServerFn } from "@tanstack/react-start";
import { enviarMensagemWhatsapp } from "@/lib/whatsapp.functions";
import { useNavigate } from "@/lib/router-compat";

interface Contato { id: string; wa_id: string; nome: string | null; lead_id: string | null; status: string; ultima_mensagem_em: string | null; nao_lidas: number; numero_id: string }
interface Mensagem { id: string; direcao: string; conteudo: string | null; status: string; erro: string | null; created_at: string; provider_timestamp: string | null }

const pad = (n: number) => String(n).padStart(2, "0");
function formatarDataHora(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function WhatsappPage() {
  const { currentCompany } = useCompany();
  const db = supabase as any;
  const navigate = useNavigate();
  const enviar = useServerFn(enviarMensagemWhatsapp);
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [filtro, setFiltro] = useState<"crm" | "fora" | "todos">("crm");
  const [busca, setBusca] = useState("");
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [temNumero, setTemNumero] = useState(true);
  const fimRef = useRef<HTMLDivElement>(null);

  const carregarContatos = async () => {
    if (!currentCompany?.id) return;
    const { data, error } = await db.from("whatsapp_contatos").select("*").eq("empresa_id", currentCompany.id)
      .order("ultima_mensagem_em", { ascending: false, nullsFirst: false });
    if (error) return toast.error("Erro ao carregar conversas", { description: error.message });
    setContatos(data ?? []);
  };

  const carregarMensagens = async (id: string) => {
    const { data } = await db.from("whatsapp_mensagens").select("*").eq("contato_id", id).order("created_at");
    setMensagens(data ?? []);
    await db.from("whatsapp_contatos").update({ nao_lidas: 0 }).eq("id", id);
  };

  useEffect(() => {
    if (!currentCompany?.id) return;
    carregarContatos();
    db.from("whatsapp_numeros").select("id", { count: "exact", head: true }).eq("empresa_id", currentCompany.id)
      .then(({ count }: any) => setTemNumero((count ?? 0) > 0));
  }, [currentCompany?.id]);

  useEffect(() => { if (selecionado) carregarMensagens(selecionado); else setMensagens([]); }, [selecionado]);

  useEffect(() => {
    if (!currentCompany?.id) return;
    const channel = supabase.channel(`whatsapp-${currentCompany.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "whatsapp_mensagens", filter: `empresa_id=eq.${currentCompany.id}` }, (p: any) => {
        const row = (p.new ?? p.old) as any;
        if (row?.contato_id && row.contato_id === selecionadoRef.current) carregarMensagens(row.contato_id);
        carregarContatos();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentCompany?.id]);

  const selecionadoRef = useRef<string | null>(null);
  useEffect(() => { selecionadoRef.current = selecionado; }, [selecionado]);
  useEffect(() => { fimRef.current?.scrollIntoView({ behavior: "smooth" }); }, [mensagens]);

  const lista = useMemo(() => contatos.filter((c) =>
    (filtro === "todos" || c.status === filtro) &&
    (!busca || (c.nome ?? "").toLowerCase().includes(busca.toLowerCase()) || c.wa_id.includes(busca.replace(/\D/g, "") || "#"))
  ), [contatos, filtro, busca]);

  const contato = contatos.find((c) => c.id === selecionado) ?? null;

  const handleEnviar = async () => {
    if (!contato || !texto.trim()) return;
    setEnviando(true);
    try {
      await enviar({ data: { contatoId: contato.id, texto: texto.trim() } });
      setTexto("");
    } catch (e: any) {
      toast.error("Não foi possível enviar", { description: String(e?.message ?? e).slice(0, 300) });
    } finally {
      setEnviando(false);
      carregarMensagens(contato.id);
    }
  };

  const alterarStatus = async (novo: "crm" | "fora") => {
    if (!contato) return;
    const { error } = await db.from("whatsapp_contatos").update({ status: novo }).eq("id", contato.id);
    if (error) return toast.error("Erro ao atualizar contato", { description: error.message });
    if (contato.lead_id) await db.from("leads").update({ status: novo === "fora" ? "inativo" : "ativo" }).eq("id", contato.lead_id);
    toast.success(novo === "fora" ? "Contato retirado do CRM" : "Contato devolvido ao CRM");
    carregarContatos();
  };

  const IconeStatus = ({ m }: { m: Mensagem }) => {
    if (m.direcao !== "saida") return null;
    if (m.status === "failed") return <span title={m.erro ?? ""}><AlertCircle className="h-3 w-3 text-red-500" /></span>;
    if (m.status === "read") return <CheckCheck className="h-3 w-3 text-blue-500" />;
    if (m.status === "delivered") return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
    return <Check className="h-3 w-3 text-muted-foreground" />;
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div>
          <h2 className="text-xl font-semibold text-foreground leading-tight">WhatsApp</h2>
          <p className="text-sm text-muted-foreground">Conversas recebidas no WhatsApp Business da empresa</p>
        </div>
      </div>

      {!temNumero && (
        <Card className="p-4 mb-4 text-sm">
          Nenhum número de WhatsApp implantado nesta empresa.{" "}
          <button className="text-blue-600 underline" onClick={() => navigate("/crm/whatsapp-implantacao")}>Fazer a implantação</button>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-220px)] min-h-[500px]">
        <Card className="flex flex-col overflow-hidden">
          <div className="p-3 border-b space-y-2">
            <Select value={filtro} onValueChange={(v: any) => setFiltro(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="crm">No CRM</SelectItem>
                <SelectItem value="fora">Fora do CRM</SelectItem>
                <SelectItem value="todos">Todos</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Buscar nome ou número" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
          <div className="flex-1 overflow-y-auto">
            {lista.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhuma conversa</p>}
            {lista.map((c) => (
              <button key={c.id} onClick={() => setSelecionado(c.id)}
                className={`w-full text-left px-3 py-2 border-b hover:bg-muted/50 ${selecionado === c.id ? "bg-muted" : ""}`}>
                <div className="flex justify-between items-center gap-2">
                  <span className="font-medium text-sm truncate">{c.nome || `+${c.wa_id}`}</span>
                  {c.nao_lidas > 0 && <Badge className="bg-green-600">{c.nao_lidas}</Badge>}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>+{c.wa_id}</span>
                  <span>{formatarDataHora(c.ultima_mensagem_em)}</span>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="md:col-span-2 flex flex-col overflow-hidden">
          {!contato ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">Selecione uma conversa</div>
          ) : (
            <>
              <div className="p-3 border-b flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-medium">{contato.nome || `+${contato.wa_id}`}</div>
                  <div className="text-xs text-muted-foreground">+{contato.wa_id} · {contato.status === "crm" ? "No CRM" : "Fora do CRM"}</div>
                </div>
                <div className="flex gap-2">
                  {contato.lead_id && (
                    <Button variant="outline" size="sm" onClick={() => navigate(`/crm/leads?leadId=${contato.lead_id}`)}>
                      <ExternalLink className="mr-1 h-4 w-4 text-blue-500" /> Ver lead
                    </Button>
                  )}
                  {contato.status === "crm" ? (
                    <Button variant="outline" size="sm" onClick={() => alterarStatus("fora")}><UserMinus className="mr-1 h-4 w-4 text-red-500" /> Retirar do CRM</Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => alterarStatus("crm")}><UserPlus className="mr-1 h-4 w-4 text-green-600" /> Voltar ao CRM</Button>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-muted/30">
                {mensagens.map((m) => (
                  <div key={m.id} className={`flex ${m.direcao === "saida" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm shadow-sm ${m.direcao === "saida" ? "bg-green-100 dark:bg-green-900/40" : "bg-background"}`}>
                      <div className="whitespace-pre-wrap break-words">{m.conteudo}</div>
                      <div className="flex items-center justify-end gap-1 text-[10px] text-muted-foreground mt-1">
                        {formatarDataHora(m.provider_timestamp ?? m.created_at)} <IconeStatus m={m} />
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={fimRef} />
              </div>
              <div className="p-3 border-t flex gap-2">
                <Textarea rows={2} placeholder="Digite uma mensagem" value={texto} onChange={(e) => setTexto(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEnviar(); } }} />
                <Button variant="blue" onClick={handleEnviar} disabled={enviando || !texto.trim()}><Send className="h-4 w-4" /></Button>
              </div>
            </>
          )}
        </Card>
      </div>
      <p className="text-xs text-muted-foreground mt-2">Respostas livres só podem ser enviadas até 24 horas após a última mensagem do cliente (regra do WhatsApp).</p>
    </div>
  );
}
