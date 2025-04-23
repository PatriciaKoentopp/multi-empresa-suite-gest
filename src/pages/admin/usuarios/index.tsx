
import React, { useState, useEffect } from "react";
import { useCompany } from "@/contexts/company-context";
import { useToast } from "@/hooks/use-toast";
import { Usuario } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Interface para as props do formulário de usuário
interface UsuarioFormProps {
  usuario?: Partial<Usuario>;
  readOnly?: boolean;
  onSubmit: (usuario: Partial<Usuario>) => void;
  onCancel: () => void;
}

// Componente de formulário do usuário
function UsuarioForm({ usuario, readOnly, onSubmit, onCancel }: UsuarioFormProps) {
  const [form, setForm] = useState<Partial<Usuario>>({
    nome: usuario?.nome || "",
    email: usuario?.email || "",
    tipo: usuario?.tipo || "Usuário",
    status: usuario?.status || "ativo",
    vendedor: usuario?.vendedor || "nao",
  });

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
    onSubmit(form);
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

// Página principal de Usuários
const UsuariosPage: React.FC = () => {
  const { company } = useCompany();
  const { toast } = useToast();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentUsuario, setCurrentUsuario] = useState<Partial<Usuario> | null>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create");
  
  // Carregar usuários
  useEffect(() => {
    if (company) {
      loadUsuarios();
    }
  }, [company]);

  const loadUsuarios = async () => {
    try {
      setIsLoading(true);
      // Simulação de carregamento de dados - em produção usaria Supabase ou API
      const mockUsuarios: Usuario[] = [
        {
          id: '1',
          nome: 'Administrador',
          email: 'admin@exemplo.com',
          tipo: 'Administrador',
          status: 'ativo',
          vendedor: 'nao',
          senha: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          nome: 'Usuário Comum',
          email: 'usuario@exemplo.com',
          tipo: 'Usuário',
          status: 'ativo',
          vendedor: 'sim',
          senha: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];
      
      setUsuarios(mockUsuarios);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os usuários.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Abrir modal para criar usuário
  const handleCreateUsuario = () => {
    setCurrentUsuario(null);
    setModalMode("create");
    setModalOpen(true);
  };

  // Abrir modal para editar usuário
  const handleEditUsuario = (usuario: Usuario) => {
    setCurrentUsuario(usuario);
    setModalMode("edit");
    setModalOpen(true);
  };

  // Abrir modal para visualizar usuário
  const handleViewUsuario = (usuario: Usuario) => {
    setCurrentUsuario(usuario);
    setModalMode("view");
    setModalOpen(true);
  };

  // Salvar usuário (criar ou atualizar)
  const handleSaveUsuario = async (usuarioData: Partial<Usuario>) => {
    try {
      if (modalMode === "create") {
        // Em produção: chamar API/Supabase para criar usuário
        const novoUsuario: Usuario = {
          id: Math.random().toString(36).substr(2, 9),
          ...usuarioData,
          senha: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Usuario;
        
        setUsuarios([...usuarios, novoUsuario]);
        toast({
          title: "Sucesso",
          description: "Usuário criado com sucesso.",
        });
      } else if (modalMode === "edit" && currentUsuario) {
        // Em produção: chamar API/Supabase para atualizar usuário
        const updatedUsuarios = usuarios.map(u => 
          u.id === currentUsuario.id 
            ? { ...u, ...usuarioData, updatedAt: new Date() } 
            : u
        );
        
        setUsuarios(updatedUsuarios);
        toast({
          title: "Sucesso",
          description: "Usuário atualizado com sucesso.",
        });
      }
      
      setModalOpen(false);
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o usuário.",
        variant: "destructive",
      });
    }
  };

  // Alterar status do usuário
  const handleToggleStatus = async (usuario: Usuario) => {
    try {
      const newStatus = usuario.status === 'ativo' ? 'inativo' : 'ativo';
      // Em produção: chamar API/Supabase para atualizar status
      
      const updatedUsuarios = usuarios.map(u => 
        u.id === usuario.id 
          ? { ...u, status: newStatus, updatedAt: new Date() } 
          : u
      );
      
      setUsuarios(updatedUsuarios);
      
      toast({
        title: "Sucesso",
        description: `Usuário ${newStatus === 'ativo' ? 'ativado' : 'inativado'} com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao alterar status do usuário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status do usuário.",
        variant: "destructive",
      });
    }
  };

  const getModalTitle = () => {
    switch (modalMode) {
      case "create":
        return "Novo Usuário";
      case "edit":
        return "Editar Usuário";
      case "view":
        return "Detalhes do Usuário";
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Usuários</h1>
        <Button variant="blue" onClick={handleCreateUsuario}>
          Novo Usuário
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center p-6">
              <p>Carregando...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  usuarios.map((usuario) => (
                    <TableRow key={usuario.id}>
                      <TableCell>{usuario.nome}</TableCell>
                      <TableCell>{usuario.email}</TableCell>
                      <TableCell>{usuario.tipo}</TableCell>
                      <TableCell>{usuario.vendedor === 'sim' ? 'Sim' : 'Não'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          usuario.status === 'ativo' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {usuario.status === 'ativo' ? 'Ativo' : 'Inativo'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewUsuario(usuario)}
                          >
                            Ver
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditUsuario(usuario)}
                          >
                            Editar
                          </Button>
                          <Button 
                            variant={usuario.status === 'ativo' ? 'warning' : 'success'} 
                            size="sm"
                            onClick={() => handleToggleStatus(usuario)}
                          >
                            {usuario.status === 'ativo' ? 'Inativar' : 'Ativar'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal para criar/editar/visualizar usuário */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{getModalTitle()}</DialogTitle>
          </DialogHeader>
          <UsuarioForm
            usuario={currentUsuario || {}}
            readOnly={modalMode === "view"}
            onSubmit={handleSaveUsuario}
            onCancel={() => setModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsuariosPage;
