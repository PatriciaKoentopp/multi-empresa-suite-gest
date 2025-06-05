
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Lead {
  id: string;
  nome: string;
  empresa?: string;
  email?: string;
  telefone?: string;
  valor?: number;
  status: string;
  etapa_id: string;
  funil_id: string;
  origem_id?: string;
  produto?: string;
  observacoes?: string;
}

interface Funil {
  id: string;
  nome: string;
}

interface Etapa {
  id: string;
  nome: string;
  funil_id: string;
}

interface Origem {
  id: string;
  nome: string;
}

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead?: Lead | null;
  funis: Funil[];
  etapas: Etapa[];
  origens: Origem[];
  onSave: (leadData: Partial<Lead>) => void;
}

export function LeadModal({ 
  isOpen, 
  onClose, 
  lead, 
  funis, 
  etapas, 
  origens, 
  onSave 
}: LeadModalProps) {
  const [formData, setFormData] = useState({
    nome: '',
    empresa: '',
    email: '',
    telefone: '',
    valor: '',
    funil_id: '',
    etapa_id: '',
    origem_id: '',
    produto: '',
    observacoes: ''
  });

  useEffect(() => {
    if (lead) {
      setFormData({
        nome: lead.nome || '',
        empresa: lead.empresa || '',
        email: lead.email || '',
        telefone: lead.telefone || '',
        valor: lead.valor?.toString() || '',
        funil_id: lead.funil_id || '',
        etapa_id: lead.etapa_id || '',
        origem_id: lead.origem_id || '',
        produto: lead.produto || '',
        observacoes: lead.observacoes || ''
      });
    } else {
      setFormData({
        nome: '',
        empresa: '',
        email: '',
        telefone: '',
        valor: '',
        funil_id: funis[0]?.id || '',
        etapa_id: '',
        origem_id: '',
        produto: '',
        observacoes: ''
      });
    }
  }, [lead, funis, isOpen]);

  useEffect(() => {
    // Quando o funil muda, selecionar a primeira etapa desse funil
    if (formData.funil_id) {
      const etapasDoFunil = etapas.filter(e => e.funil_id === formData.funil_id);
      if (etapasDoFunil.length > 0 && !formData.etapa_id) {
        setFormData(prev => ({ ...prev, etapa_id: etapasDoFunil[0].id }));
      }
    }
  }, [formData.funil_id, etapas]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!formData.nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    if (!formData.funil_id) {
      toast.error('Funil é obrigatório');
      return;
    }

    if (!formData.etapa_id) {
      toast.error('Etapa é obrigatória');
      return;
    }

    const leadData = {
      nome: formData.nome,
      empresa: formData.empresa || undefined,
      email: formData.email || undefined,
      telefone: formData.telefone || undefined,
      valor: formData.valor ? parseFloat(formData.valor) : undefined,
      funil_id: formData.funil_id,
      etapa_id: formData.etapa_id,
      origem_id: formData.origem_id || undefined,
      produto: formData.produto || undefined,
      observacoes: formData.observacoes || undefined
    };

    onSave(leadData);
  };

  const etapasDoFunil = etapas.filter(e => e.funil_id === formData.funil_id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lead ? "Editar Lead" : "Novo Lead"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                placeholder="Nome do lead"
              />
            </div>
            <div>
              <Label htmlFor="empresa">Empresa</Label>
              <Input
                id="empresa"
                value={formData.empresa}
                onChange={(e) => handleInputChange('empresa', e.target.value)}
                placeholder="Empresa"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => handleInputChange('telefone', e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="funil">Funil *</Label>
              <select
                id="funil"
                value={formData.funil_id}
                onChange={(e) => handleInputChange('funil_id', e.target.value)}
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md bg-white"
              >
                <option value="">Selecione um funil</option>
                {funis.map(funil => (
                  <option key={funil.id} value={funil.id}>
                    {funil.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="etapa">Etapa *</Label>
              <select
                id="etapa"
                value={formData.etapa_id}
                onChange={(e) => handleInputChange('etapa_id', e.target.value)}
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md bg-white"
                disabled={!formData.funil_id}
              >
                <option value="">Selecione uma etapa</option>
                {etapasDoFunil.map(etapa => (
                  <option key={etapa.id} value={etapa.id}>
                    {etapa.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="valor">Valor Estimado</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                value={formData.valor}
                onChange={(e) => handleInputChange('valor', e.target.value)}
                placeholder="0,00"
              />
            </div>
            <div>
              <Label htmlFor="origem">Origem</Label>
              <select
                id="origem"
                value={formData.origem_id}
                onChange={(e) => handleInputChange('origem_id', e.target.value)}
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md bg-white"
              >
                <option value="">Selecione uma origem</option>
                {origens.map(origem => (
                  <option key={origem.id} value={origem.id}>
                    {origem.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="produto">Produto/Serviço</Label>
            <Input
              id="produto"
              value={formData.produto}
              onChange={(e) => handleInputChange('produto', e.target.value)}
              placeholder="Produto ou serviço de interesse"
            />
          </div>

          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => handleInputChange('observacoes', e.target.value)}
              placeholder="Observações sobre o lead..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
