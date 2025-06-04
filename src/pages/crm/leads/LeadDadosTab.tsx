
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Origem, Usuario } from "@/types";
import { EtapaFunil } from "./types";
import { FavorecidoSelect } from "@/components/ui/favorecido-select";
import { useFavorecidos } from "@/hooks/useFavorecidos";

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
  const { favorecidos } = useFavorecidos();

  const handleFavorecidoChange = (favorecidoId: string) => {
    handleSelectChange("favorecido_id", favorecidoId);
    
    // Se um favorecido foi selecionado, preencher o campo empresa
    if (favorecidoId) {
      const favorecidoSelecionado = favorecidos.find(f => f.id === favorecidoId);
      if (favorecidoSelecionado) {
        handleSelectChange("empresa", favorecidoSelecionado.nome);
      }
    } else {
      // Se nenhum favorecido selecionado, limpar o campo empresa
      handleSelectChange("empresa", "");
    }
  };

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
          <FavorecidoSelect
            value={formData.favorecido_id}
            onValueChange={handleFavorecidoChange}
            placeholder="Selecione uma empresa (opcional)"
            allowEmpty={true}
            emptyLabel="Nenhuma empresa"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="email@exemplo.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="telefone">Telefone</Label>
          <Input
            id="telefone"
            name="telefone"
            value={formData.telefone}
            onChange={handleChange}
            placeholder="(11) 99999-9999"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="etapaId">Etapa *</Label>
          <Select 
            value={formData.etapaId || "no_stage"} 
            onValueChange={(value) => {
              if (value !== "no_stage") {
                handleSelectChange("etapaId", value);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma etapa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no_stage" disabled>Selecione uma etapa</SelectItem>
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
            value={formData.origemId || "no_origin"} 
            onValueChange={(value) => {
              if (value !== "no_origin") {
                handleSelectChange("origemId", value);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma origem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no_origin" disabled>Selecione uma origem</SelectItem>
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
            value={formData.responsavelId || "no_responsible"} 
            onValueChange={(value) => {
              if (value !== "no_responsible") {
                handleSelectChange("responsavelId", value);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no_responsible" disabled>Selecione um responsável</SelectItem>
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
            value={formData.produto}
            onChange={handleChange}
            placeholder="Produto ou serviço de interesse"
          />
        </div>
      </div>
    </div>
  );
}
