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
import { listarCredenciaisWhatsapp } from "@/lib/whatsapp.functions";

interface Numero {
  id: string;
  nome: string;
  telefone: string | null;
  phone_number_id: string;
  secret_name: string;
  funil_id: string | null;
  etapa_id: string | null;
  ativo: boolean;
}

const vazio = { nome: "WhatsApp", telefone: "", phone_number_id: "", secret_name: "WHATSAPP_API_KEY", funil_id: "", etapa_id: "", ativo: true };

export default function WhatsappImplantacaoPage() {
  const { currentCompany } = useCompany();
  const db = supabase as any;
  const listarCredenciais = useServerFn(listarCredenciaisWhatsapp);
  const [numeros, setNumeros] = useState<Numero[]>([]);
  const [funis, setFunis] = useState<any[]>([]);
  const [credenciais, setCredenciais] = useState<string[]>([]);
  const [form, setForm] = useState<typeof vazio | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const carregar = async () => {
    if (!currentCompany?.id) return;
    const [n, f] = await Promise.all([
      db.from("whatsapp_numeros").select("*").eq("empresa_id", currentCompany.id).order("created_at"),
      db.from("funis").select("id, nome, etapas:funil_etapas(id, nome, ordem)").eq("empresa_id", currentCompany.id).order("nome"),
    ]);
    if (n.error) toast.error("Erro ao carregar números", { description: n.error.message });
    setNumeros(n.data ?? []);
    setFunis(f.data ?? []);
  };

  useEffect(() => { carregar(); }, [currentCompany?.id]);
  useEffect(() => { listarCredenciais().then(setCredenciais).catch(() => setCredenciais(["WHATSAPP_API_KEY"])); }, []);

  const etapas = (funis.find((f) => f.id === form?.funil_id)?.etapas ?? []).sort((a: any, b: any) => a.ordem - b.ordem);

  const salvar = async () => {
    if (!form || !currentCompany?.id) return;
    if (!form.phone_number_id.trim()) return toast.error("Informe o identificador do número (Phone Number ID)");
    setSalvando(true);
    const dados = {
      empresa_id: currentCompany.id,
      nome: form.nome.trim() || "WhatsApp",
      telefone: form.telefone.trim() || null,
      phone_number_id: form.phone_number_id.trim(),
      secret_name: form.secret_name,
      funil_id: form.funil_id || null,
      etapa_id: form.etapa_id || null,
      ativo: form.ativo,
    };
    const { error } = editId
      ? await db.from("whatsapp_numeros").update(dados).eq("id", editId)
      : await db.from("whatsapp_numeros").insert(dados);
    setSalvando(false);
    if (error) {
      const dup = error.code === "23505";
      return toast.error(dup ? "Este número já está implantado em outra empresa" : "Erro ao salvar", { description: dup ? undefined : error.message });
    }
    toast.success("Número salvo");
    setForm(null); setEditId(null); carregar();
  };

  const excluir = async (id: string) => {
    if (!confirm("Excluir este número? As conversas dele também serão excluídas.")) return;
    const { error } = await db.from("whatsapp_numeros").delete().eq("id", id);
    if (error) return toast.error("Erro ao excluir", { description: error.message });
    toast.success("Número excluído"); carregar();
  };

  const nomeFunil = (id: string | null) => funis.find((f) => f.id === id)?.nome ?? "Primeiro funil ativo";

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-3">
        <div>
          <h2 className="text-xl font-semibold text-foreground leading-tight">Implantação do WhatsApp</h2>
          <p className="text-sm text-muted-foreground">Vincule o número de WhatsApp Business desta empresa e defina onde os novos contatos entram no funil</p>
        </div>
        {!form && (
          <Button variant="blue" size="sm" onClick={() => { setForm({ ...vazio, secret_name: credenciais[0] ?? "WHATSAPP_API_KEY" }); setEditId(null); }}>
            <Plus className="mr-1" /> Novo Número
          </Button>
        )}
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Como implantar</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>1. O administrador conecta o número da empresa no Lovable (Conectores → WhatsApp). Cada conexão gera uma credencial (WHATSAPP_API_KEY, WHATSAPP_API_KEY_2, ...).</p>
          <p>2. Aqui, com a empresa selecionada, cadastre o número, informe o Phone Number ID mostrado na conexão e escolha a credencial correspondente.</p>
          <p>3. Escolha o funil e a etapa onde os novos contatos devem entrar como lead. Grupos são sempre ignorados.</p>
        </CardContent>
      </Card>

      {form && (
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-base">{editId ? "Editar número" : "Novo número"}</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Nome</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
            <div><Label>Telefone</Label><Input placeholder="+55 47 99999-9999" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></div>
            <div><Label>Phone Number ID *</Label><Input value={form.phone_number_id} onChange={(e) => setForm({ ...form, phone_number_id: e.target.value })} /></div>
            <div>
              <Label>Credencial</Label>
              <Select value={form.secret_name} onValueChange={(v) => setForm({ ...form, secret_name: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{(credenciais.length ? credenciais : [form.secret_name]).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
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
              <TableRow><TableHead>Nome</TableHead><TableHead>Telefone</TableHead><TableHead>Credencial</TableHead><TableHead>Funil</TableHead><TableHead>Situação</TableHead><TableHead className="w-24" /></TableRow>
            </TableHeader>
            <TableBody>
              {numeros.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum número implantado nesta empresa</TableCell></TableRow>
              ) : numeros.map((n) => (
                <TableRow key={n.id}>
                  <TableCell>{n.nome}</TableCell>
                  <TableCell>{n.telefone ?? "-"}</TableCell>
                  <TableCell>{n.secret_name}</TableCell>
                  <TableCell>{nomeFunil(n.funil_id)}</TableCell>
                  <TableCell><Badge variant={n.ativo ? "default" : "secondary"}>{n.ativo ? "Ativo" : "Inativo"}</Badge></TableCell>
                  <TableCell className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditId(n.id); setForm({ nome: n.nome, telefone: n.telefone ?? "", phone_number_id: n.phone_number_id, secret_name: n.secret_name, funil_id: n.funil_id ?? "", etapa_id: n.etapa_id ?? "", ativo: n.ativo }); }}><Edit className="h-4 w-4 text-blue-500" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => excluir(n.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
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
