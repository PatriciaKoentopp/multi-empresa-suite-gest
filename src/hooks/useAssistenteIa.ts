import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { useCompany } from "@/contexts/company-context";
import { toast } from "sonner";

export interface IaMensagem {
  id: string;
  papel: "user" | "assistant";
  conteudo: string;
}

export interface IaConversa {
  id: string;
  titulo: string;
  updated_at: string;
}

const FUNCTION_URL =
  "https://vbbfmmjohdmocnaxgmmd.supabase.co/functions/v1/assistente-ia";

export function useAssistenteIa() {
  const { user, userData } = useAuth();
  const { currentCompany } = useCompany();
  const [conversas, setConversas] = useState<IaConversa[]>([]);
  const [conversaId, setConversaId] = useState<string | null>(null);
  const [mensagens, setMensagens] = useState<IaMensagem[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [parcial, setParcial] = useState("");

  const carregarConversas = useCallback(async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from("ia_conversas")
      .select("id, titulo, updated_at")
      .eq("usuario_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(30);
    if (!error && data) setConversas(data as IaConversa[]);
  }, [user?.id]);

  useEffect(() => {
    carregarConversas();
  }, [carregarConversas]);

  const abrirConversa = useCallback(async (id: string) => {
    setConversaId(id);
    const { data } = await supabase
      .from("ia_mensagens")
      .select("id, papel, conteudo")
      .eq("conversa_id", id)
      .order("created_at", { ascending: true });
    setMensagens((data as IaMensagem[]) ?? []);
  }, []);

  const novaConversa = useCallback(() => {
    setConversaId(null);
    setMensagens([]);
    setParcial("");
  }, []);

  const excluirConversa = useCallback(
    async (id: string) => {
      await supabase.from("ia_conversas").delete().eq("id", id);
      if (conversaId === id) novaConversa();
      carregarConversas();
    },
    [conversaId, novaConversa, carregarConversas]
  );

  const enviar = useCallback(
    async (texto: string) => {
      const pergunta = texto.trim();
      if (!pergunta || isStreaming || !user?.id) return;

      const historico = [...mensagens, { id: crypto.randomUUID(), papel: "user" as const, conteudo: pergunta }];
      setMensagens(historico);
      setParcial("");
      setIsStreaming(true);

      let idConversa = conversaId;
      try {
        if (!idConversa) {
          const { data, error } = await supabase
            .from("ia_conversas")
            .insert({
              usuario_id: user.id,
              empresa_id: userData?.empresa_id ?? null,
              titulo: pergunta.slice(0, 60),
            })
            .select("id")
            .single();
          if (error) throw error;
          idConversa = data.id as string;
          setConversaId(idConversa);
        }

        await supabase.from("ia_mensagens").insert({
          conversa_id: idConversa,
          papel: "user",
          conteudo: pergunta,
        });

        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;

        const resposta = await fetch(FUNCTION_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            messages: historico.map((m) => ({ role: m.papel, content: m.conteudo })),
            empresaId: currentCompany?.id ?? userData?.empresa_id ?? null,
          }),
        });

        if (!resposta.ok || !resposta.body) {
          let mensagemErro = "Não foi possível obter a resposta do assistente.";
          if (resposta.status === 402) {
            mensagemErro = "Créditos de IA esgotados. Adicione créditos em Configurações para continuar.";
          } else if (resposta.status === 429) {
            mensagemErro = "Muitas solicitações em sequência. Aguarde alguns instantes e tente novamente.";
          } else {
            try {
              const json = await resposta.json();
              if (json?.error) mensagemErro = json.error;
            } catch {
              /* corpo não é JSON */
            }
          }
          throw new Error(mensagemErro);
        }

        const reader = resposta.body.getReader();
        const decoder = new TextDecoder();
        let acumulado = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acumulado += decoder.decode(value, { stream: true });
          setParcial(acumulado);
        }

        const conteudoFinal = acumulado.trim() || "Não consegui gerar uma resposta para esta pergunta.";

        setMensagens((prev) => [
          ...prev,
          { id: crypto.randomUUID(), papel: "assistant", conteudo: conteudoFinal },
        ]);
        setParcial("");

        await supabase.from("ia_mensagens").insert({
          conversa_id: idConversa,
          papel: "assistant",
          conteudo: conteudoFinal,
        });
        await supabase
          .from("ia_conversas")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", idConversa);
        carregarConversas();
      } catch (error: any) {
        setParcial("");
        toast.error(error?.message || "Erro ao falar com o assistente.");
      } finally {
        setIsStreaming(false);
      }
    },
    [mensagens, conversaId, isStreaming, user?.id, userData?.empresa_id, currentCompany?.id, carregarConversas]
  );

  return {
    conversas,
    conversaId,
    mensagens,
    parcial,
    isStreaming,
    enviar,
    abrirConversa,
    novaConversa,
    excluirConversa,
  };
}
