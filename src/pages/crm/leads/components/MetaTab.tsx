import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, AlertCircle, Instagram, Facebook } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { enviarMensagemMeta } from "@/lib/meta.functions";

const pad = (n: number) => String(n).padStart(2, "0");
function formatarDataHora(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Conversas do Instagram/Facebook do lead. Não exibe nada se o lead não tiver conversa nesses canais. */
export function MetaTab({ leadId }: { leadId: string }) {
  const db = supabase as any;
  const enviar = useServerFn(enviarMensagemMeta);
  const [contatos, setContatos] = useState<any[]>([]);
  const [mensagens, setMensagens] = useState<Record<string, any[]>>({});
  const [textos, setTextos] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState<string | null>(null);

  const carregar = async () => {
    const { data: cs } = await db.from("meta_contatos").select("id, nome, conta:meta_contas(canal, nome)").eq("lead_id", leadId);
    setContatos(cs ?? []);
    const ids = (cs ?? []).map((c: any) => c.id);
    if (!ids.length) return;
    const { data } = await db.from("meta_mensagens").select("*").in("contato_id", ids).order("created_at");
    const g: Record<string, any[]> = {};
    for (const m of data ?? []) (g[m.contato_id] ??= []).push(m);
    setMensagens(g);
    await db.from("meta_contatos").update({ nao_lidas: 0 }).in("id", ids);
  };

  useEffect(() => { carregar(); }, [leadId]);

  useEffect(() => {
    if (!contatos.length) return;
    const ch = supabase.channel(`lead-meta-${leadId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "meta_mensagens" }, (p: any) => {
        if (contatos.some((c) => c.id === (p.new?.contato_id ?? p.old?.contato_id))) carregar();
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [contatos.length, leadId]);

  const handleEnviar = async (contatoId: string) => {
    const texto = (textos[contatoId] ?? "").trim();
    if (!texto) return;
    setEnviando(contatoId);
    try {
      await enviar({ data: { contatoId, texto } });
      setTextos({ ...textos, [contatoId]: "" });
      await carregar();
    } catch (e: any) {
      toast.error("Não foi possível enviar", { description: String(e?.message ?? e).slice(0, 300) });
    } finally { setEnviando(null); }
  };

  if (!contatos.length) return null;

  return (
    <>
      {contatos.map((c) => {
        const insta = c.conta?.canal === "instagram";
        const Icone = insta ? Instagram : Facebook;
        return (
          <div key={c.id} className="flex flex-col border rounded-md mx-6 mb-6 overflow-hidden max-h-[60vh]">
            <div className="px-4 py-2 border-b flex items-center gap-2 text-sm font-medium">
              <Icone className="h-4 w-4 text-blue-500" /> {insta ? "Instagram" : "Facebook"} {c.nome ? `- ${c.nome}` : ""}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-muted/30">
              {(mensagens[c.id] ?? []).map((m) => (
                <div key={m.id} className={`flex ${m.direcao === "saida" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm shadow-sm ${m.direcao === "saida" ? "bg-blue-100 dark:bg-blue-900/40" : "bg-background"}`}>
                    <div className="whitespace-pre-wrap break-words">{m.conteudo}</div>
                    <div className="flex items-center justify-end gap-1 text-[10px] text-muted-foreground mt-1">
                      {formatarDataHora(m.provider_timestamp ?? m.created_at)}
                      {m.status === "failed" && <span title={m.erro ?? ""}><AlertCircle className="h-3 w-3 text-red-500" /></span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t flex gap-2">
              <Textarea rows={2} placeholder="Digite uma mensagem" value={textos[c.id] ?? ""}
                onChange={(e) => setTextos({ ...textos, [c.id]: e.target.value })}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEnviar(c.id); } }} />
              <Button variant="blue" onClick={() => handleEnviar(c.id)} disabled={enviando === c.id || !(textos[c.id] ?? "").trim()}><Send className="h-4 w-4" /></Button>
            </div>
            <p className="text-xs text-muted-foreground px-3 pb-2">Respostas livres só podem ser enviadas até 24 horas após a última mensagem do cliente (regra da Meta).</p>
          </div>
        );
      })}
    </>
  );
}
