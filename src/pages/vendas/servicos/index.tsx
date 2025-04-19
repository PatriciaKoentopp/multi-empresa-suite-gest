import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableHead, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Plus } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

type Servico = {
  id: string;
  nome: string;
  descricao?: string;
  valor: number;
  status: "ativo" | "inativo";
};

export default function ServicosPage() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<Servico, "id">>({
    nome: "",
    descricao: "",
    valor: 0,
    status: "ativo"
  });
  const [editId, setEditId] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]: name === "valor" ? Number(value.replace(",", ".")) : value,
    }));
  }

  function handleStatusToggle() {
    setForm((f) => ({
      ...f,
      status: f.status === "ativo" ? "inativo" : "ativo",
    }));
  }

  function resetForm() {
    setForm({
      nome: "",
      descricao: "",
      valor: 0,
      status: "ativo"
    });
    setEditId(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editId) {
      setServicos((ss) =>
        ss.map((s) => (s.id === editId ? { ...s, ...form } : s))
      );
      toast({ title: "Serviço atualizado com sucesso!" });
    } else {
      setServicos((ss) => [
        ...ss,
        { ...form, id: Date.now().toString() }
      ]);
      toast({ title: "Serviço cadastrado com sucesso!" });
    }
    setShowForm(false);
    resetForm();
  }

  function handleEditar(servico: Servico) {
    setForm({
      nome: servico.nome,
      descricao: servico.descricao ?? "",
      valor: servico.valor,
      status: servico.status
    });
    setEditId(servico.id);
    setShowForm(true);
  }

  function handleExcluir(id: string) {
    setServicos((ss) => ss.filter((s) => s.id !== id));
    toast({ title: "Serviço excluído com sucesso!" });
    // Se estiver editando este serviço, cancelar edição
    if (editId === id) {
      resetForm();
      setShowForm(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Cadastro de Serviços</h2>
        <Button variant="blue" onClick={() => { setShowForm((s) => !s); resetForm(); }}>
          <Plus className="mr-2" />
          Novo Serviço
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editId ? "Editar Serviço" : "Novo Serviço"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm mb-1">Nome do Serviço *</label>
                <Input
                  type="text"
                  name="nome"
                  required
                  value={form.nome}
                  onChange={handleChange}
                  maxLength={100}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Descrição</label>
                <Textarea
                  name="descricao"
                  value={form.descricao}
                  onChange={handleChange}
                  maxLength={255}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Valor (R$) *</label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  name="valor"
                  required
                  value={form.valor}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Situação</label>
                <Button
                  type="button"
                  variant={form.status === "ativo" ? "blue" : "outline"}
                  className="mr-2"
                  onClick={handleStatusToggle}
                >
                  {form.status === "ativo" ? "Ativo" : "Inativo"}
                </Button>
              </div>
              <div className="flex gap-2 mt-2">
                <Button type="submit" variant="blue">
                  {editId ? "Salvar Alterações" : "Salvar"}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Serviços Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {servicos.length === 0 ? (
            <div className="text-neutral-500">Nenhum serviço cadastrado ainda.</div>
          ) : (
            <Table>
              <thead>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor (R$)</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead />
                </TableRow>
              </thead>
              <TableBody>
                {servicos.map(s => (
                  <TableRow key={s.id}>
                    <TableCell>{s.nome}</TableCell>
                    <TableCell>{s.descricao}</TableCell>
                    <TableCell>
                      {s.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </TableCell>
                    <TableCell>
                      <span className={s.status === "ativo" ? "text-green-600 font-semibold" : "text-gray-500"}>
                        {s.status === "ativo" ? "Ativo" : "Inativo"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditar(s)}>
                            <Edit className="mr-2" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExcluir(s.id)}>
                            <Trash2 className="mr-2 text-red-600" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
