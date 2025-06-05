
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { LeadFormData, EtapaFunil } from "./types";

interface LeadDadosTabProps {
  formData: Partial<LeadFormData>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
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
  const handleSelectChange = (name: string, value: string) => {
    const event = {
      target: { name, value }
    } as React.ChangeEvent<HTMLInputElement>;
    handleChange(event);
  };

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value ? parseFloat(e.target.value) : undefined;
    handleNumberChange('valor', value);
  };

  // Filtrar dados para evitar IDs vazios
  const funisValidos = funis.filter(funil => funil.id && funil.id.trim() !== "");
  const etapasValidas = etapas.filter(etapa => etapa.id && etapa.id.trim() !== "");
  const origensValidas = origens.filter(origem => origem.id && origem.id.trim() !== "");

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
          <Select 
            value={formData.funil_id || ""} 
            onValueChange={(value) => handleSelectChange("funil_id", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um funil" />
            </SelectTrigger>
            <SelectContent>
              {funisValidos.map((funil) => (
                <SelectItem key={funil.id} value={funil.id}>
                  {funil.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="etapa_id">Etapa *</Label>
          <Select 
            value={formData.etapa_id || ""} 
            onValueChange={(value) => handleSelectChange("etapa_id", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma etapa" />
            </SelectTrigger>
            <SelectContent>
              {etapasValidas.map((etapa) => (
                <SelectItem key={etapa.id} value={etapa.id}>
                  {etapa.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <Select 
            value={formData.origem_id || "no_origin"} 
            onValueChange={(value) => handleSelectChange("origem_id", value === "no_origin" ? "" : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma origem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no_origin">Nenhuma origem</SelectItem>
              {origensValidas.map((origem) => (
                <SelectItem key={origem.id} value={origem.id}>
                  {origem.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
