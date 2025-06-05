
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { LeadFormData, EtapaFunil } from "./types";

interface LeadDadosTabProps {
  formData: Partial<LeadFormData>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleNumberChange: (name: string, value: number | undefined) => void;
  funis: any[];
  etapas: EtapaFunil[];
  origens: any[];
  favorecidos: any[];
  servicos: any[];
  produtos: any[];
  onWhatsAppClick: () => void;
}

export function LeadDadosTab({
  formData,
  handleChange,
  handleNumberChange,
  funis,
  etapas,
  origens,
  favorecidos,
  servicos,
  produtos,
  onWhatsAppClick
}: LeadDadosTabProps) {
  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value ? parseFloat(e.target.value) : undefined;
    handleNumberChange('valor', value);
  };

  // Filtrar dados válidos
  const funisValidos = (funis || []).filter(f => f && f.id && f.nome);
  const etapasValidas = (etapas || []).filter(e => e && e.id && e.nome);
  const origensValidas = (origens || []).filter(o => o && o.id && o.nome);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome do Lead *</Label>
          <Input
            id="nome"
            name="nome"
            value={formData.nome || ""}
            onChange={handleChange}
            placeholder="Nome completo do lead"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="empresa">Empresa</Label>
          <Input
            id="empresa"
            name="empresa"
            value={formData.empresa || ""}
            onChange={handleChange}
            placeholder="Nome da empresa (opcional)"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email || ""}
            onChange={handleChange}
            placeholder="email@exemplo.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="telefone">Telefone</Label>
          <div className="flex gap-2">
            <Input
              id="telefone"
              name="telefone"
              value={formData.telefone || ""}
              onChange={handleChange}
              placeholder="(11) 99999-9999"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onWhatsAppClick}
              disabled={!formData.telefone}
              title="Abrir WhatsApp"
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="funil_id">Funil *</Label>
          <select
            id="funil_id"
            name="funil_id"
            value={formData.funil_id || ""}
            onChange={handleChange}
            className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md bg-white"
            required
          >
            <option value="">Selecione um funil</option>
            {funisValidos.map((funil) => (
              <option key={funil.id} value={funil.id}>
                {funil.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="etapa_id">Etapa *</Label>
          <select
            id="etapa_id"
            name="etapa_id"
            value={formData.etapa_id || ""}
            onChange={handleChange}
            className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md bg-white"
            required
          >
            <option value="">Selecione uma etapa</option>
            {etapasValidas.map((etapa) => (
              <option key={etapa.id} value={etapa.id}>
                {etapa.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="valor">Valor Estimado</Label>
          <Input
            id="valor"
            name="valor"
            type="number"
            step="0.01"
            value={formData.valor || ""}
            onChange={handleValorChange}
            placeholder="0,00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="origem_id">Origem</Label>
          <select
            id="origem_id"
            name="origem_id"
            value={formData.origem_id || ""}
            onChange={handleChange}
            className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md bg-white"
          >
            <option value="">Selecione uma origem</option>
            {origensValidas.map((origem) => (
              <option key={origem.id} value={origem.id}>
                {origem.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="produto">Produto/Serviço</Label>
          <Input
            id="produto"
            name="produto"
            value={formData.produto || ""}
            onChange={handleChange}
            placeholder="Produto ou serviço de interesse"
          />
        </div>
      </div>
    </div>
  );
}
