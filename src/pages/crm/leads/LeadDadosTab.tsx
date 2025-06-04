
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Origem, Usuario } from "@/types";
import { EtapaFunil } from "./types";

interface LeadDadosTabProps {
  formData: {
    nome: string;
    empresa: string;
    favorecido_id: string;
    produto: string;
    produto_id: string;
    servico_id: string;
    email: string;
    telefone: string;
    etapaId: string;
    valor: number;
    origemId: string;
    dataCriacao: string;
    ultimoContato: string;
    responsavelId: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
  etapas: EtapaFunil[];
  origensAtivas: Origem[];
  vendedoresAtivos: Usuario[];
}

export function LeadDadosTab({
  formData,
  handleChange,
  handleSelectChange,
  etapas,
  origensAtivas,
  vendedoresAtivos
}: LeadDadosTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome do Lead *</Label>
          <Input
            id="nome"
            name="nome"
            value={formData.nome}
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
          <Input
            id="telefone"
            name="telefone"
            value={formData.telefone || ""}
            onChange={handleChange}
            placeholder="(11) 99999-9999"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="etapaId">Etapa *</Label>
          <Select 
            value={formData.etapaId || "placeholder_stage"} 
            onValueChange={(value) => {
              if (value !== "placeholder_stage") {
                handleSelectChange("etapaId", value);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma etapa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="placeholder_stage" disabled>Selecione uma etapa</SelectItem>
              {etapas.map((etapa) => (
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
            value={formData.valor}
            onChange={handleChange}
            placeholder="0,00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="origemId">Origem</Label>
          <Select 
            value={formData.origemId || "placeholder_origin"} 
            onValueChange={(value) => {
              if (value !== "placeholder_origin") {
                handleSelectChange("origemId", value);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma origem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="placeholder_origin" disabled>Selecione uma origem</SelectItem>
              {origensAtivas.map((origem) => (
                <SelectItem key={origem.id} value={origem.id}>
                  {origem.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="responsavelId">Responsável</Label>
          <Select 
            value={formData.responsavelId || "placeholder_responsible"} 
            onValueChange={(value) => {
              if (value !== "placeholder_responsible") {
                handleSelectChange("responsavelId", value);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="placeholder_responsible" disabled>Selecione um responsável</SelectItem>
              {vendedoresAtivos.map((usuario) => (
                <SelectItem key={usuario.id} value={usuario.id}>
                  {usuario.nome}
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
