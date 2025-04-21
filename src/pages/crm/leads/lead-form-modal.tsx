
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Origem } from "@/types";

interface Lead {
  id: number;
  nome: string;
  empresa: string;
  email: string;
  telefone: string;
  etapaId: number;
  valor: number;
  origemId: string; // Modificado para referenciar o ID da origem
  dataCriacao: string;
  ultimoContato: string;
  responsavel: string;
}

interface EtapaFunil {
  id: number;
  nome: string;
  cor: string;
  ordem: number;
}

interface LeadFormModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (lead: Omit<Lead, "id">) => void;
  lead?: Lead | null;
  etapas: EtapaFunil[];
  origens: Origem[]; // Adicionado prop para origens
}

export function LeadFormModal({ open, onClose, onConfirm, lead, etapas, origens }: LeadFormModalProps) {
  const [formData, setFormData] = useState({
    nome: "",
    empresa: "",
    email: "",
    telefone: "",
    etapaId: 1,
    valor: 0,
    origemId: "", // Modificado para origemId
    dataCriacao: new Date().toLocaleDateString("pt-BR"),
    ultimoContato: new Date().toLocaleDateString("pt-BR"),
    responsavel: "",
  });

  useEffect(() => {
    if (lead) {
      setFormData({
        nome: lead.nome,
        empresa: lead.empresa,
        email: lead.email,
        telefone: lead.telefone,
        etapaId: lead.etapaId,
        valor: lead.valor,
        origemId: lead.origemId, // Modificado para origemId
        dataCriacao: lead.dataCriacao,
        ultimoContato: lead.ultimoContato,
        responsavel: lead.responsavel,
      });
    } else {
      setFormData({
        nome: "",
        empresa: "",
        email: "",
        telefone: "",
        etapaId: etapas.length > 0 ? etapas[0].id : 1,
        valor: 0,
        origemId: origens.length > 0 ? origens[0].id : "", // Definido valor inicial
        dataCriacao: new Date().toLocaleDateString("pt-BR"),
        ultimoContato: new Date().toLocaleDateString("pt-BR"),
        responsavel: "",
      });
    }
  }, [lead, etapas, origens]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: name === "valor" ? Number(value) : value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ 
      ...prev, 
      [name]: name === "etapaId" ? Number(value) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(formData);
  };

  // Filtrar apenas origens ativas
  const origensAtivas = origens.filter(origem => origem.status === "ativo");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{lead ? "Editar Lead" : "Novo Lead"}</DialogTitle>
          <DialogDescription>
            {lead ? "Atualize as informações do lead" : "Preencha as informações para criar um novo lead"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  placeholder="Nome do contato"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="empresa">Empresa</Label>
                <Input
                  id="empresa"
                  name="empresa"
                  value={formData.empresa}
                  onChange={handleChange}
                  placeholder="Nome da empresa"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleChange}
                  placeholder="Telefone"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="etapa">Etapa do Funil</Label>
                <Select
                  value={String(formData.etapaId)}
                  onValueChange={(value) => handleSelectChange("etapaId", value)}
                >
                  <SelectTrigger id="etapa">
                    <SelectValue placeholder="Selecione a etapa" />
                  </SelectTrigger>
                  <SelectContent>
                    {etapas.map((etapa) => (
                      <SelectItem key={etapa.id} value={String(etapa.id)}>
                        {etapa.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="valor">Valor (R$)</Label>
                <Input
                  id="valor"
                  name="valor"
                  type="number"
                  value={formData.valor}
                  onChange={handleChange}
                  placeholder="Valor"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="origem">Origem</Label>
                <Select 
                  value={formData.origemId}
                  onValueChange={(value) => handleSelectChange("origemId", value)}
                >
                  <SelectTrigger id="origem" className="bg-white">
                    <SelectValue placeholder="Selecione a origem" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    {origensAtivas.map((origem) => (
                      <SelectItem key={origem.id} value={origem.id}>
                        {origem.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="responsavel">Responsável</Label>
                <Select
                  value={formData.responsavel}
                  onValueChange={(value) => handleSelectChange("responsavel", value)}
                >
                  <SelectTrigger id="responsavel" className="bg-white">
                    <SelectValue placeholder="Selecione o responsável" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    <SelectItem value="Ana Vendas">Ana Vendas</SelectItem>
                    <SelectItem value="Carlos Comercial">Carlos Comercial</SelectItem>
                    <SelectItem value="Pedro Marketing">Pedro Marketing</SelectItem>
                    <SelectItem value="Julia Atendimento">Julia Atendimento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="blue">
              {lead ? "Salvar Alterações" : "Criar Lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
