import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search, Filter, User, UserCheck, UserX } from "lucide-react";
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

// Mock de usuários (interface simplificada)
type Usuario = {
  id: string;
  nome: string;
  email: string;
  senha: string;
  tipo: "Administrador" | "Usuário";
  status: "ativo" | "inativo";
  createdAt: Date;
  updatedAt: Date;
};

// Mock data inicial
const initialUsuarios: Usuario[] = [
  {
    id: "1",
    nome: "Marcos Almeida",
    email: "marcos@empresa.com",
    senha: "123456", // Apenas para mock/exemplo
    tipo: "Administrador",
    status: "ativo",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    nome: "Amanda Torres",
    email: "amanda@empresa.com",
    senha: "654321",
    tipo: "Usuário",
    status: "ativo",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    nome: "Breno Costa",
    email: "breno@empresa.com",
    senha: "senha123",
    tipo: "Usuário",
    status: "inativo",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>(initialUsuarios);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | undefined>(undefined);
  const [viewingUsuario, setViewingUsuario] = useState<Usuario | undefined>(undefined);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState<"todos" | "Administrador" | "Usuário">("todos");
  const [statusFilter, setStatusFilter] = useState<"todos" | "ativo" | "inativo">("todos");

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

  // Salvar/criar usuário
  const handleSubmit = (data: Partial<Usuario>) => {
    if (editingUsuario) {
      setUsuarios((prev) =>
        prev.map((u) =>
          u.id === editingUsuario.id
            ? { ...u, ...data, updatedAt: new Date() }
            : u
        )
      );
      toast.success("Usuário atualizado com sucesso!");
    } else {
      const novoUsuario: Usuario = {
        id: `${Date.now()}`,
        ...data as Usuario,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setUsuarios((prev) => [...prev, novoUsuario]);
      toast.success("Usuário criado com sucesso!");
    }
    handleCloseDialog();
  };

  // Excluir usuário
  const handleDelete = (id: string) => {
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
                  <TableHead className="w-[120px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsuarios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsuarios.map((usuario) => (
                    <TableRow key={usuario.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-blue-500" />
                          <span>{usuario.nome}</span>
                        </div>
                      </TableCell>
                      <TableCell>{usuario.email}</TableCell>
                      <TableCell>
                        {usuario.tipo === "Administrador" ? (
                          <UserCheck className="inline-block w-4 h-4 mr-1 text-blue-600" />
                        ) : (
                          <User className="inline-block w-4 h-4 mr-1 text-gray-400" />
                        )}
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
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-blue-500"
                            title="Editar"
                            onClick={() => handleOpenDialog(usuario)}
                          >
                            <UserCheck className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500"
                            title="Excluir"
                            onClick={() => handleDelete(usuario.id)}
                          >
                            <UserX className="w-4 h-4" />
                          </Button>
                        </div>
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

// ======= Componente do formulário =========
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

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErroConfirmarSenha(null);

    // Validação do campo de confirmação de senha
    if (!readOnly) {
      if (form.senha !== form.confirmarSenha) {
        setErroConfirmarSenha("As senhas não coincidem.");
        return;
      }
    }

    // Não enviar o campo de confirmação para o onSubmit
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
