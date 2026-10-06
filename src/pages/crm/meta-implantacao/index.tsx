import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { useServerFn } from "@tanstack/react-start";
import { listarCredenciaisMetaFn } from "@/lib/meta.functions";

interface Conta {
  id: string;
  canal: "instagram" | "facebook";
  nome: string;
  page_id: string;
  secret_name: string;
  funil_id: string | null;
  etapa_id: string | null;
  ativo: boolean;
}

const vazio = { canal: "instagram" as "instagram" | "facebook", nome: "", page_id: "", secret_name: "META_PAGE_TOKEN", funil_id: "", etapa_id: "", ativo: true };

export default function MetaImplantacaoPage() {
  const { currentCompany } = useCompany();
  const db = supabase as any;
  const listarCredenciais = useServerFn(listarCredenciaisMetaFn);
  const [contas, setContas] = useState<Conta[]>([]);
  const [funis, setFunis] = useState<any[]>([]);
  const [credenciais, setCredenciais] = useState<string[]>([]);
  const [form, setForm] = useState<typeof vazio | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const carregar = async () => {
    if (!currentCompany?.id) return;
    const [c, f] = await Promise.all([
      db.from("meta_contas").select("*").eq("empresa_id", currentCompany.id).order("created_at"),
      db.from("funis").select("id, nome, etapas:funil_etapas(id, nome, ordem)").eq("empresa_id", currentCompany.id).order("nome"),
    ]);
    if (c.error) toast.error("Erro ao carregar contas", { description: c.error.message });
    setContas(c.data ?? []);
    setFunis(f.data ?? []);
  };

  useEffect(() => { carregar(); }, [currentCompany?.id]);
  useEffect(() => { listarCredenciais().then(setCredenciais).catch(() => setCredenciais([])); }, []);

  const etapas = (funis.find((f) => f.id === form?.funil_id)?.etapas ?? []).sort((a: any, b: any) => a.ordem - b.ordem);

  const salvar = async () => {
    if (!form || !currentCompany?.id) return;
    if (!form.page_id.trim()) return toast.error("Informe o identificador da página/conta");
    setSalvando(true);
    const dados = {
      empresa_id: currentCompany.id,
      canal: form.canal,
      nome: form.nome.trim() || (form.canal === "instagram" ? "Instagram" : "Facebook"),
      page_id: form.page_id.trim(),
      secret_name: form.secret_name,
      funil_id: form.funil_id || null,
      etapa_id: form.etapa_id || null,
      ativo: form.ativo,
    };
    const { error } = editId
      ? await db.from("meta_contas").update(dados).eq("id", editId)
      : await db.from("meta_contas").insert(dados);
    setSalvando(false);
    if (error) {
      const dup = error.code === "23505";
      return toast.error(dup ? "Esta conta já está implantada em outra empresa" : "Erro ao salvar", { description: dup ? undefined : error.message });
    }
    toast.success("Conta salva");
    setForm(null); setEditId(null); carregar();
  };

  const excluir = async (id: string) => {
    if (!confirm("Excluir esta conta? As conversas dela também serão excluídas.")) return;
    const { error } = await db.from("meta_contas").delete().eq("id", id);
    if (error) return toast.error("Erro ao excluir", { description: error.message });
    toast.success("Conta excluída"); carregar();
  };

  const nomeFunil = (id: string | null) => funis.find((f) => f.id === id)?.nome ?? "Primeiro funil ativo";
  const opcoesCredencial = credenciais.length ? credenciais : [form?.secret_name ?? "META_PAGE_TOKEN"];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-3">
        <div>
          <h2 className="text-xl font-semibold text-foreground leading-tight">Implantação Instagram/Facebook</h2>
          <p className="text-sm text-muted-foreground">Vincule as contas de Instagram e Facebook desta empresa e defina onde os novos contatos entram no funil</p>
        </div>
        {!form && (
          <Button variant="blue" size="sm" onClick={() => { setForm({ ...vazio, secret_name: credenciais[0] ?? "META_PAGE_TOKEN" }); setEditId(null); }}>
            <Plus className="mr-1" /> Nova Conta
          </Button>
        )}
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Como implantar</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>1. Na Meta for Developers, no app da empresa, adicione o produto Messenger (e Instagram), ligue a conta Instagram profissional à página do Facebook e gere o token da página.</p>
          <p>2. O token é guardado com segurança como credencial (META_PAGE_TOKEN, META_PAGE_TOKEN_2, ...). Configure o webhook da Meta para o endereço /api/public/meta/webhook do app.</p>
          <p>3. Aqui, cadastre a conta: escolha o canal, informe o ID da página (Facebook) ou o ID da conta Instagram e a credencial correspondente.</p>
          <p>4. Escolha o funil e a etapa onde os novos contatos devem entrar como lead.</p>
        </CardContent>
      </Card>

      {form && (
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-base">{editId ? "Editar conta" : "Nova conta"}</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Canal</Label>
              <Select value={form.canal} onValueChange={(v) => setForm({ ...form, canal: v as "instagram" | "facebook" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="facebook">Facebook Messenger</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Nome</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
            <div><Label>ID da página / conta *</Label><Input value={form.page_id} onChange={(e) => setForm({ ...form, page_id: e.target.value })} /></div>
            <div>
              <Label>Credencial</Label>
              <Select value={form.secret_name} onValueChange={(v) => setForm({ ...form, secret_name: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{opcoesCredencial.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Funil para novos leads</Label>
              <Select value={form.funil_id || "auto"} onValueChange={(v) => setForm({ ...form, funil_id: v === "auto" ? "" : v, etapa_id: "" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Primeiro funil ativo</SelectItem>
                  {funis.map((f) => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Etapa inicial</Label>
              <Select value={form.etapa_id || "auto"} onValueChange={(v) => setForm({ ...form, etapa_id: v === "auto" ? "" : v })} disabled={!form.funil_id}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Primeira etapa</SelectItem>
                  {etapas.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2"><Switch checked={form.ativo} onCheckedChange={(v) => setForm({ ...form, ativo: v })} /><Label>Ativo</Label></div>
            <div className="flex justify-end gap-2 md:col-span-2">
              <Button variant="outline" size="sm" onClick={() => { setForm(null); setEditId(null); }}><X className="mr-1 h-4 w-4" /> Cancelar</Button>
              <Button variant="blue" size="sm" onClick={salvar} disabled={salvando}><Save className="mr-1 h-4 w-4" /> Salvar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Canal</TableHead><TableHead>Nome</TableHead><TableHead>ID</TableHead><TableHead>Credencial</TableHead><TableHead>Funil</TableHead><TableHead>Situação</TableHead><TableHead className="w-24" /></TableRow>
            </TableHeader>
            <TableBody>
              {contas.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhuma conta implantada nesta empresa</TableCell></TableRow>
              ) : contas.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.canal === "instagram" ? "Instagram" : "Facebook"}</TableCell>
                  <TableCell>{c.nome}</TableCell>
                  <TableCell>{c.page_id}</TableCell>
                  <TableCell>{c.secret_name}</TableCell>
                  <TableCell>{nomeFunil(c.funil_id)}</TableCell>
                  <TableCell><Badge variant={c.ativo ? "default" : "secondary"}>{c.ativo ? "Ativo" : "Inativo"}</Badge></TableCell>
                  <TableCell className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditId(c.id); setForm({ canal: c.canal, nome: c.nome, page_id: c.page_id, secret_name: c.secret_name, funil_id: c.funil_id ?? "", etapa_id: c.etapa_id ?? "", ativo: c.ativo }); }}><Edit className="h-4 w-4 text-blue-500" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => excluir(c.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
