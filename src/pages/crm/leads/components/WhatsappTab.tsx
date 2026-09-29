import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Check, CheckCheck, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { enviarWhatsappLead } from "@/lib/whatsapp.functions";

interface Mensagem { id: string; direcao: string; conteudo: string | null; status: string; erro: string | null; created_at: string; provider_timestamp: string | null }

const pad = (n: number) => String(n).padStart(2, "0");
function formatarDataHora(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const IconeStatus = ({ m }: { m: Mensagem }) => {
  if (m.direcao !== "saida") return null;
  if (m.status === "failed") return <span title={m.erro ?? ""}><AlertCircle className="h-3 w-3 text-red-500" /></span>;
  if (m.status === "read") return <CheckCheck className="h-3 w-3 text-blue-500" />;
  if (m.status === "delivered") return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
  return <Check className="h-3 w-3 text-muted-foreground" />;
};

export function WhatsappTab({ leadId }: { leadId?: string }) {
  const db = supabase as any;
  const enviar = useServerFn(enviarWhatsappLead);
  const [contatoId, setContatoId] = useState<string | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const fimRef = useRef<HTMLDivElement>(null);

  const carregar = async () => {
    if (!leadId) return;
    const { data: cs } = await db.from("whatsapp_contatos").select("id").eq("lead_id", leadId).limit(1);
    const cid = cs?.[0]?.id ?? null;
    setContatoId(cid);
    if (cid) {
      const { data } = await db.from("whatsapp_mensagens").select("*").eq("contato_id", cid).order("created_at");
      setMensagens(data ?? []);
      await db.from("whatsapp_contatos").update({ nao_lidas: 0 }).eq("id", cid);
    } else setMensagens([]);
    setCarregando(false);
  };

  useEffect(() => { setCarregando(true); carregar(); }, [leadId]);

  useEffect(() => {
    if (!contatoId) return;
    const ch = supabase.channel(`lead-whats-${contatoId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "whatsapp_mensagens", filter: `contato_id=eq.${contatoId}` }, () => carregar())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [contatoId]);

  useEffect(() => { fimRef.current?.scrollIntoView({ behavior: "smooth" }); }, [mensagens]);

  const handleEnviar = async () => {
    if (!leadId || !texto.trim()) return;
    setEnviando(true);
    try {
      await enviar({ data: { leadId, texto: texto.trim() } });
      setTexto("");
      await carregar();
    } catch (e: any) {
      toast.error("Não foi possível enviar", { description: String(e?.message ?? e).slice(0, 300) });
    } finally { setEnviando(false); }
  };

  if (!leadId) return <div className="p-6 text-sm text-muted-foreground">Salve o lead para conversar pelo WhatsApp.</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-260px)] border rounded-md m-6 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-muted/30">
        {carregando ? <div className="text-sm text-muted-foreground">Carregando...</div>
          : mensagens.length === 0 ? <div className="text-sm text-muted-foreground text-center">Nenhuma conversa com este lead. A primeira mensagem será enviada para o telefone cadastrado.</div>
          : mensagens.map((m) => (
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
      <p className="text-xs text-muted-foreground px-3 pb-2">Respostas livres só podem ser enviadas até 24 horas após a última mensagem do cliente (regra do WhatsApp).</p>
    </div>
  );
}
