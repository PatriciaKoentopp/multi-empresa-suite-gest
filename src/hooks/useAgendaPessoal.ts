import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Agenda Pessoal: dados privados do usuário logado (RLS por user_id)
const db = supabase as any;

// Envia a tarefa ao Google Agenda do usuário (ignora quando não está conectado)
async function enviarGoogle(tarefaId?: string) {
  if (!tarefaId) return;
  try {
    const { enviarTarefaGoogle } = await import("@/lib/google-agenda.functions");
    await enviarTarefaGoogle({ data: { tarefaId } });
  } catch (e: any) {
    toast.error("Não foi possível enviar ao Google Agenda", { description: e.message });
  }
}

export type Triade = "importante" | "urgente" | "circunstancial";

export interface AgendaPapel {
  id: string;
  nome: string;
  cor: string;
  ordem: number;
  ativo: boolean;
}

export interface AgendaMeta {
  id: string;
  papel_id: string | null;
  titulo: string;
  descricao: string | null;
  data_alvo: string | null;
  progresso: number;
  status: "em_andamento" | "concluida" | "cancelada";
}

export interface AgendaTarefa {
  id: string;
  papel_id: string | null;
  meta_id: string | null;
  titulo: string;
  descricao: string | null;
  data: string;
  hora_inicio: string | null;
  hora_fim: string | null;
  duracao_min: number;
  triade: Triade;
  status: "pendente" | "concluida" | "cancelada";
  concluida_em: string | null;
}

export const TRIADE_INFO: Record<Triade, { label: string; cor: string; chip: string }> = {
  importante: { label: "Importante", cor: "#2563eb", chip: "bg-blue-100 text-blue-800 border-blue-200" },
  urgente: { label: "Urgente", cor: "#dc2626", chip: "bg-red-100 text-red-800 border-red-200" },
  circunstancial: { label: "Circunstancial", cor: "#d97706", chip: "bg-amber-100 text-amber-800 border-amber-200" },
};

export function useAgendaPapeis() {
  const [papeis, setPapeis] = useState<AgendaPapel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const carregar = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await db.from("agenda_papeis").select("*").order("ordem").order("nome");
    if (error) toast.error("Erro ao carregar papéis");
    setPapeis(data || []);
    setIsLoading(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const salvar = async (p: Partial<AgendaPapel>, id?: string) => {
    const { error } = id
      ? await db.from("agenda_papeis").update(p).eq("id", id)
      : await db.from("agenda_papeis").insert(p);
    if (error) { toast.error("Erro ao salvar papel"); return false; }
    toast.success("Papel salvo");
    await carregar();
    return true;
  };

  const excluir = async (id: string) => {
    const { error } = await db.from("agenda_papeis").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir papel"); return; }
    toast.success("Papel excluído");
    await carregar();
  };

  return { papeis, isLoading, carregar, salvar, excluir };
}

export function useAgendaMetas() {
  const [metas, setMetas] = useState<AgendaMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const carregar = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await db.from("agenda_metas").select("*").order("data_alvo", { ascending: true, nullsFirst: false });
    if (error) toast.error("Erro ao carregar metas");
    setMetas(data || []);
    setIsLoading(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const salvar = async (m: Partial<AgendaMeta>, id?: string) => {
    const { error } = id
      ? await db.from("agenda_metas").update(m).eq("id", id)
      : await db.from("agenda_metas").insert(m);
    if (error) { toast.error("Erro ao salvar meta"); return false; }
    toast.success("Meta salva");
    await carregar();
    return true;
  };

  const excluir = async (id: string) => {
    const { error } = await db.from("agenda_metas").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir meta"); return; }
    toast.success("Meta excluída");
    await carregar();
  };

  return { metas, isLoading, carregar, salvar, excluir };
}

export function useAgendaTarefas(inicio: string, fim: string) {
  const [tarefas, setTarefas] = useState<AgendaTarefa[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const carregar = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await db
      .from("agenda_tarefas")
      .select("*")
      .gte("data", inicio)
      .lte("data", fim)
      .order("data")
      .order("hora_inicio", { ascending: true, nullsFirst: true });
    if (error) toast.error("Erro ao carregar tarefas");
    setTarefas(data || []);
    setIsLoading(false);
  }, [inicio, fim]);

  useEffect(() => { carregar(); }, [carregar]);

  const salvar = async (t: Partial<AgendaTarefa>, id?: string) => {
    const { data, error } = id
      ? await db.from("agenda_tarefas").update(t).eq("id", id).select("id").single()
      : await db.from("agenda_tarefas").insert(t).select("id").single();
    if (error) { toast.error("Erro ao salvar tarefa"); return false; }
    toast.success("Tarefa salva");
    await enviarGoogle(data?.id ?? id);
    await carregar();
    return true;
  };

  const alternarConcluida = async (t: AgendaTarefa) => {
    const concluir = t.status !== "concluida";
    const { error } = await db
      .from("agenda_tarefas")
      .update({ status: concluir ? "concluida" : "pendente", concluida_em: concluir ? new Date().toISOString() : null })
      .eq("id", t.id);
    if (error) { toast.error("Erro ao atualizar tarefa"); return; }
    await enviarGoogle(t.id);
    await carregar();
  };

  const excluir = async (id: string) => {
    const { data: atual } = await db.from("agenda_tarefas").select("google_event_id").eq("id", id).maybeSingle();
    const { error } = await db.from("agenda_tarefas").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir tarefa"); return; }
    toast.success("Tarefa excluída");
    if (atual?.google_event_id) {
      try {
        const { removerEventoGoogle } = await import("@/lib/google-agenda.functions");
        await removerEventoGoogle({ data: { googleEventId: atual.google_event_id } });
      } catch (e: any) { toast.error("Não foi possível remover do Google Agenda", { description: e.message }); }
    }
    await carregar();
  };

  return { tarefas, isLoading, carregar, salvar, alternarConcluida, excluir };
}

// "yyyy-MM-dd" -> "DD/MM/YYYY"
export const fmtData = (s?: string | null) => {
  if (!s) return "-";
  const [y, m, d] = s.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
};

export const fmtHora = (s?: string | null) => (s ? s.slice(0, 5) : "");

export const calcDuracao = (ini?: string | null, fim?: string | null) => {
  if (!ini || !fim) return 0;
  const [h1, m1] = ini.split(":").map(Number);
  const [h2, m2] = fim.split(":").map(Number);
  const d = (h2! * 60 + m2!) - (h1! * 60 + m1!);
  return d > 0 ? d : 0;
};
