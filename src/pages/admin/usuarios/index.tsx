
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search, Filter, User, EllipsisVertical } from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { format } from "date-fns";
import ptBR from "date-fns/locale/pt-BR";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

// Interface do usuário conforme Supabase
type Usuario = {
  id: string;
  nome: string;
  email: string;
  senha?: string; // não será exibida/buscada do supabase
  tipo: "Administrador" | "Usuário";
  status: "ativo" | "inativo";
  vendedor: "sim" | "nao";
  empresa_id?: string | null;
  createdAt: Date;
  updatedAt: Date;
  empresa_nome?: string | null;
};

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | undefined>(undefined);
  const [viewingUsuario, setViewingUsuario] = useState<Usuario | undefined>(undefined);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState<"todos" | "Administrador" | "Usuário">("todos");
  const [statusFilter, setStatusFilter] = useState<"todos" | "ativo" | "inativo">("todos");

  // Buscar usuários do supabase
  useEffect(() => {
    const fetchUsuarios = async () => {
      let { data, error } = await supabase
        .from("usuarios")
        .select("*, empresas(nome_fantasia)"); // Busca o nome da empresa relacionada
      if (error) {
        toast.error("Erro ao buscar usuários: " + error.message);
        setUsuarios([]);
        return;
      }
      // Mapear datas para Date e extrair nome da empresa
      const mapped = (data || []).map((row: any) => ({
        id: row.id,
        nome: row.nome,
        email: row.email,
        tipo: row.tipo,
        status: row.status,
        vendedor: row.vendedor,
        empresa_id: row.empresa_id,
        createdAt: row.created_at ? new Date(row.created_at) : new Date(),
        updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
        empresa_nome: row.empresas?.nome_fantasia || null,
      }));
      setUsuarios(mapped);
    };
    fetchUsuarios();
  }, []);

  // Abrir dialog novo/editar/visualizar
  const handleOpenDialog = (usuario?: Usuario, isViewing = false) => {
    if (isViewing) setViewingUsuario(usuario);
    else setEditingUsuario(usuario);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingUsuario(undefined);
    setViewingUsuario(undefined);
    setIsDialogOpen(false);
  };

  // Filtros aplicados na tabela
  const filteredUsuarios = useMemo(() => {
    return usuarios.filter((user) => {
      const matchesSearch =
        user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTipo = tipoFilter === "todos" || user.tipo === tipoFilter;
      const matchesStatus = statusFilter === "todos" || user.status === statusFilter;
      return matchesSearch && matchesTipo && matchesStatus;
    });
  }, [usuarios, searchTerm, tipoFilter, statusFilter]);

  // Salvar/criar usuário no Supabase
  const handleSubmit = async (data: Partial<Usuario>) => {
    if (editingUsuario) {
      // Edição
      const { error } = await supabase
        .from("usuarios")
        .update({
          nome: data.nome,
          email: data.email,
          tipo: data.tipo,
          status: data.status,
          vendedor: data.vendedor,
        })
        .eq("id", editingUsuario.id);
      if (error) {
        toast.error("Erro ao atualizar usuário: " + error.message);
        return;
      }
      toast.success("Usuário atualizado com sucesso!");
      // Atualizar na tela
      setUsuarios((prev) =>
        prev.map((u) =>
          u.id === editingUsuario.id
            ? { ...u, ...data, updatedAt: new Date() }
            : u
        )
      );
    } else {
      // Criação
      const { data: novoUsuario, error } = await supabase
        .from("usuarios")
        .insert([
          {
            nome: data.nome,
            email: data.email,
            tipo: data.tipo,
            status: data.status,
            vendedor: data.vendedor,
            empresa_id: data.empresa_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            id: crypto.randomUUID(),
          }
        ])
        .select("*, empresas(nome_fantasia)")
        .single();
      if (error) {
        toast.error("Erro ao criar usuário: " + error.message);
        return;
      }
      toast.success("Usuário criado com sucesso!");
      setUsuarios((prev) => [
        ...prev,
        {
          ...novoUsuario,
          createdAt: novoUsuario?.created_at ? new Date(novoUsuario.created_at) : new Date(),
          updatedAt: novoUsuario?.updated_at ? new Date(novoUsuario.updated_at) : new Date(),
          empresa_nome: novoUsuario?.empresas?.nome_fantasia || null,
        },
      ]);
    }
    handleCloseDialog();
  };

  // Excluir usuário no Supabase
  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("usuarios")
      .delete()
      .eq("id", id);
    if (error) {
      toast.error("Erro ao excluir usuário: " + error.message);
      return;
    }
    setUsuarios((prev) => prev.filter((u) => u.id !== id));
    toast.success("Usuário excluído com sucesso!");
  };

  return (
    <div className="space-y-4">
      {/* Cabeçalho padrão Favoritos */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <User className="w-6 h-6 text-blue-500" />
            Usuários
          </h1>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          variant="blue"
          className="flex items-center gap-2"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou e-mail..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex w-full flex-wrap gap-2 sm:w-auto">
              <Select
                value={tipoFilter}
                onValueChange={(value) => setTipoFilter(value as any)}
              >
                <SelectTrigger className="w-[150px] bg-white dark:bg-gray-900">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="Administrador">Administrador</SelectItem>
                  <SelectItem value="Usuário">Usuário</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as any)}
              >
                <SelectTrigger className="w-[150px] bg-white dark:bg-gray-900">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="ativo" className="text-blue-600">Ativo</SelectItem>
                  <SelectItem value="inativo" className="text-red-600">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tabela de usuários */}
          <div className="border rounded-md bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead className="w-[120px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsuarios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsuarios.map((usuario) => (
                    <TableRow key={usuario.id}>
                      <TableCell>
                        <span>{usuario.nome}</span>
                      </TableCell>
                      <TableCell>{usuario.email}</TableCell>
                      <TableCell>
                        {usuario.tipo}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            usuario.status === "ativo"
                              ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"
                              : "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20"
                          }`}
                        >
                          {usuario.status === "ativo" ? "Ativo" : "Inativo"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {usuario.empresa_nome || "-"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <EllipsisVertical className="w-5 h-5 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleOpenDialog(usuario)}
                              className="text-blue-500 hover:bg-blue-50 hover:bg-opacity-70"
                            >
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(usuario.id)}
                              className="text-red-500 hover:bg-red-50 hover:bg-opacity-70"
                            >
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de cadastro/edição/visualização */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {viewingUsuario
                ? "Visualizar Usuário"
                : editingUsuario
                ? "Editar Usuário"
                : "Novo Usuário"}
            </DialogTitle>
          </DialogHeader>
          <UsuarioForm
            usuario={viewingUsuario || editingUsuario}
            readOnly={!!viewingUsuario}
            onSubmit={handleSubmit}
            onCancel={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ======= Componente do formulário atualizado com o campo vendedor =========
type UsuarioFormProps = {
  usuario?: Partial<Usuario>;
  readOnly?: boolean;
  onSubmit: (usuario: Partial<Usuario>) => void;
  onCancel: () => void;
};

function UsuarioForm({ usuario, readOnly, onSubmit, onCancel }: UsuarioFormProps) {
  const [form, setForm] = useState<Partial<Usuario> & { confirmarSenha?: string }>({
    nome: usuario?.nome || "",
    email: usuario?.email || "",
    senha: usuario?.senha || "",
    tipo: usuario?.tipo || "Usuário",
    status: usuario?.status || "ativo",
    vendedor: usuario?.vendedor || "nao", // Inicializamos o campo vendedor
    empresa_id: usuario?.empresa_id || "",
    confirmarSenha: "",
  });

  const [erroConfirmarSenha, setErroConfirmarSenha] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleVendedorChange = (value: "sim" | "nao") => {
    setForm((prev) => ({
      ...prev,
      vendedor: value,
    }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErroConfirmarSenha(null);

    if (!readOnly) {
      if (form.senha !== undefined && form.senha !== form.confirmarSenha) {
        setErroConfirmarSenha("As senhas não coincidem.");
        return;
      }
    }

    const { confirmarSenha, ...data } = form;
    onSubmit(data);
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      {/* Nome */}
      <div>
        <label className="block text-sm font-medium mb-1">Nome</label>
        <Input
          name="nome"
          value={form.nome}
          disabled={readOnly}
          onChange={handleChange}
          required
        />
      </div>
      {/* Email */}
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <Input
          type="email"
          name="email"
          value={form.email}
          disabled={readOnly}
          onChange={handleChange}
          required
        />
      </div>
      {/* Senha */}
      <div>
        <label className="block text-sm font-medium mb-1">Senha</label>
        <Input
          type="password"
          name="senha"
          value={form.senha}
          disabled={readOnly}
          onChange={handleChange}
          required={!readOnly}
          minLength={6}
        />
        {!readOnly && (
          <small className="text-xs text-muted-foreground">Mínimo 6 caracteres.</small>
        )}
      </div>
      {/* Confirmar Senha */}
      {!readOnly && (
        <div>
          <label className="block text-sm font-medium mb-1">Confirmar Senha</label>
          <Input
            type="password"
            name="confirmarSenha"
            value={form.confirmarSenha}
            onChange={handleChange}
            required={!readOnly}
            minLength={6}
            autoComplete="new-password"
          />
          {erroConfirmarSenha && (
            <small className="text-xs text-red-600">{erroConfirmarSenha}</small>
          )}
        </div>
      )}
      {/* Tipo */}
      <div>
        <label className="block text-sm font-medium mb-1">Tipo</label>
        <Select
          value={form.tipo}
          onValueChange={(value) => handleSelectChange("tipo", value)}
          disabled={readOnly}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Administrador">Administrador</SelectItem>
            <SelectItem value="Usuário">Usuário</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {/* Status */}
      <div>
        <label className="block text-sm font-medium mb-1">Status</label>
        <Select
          value={form.status}
          onValueChange={(value) => handleSelectChange("status", value)}
          disabled={readOnly}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ativo">Ativo</SelectItem>
            <SelectItem value="inativo">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {/* Empresa */}
      <div>
        <label className="block text-sm font-medium mb-1">Empresa (opcional)</label>
        <Input
          name="empresa_id"
          value={form.empresa_id || ""}
          onChange={handleChange}
          disabled={readOnly}
          placeholder="ID da empresa (UUID)"
        />
        {/* No futuro pode ser um select de empresas, por simplicidade mantido assim */}
      </div>
      {/* Campo Vendedor */}
      <div>
        <Label className="block text-sm font-medium mb-2">Vendedor</Label>
        <RadioGroup 
          value={form.vendedor} 
          onValueChange={(value) => handleVendedorChange(value as "sim" | "nao")}
          className="flex gap-4" 
          disabled={readOnly}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="sim" id="vendedor-sim" />
            <Label htmlFor="vendedor-sim">Sim</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="nao" id="vendedor-nao" />
            <Label htmlFor="vendedor-nao">Não</Label>
          </div>
        </RadioGroup>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          {readOnly ? "Fechar" : "Cancelar"}
        </Button>
        {!readOnly && (
          <Button type="submit" variant="blue">
            Salvar
          </Button>
        )}
      </div>
    </form>
  );
}
