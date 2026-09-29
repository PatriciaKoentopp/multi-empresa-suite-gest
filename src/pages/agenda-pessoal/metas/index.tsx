import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, PlusCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AgendaMeta, AgendaPapel, fmtData, useAgendaMetas, useAgendaPapeis } from "@/hooks/useAgendaPessoal";

const NENHUM = "nenhum";
const STATUS_META: Record<AgendaMeta["status"], { label: string; cls: string }> = {
  em_andamento: { label: "Em andamento", cls: "bg-blue-100 text-blue-800" },
  concluida: { label: "Concluída", cls: "bg-green-100 text-green-800" },
  cancelada: { label: "Cancelada", cls: "bg-red-100 text-red-800" },
};

export default function MetasPessoaisPage() {
  const papeisHook = useAgendaPapeis();
  const metasHook = useAgendaMetas();
  const { papeis } = papeisHook;

  // Papel
  const [papelOpen, setPapelOpen] = useState(false);
  const [papelEdit, setPapelEdit] = useState<AgendaPapel | undefined>();
  const [pNome, setPNome] = useState("");
  const [pCor, setPCor] = useState("#3b82f6");
  const [pAtivo, setPAtivo] = useState("ativo");

  useEffect(() => {
    if (!papelOpen) return;
    setPNome(papelEdit?.nome ?? "");
    setPCor(papelEdit?.cor ?? "#3b82f6");
    setPAtivo(papelEdit && !papelEdit.ativo ? "inativo" : "ativo");
  }, [papelOpen, papelEdit]);

  const salvarPapel = async () => {
    if (!pNome.trim()) return toast.error("Informe o nome");
    const ok = await papeisHook.salvar({ nome: pNome.trim(), cor: pCor, ativo: pAtivo === "ativo" }, papelEdit?.id);
    if (ok) setPapelOpen(false);
  };

  // Meta
  const [metaOpen, setMetaOpen] = useState(false);
  const [metaEdit, setMetaEdit] = useState<AgendaMeta | undefined>();
  const [mTitulo, setMTitulo] = useState("");
  const [mDesc, setMDesc] = useState("");
  const [mData, setMData] = useState("");
  const [mPapel, setMPapel] = useState(NENHUM);
  const [mProg, setMProg] = useState("0");
  const [mStatus, setMStatus] = useState<AgendaMeta["status"]>("em_andamento");

  useEffect(() => {
    if (!metaOpen) return;
    setMTitulo(metaEdit?.titulo ?? "");
    setMDesc(metaEdit?.descricao ?? "");
    setMData(metaEdit?.data_alvo ?? "");
    setMPapel(metaEdit?.papel_id ?? NENHUM);
    setMProg(String(metaEdit?.progresso ?? 0));
    setMStatus(metaEdit?.status ?? "em_andamento");
  }, [metaOpen, metaEdit]);

  const salvarMeta = async () => {
    if (!mTitulo.trim()) return toast.error("Informe o título");
    const prog = Math.min(100, Math.max(0, Number(mProg) || 0));
    const ok = await metasHook.salvar(
      {
        titulo: mTitulo.trim(),
        descricao: mDesc.trim() || null,
        data_alvo: mData || null,
        papel_id: mPapel === NENHUM ? null : mPapel,
        progresso: prog,
        status: mStatus,
      },
      metaEdit?.id,
    );
    if (ok) setMetaOpen(false);
  };

  const papelNome = (id: string | null) => papeis.find((p) => p.id === id);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Papéis e Metas</h1>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Papéis</CardTitle>
            <Button variant="blue" size="sm" onClick={() => { setPapelEdit(undefined); setPapelOpen(true); }}>
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Papel
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {papeis.length === 0 && <p className="text-sm text-muted-foreground">Cadastre seus papéis (ex.: Pessoal, Família, Saúde, Estudos).</p>}
            {papeis.map((p) => (
              <div key={p.id} className="flex items-center gap-2 rounded-md border p-2">
                <span className="h-3 w-3 rounded-full" style={{ background: p.cor }} />
                <span className={`flex-1 text-sm ${p.ativo ? "" : "text-muted-foreground line-through"}`}>{p.nome}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setPapelEdit(p); setPapelOpen(true); }}>
                  <Pencil className="h-4 w-4 text-blue-500" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => papeisHook.excluir(p.id)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Metas</CardTitle>
            <Button variant="blue" size="sm" onClick={() => { setMetaEdit(undefined); setMetaOpen(true); }}>
              <PlusCircle className="mr-2 h-4 w-4" /> Nova Meta
            </Button>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Meta</TableHead>
                    <TableHead>Papel</TableHead>
                    <TableHead>Data alvo</TableHead>
                    <TableHead className="w-[140px]">Progresso</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead className="w-[90px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metasHook.metas.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Nenhuma meta cadastrada</TableCell></TableRow>
                  ) : metasHook.metas.map((m) => {
                    const p = papelNome(m.papel_id);
                    return (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.titulo}</TableCell>
                        <TableCell>{p ? <span style={{ color: p.cor }}>{p.nome}</span> : "-"}</TableCell>
                        <TableCell>{fmtData(m.data_alvo)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-2 flex-1 rounded bg-muted overflow-hidden"><div className="h-full bg-blue-500" style={{ width: `${m.progresso}%` }} /></div>
                            <span className="text-xs">{m.progresso}%</span>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline" className={STATUS_META[m.status].cls}>{STATUS_META[m.status].label}</Badge></TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setMetaEdit(m); setMetaOpen(true); }}>
                              <Pencil className="h-4 w-4 text-blue-500" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => metasHook.excluir(m.id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={papelOpen} onOpenChange={setPapelOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader><DialogTitle>{papelEdit ? "Editar Papel" : "Novo Papel"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2"><Label>Nome *</Label><Input value={pNome} onChange={(e) => setPNome(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2"><Label>Cor</Label><Input type="color" value={pCor} onChange={(e) => setPCor(e.target.value)} /></div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={pAtivo} onValueChange={setPAtivo}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo" className="text-blue-600">Ativo</SelectItem>
                    <SelectItem value="inativo" className="text-red-600">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPapelOpen(false)}>Cancelar</Button>
            <Button variant="blue" onClick={salvarPapel}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={metaOpen} onOpenChange={setMetaOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader><DialogTitle>{metaEdit ? "Editar Meta" : "Nova Meta"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2"><Label>Título *</Label><Input value={mTitulo} onChange={(e) => setMTitulo(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Papel</Label>
                <Select value={mPapel} onValueChange={setMPapel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NENHUM}>Nenhum</SelectItem>
                    {papeis.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2"><Label>Data alvo</Label><Input type="date" value={mData} onChange={(e) => setMData(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2"><Label>Progresso (%)</Label><Input type="number" min={0} max={100} value={mProg} onChange={(e) => setMProg(e.target.value)} /></div>
              <div className="grid gap-2">
                <Label>Situação</Label>
                <Select value={mStatus} onValueChange={(v) => setMStatus(v as AgendaMeta["status"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="em_andamento">Em andamento</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2"><Label>Descrição</Label><Textarea rows={3} value={mDesc} onChange={(e) => setMDesc(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMetaOpen(false)}>Cancelar</Button>
            <Button variant="blue" onClick={salvarMeta}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
