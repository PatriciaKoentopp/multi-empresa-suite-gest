import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import { useCompany } from "@/contexts/company-context";
import { format } from "date-fns";

interface UsuariosFormProps {
  usuario?: {
    id: string;
    nome: string;
    email: string;
    tipo: string;
    vendedor: string;
    status: string;
    empresa_id: string;
    created_at: string;
    updated_at: string;
  };
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function UsuariosForm({ usuario, onSave, onCancel }: UsuariosFormProps) {
  const [nome, setNome] = useState(usuario?.nome || "");
  const [email, setEmail] = useState(usuario?.email || "");
  const [tipo, setTipo] = useState(usuario?.tipo || "Usuário");
  const [vendedor, setVendedor] = useState(usuario?.vendedor || "nao");
  const [status, setStatus] = useState(usuario?.status || "ativo");
  const { currentCompany } = useCompany();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome || !email) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const userData = {
      id: usuario?.id,
      nome,
      email,
      tipo: tipo as 'Admin' | 'Usuário',
      vendedor: vendedor as 'sim' | 'nao',
      status: status as 'ativo' | 'inativo',
      empresa_id: currentCompany?.id,
      created_at: usuario?.created_at || format(new Date(), 'yyyy-MM-dd'),
      updated_at: format(new Date(), 'yyyy-MM-dd')
    };

    await onSave(userData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="nome">Nome *</Label>
        <Input
          type="text"
          id="nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="email">Email *</Label>
        <Input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="tipo">Tipo</Label>
        <Select value={tipo} onValueChange={setTipo}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Usuário">Usuário</SelectItem>
            <SelectItem value="Admin">Administrador</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="vendedor">Vendedor</Label>
        <Select value={vendedor} onValueChange={setVendedor}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sim">Sim</SelectItem>
            <SelectItem value="nao">Não</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="status">Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione o status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ativo">Ativo</SelectItem>
            <SelectItem value="inativo">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Salvar</Button>
      </DialogFooter>
    </form>
  );
}
