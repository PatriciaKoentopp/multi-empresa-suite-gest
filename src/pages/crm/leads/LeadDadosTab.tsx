
import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Favorecido } from "@/types";

interface LeadDadosTabProps {
  formData: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
  etapas: any[];
  origensAtivas: any[];
  vendedoresAtivos: any[];
  handleProdutoChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  favorecidos?: Favorecido[];
}

export function LeadDadosTab({
  formData,
  handleChange,
  handleSelectChange,
  etapas,
  origensAtivas,
  vendedoresAtivos,
  handleProdutoChange,
  favorecidos = []
}: LeadDadosTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nome</Label>
          <Input name="nome" value={formData.nome} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label>Empresa</Label>
          <Select
            value={formData.empresa}
            onValueChange={(value) => handleSelectChange("empresa", value)}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Selecione uma empresa" />
            </SelectTrigger>
            <SelectContent className="bg-white z-50">
              {favorecidos && favorecidos.length > 0 ? (
                favorecidos.map((favorecido: Favorecido) => (
                  <SelectItem 
                    key={favorecido.id} 
                    value={favorecido.nome_fantasia || favorecido.nome}
                  >
                    {favorecido.nome_fantasia || favorecido.nome}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="" disabled>
                  Nenhuma empresa cadastrada
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Produto</Label>
        <Input name="produto" value={formData.produto} onChange={handleProdutoChange ?? handleChange} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Email</Label>
          <Input name="email" value={formData.email} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label>Telefone</Label>
          <Input name="telefone" value={formData.telefone} onChange={handleChange} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Etapa</Label>
          <Select
            value={formData.etapaId?.toString()}
            onValueChange={(value) => handleSelectChange("etapaId", value)}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Selecione a etapa" />
            </SelectTrigger>
            <SelectContent className="bg-white z-50">
              {etapas.map((etapa: any) => (
                <SelectItem key={etapa.id} value={etapa.id.toString()}>
                  {etapa.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Origem</Label>
          <Select
            value={formData.origemId}
            onValueChange={(value) => handleSelectChange("origemId", value)}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Selecione a origem" />
            </SelectTrigger>
            <SelectContent className="bg-white z-50">
              {origensAtivas.map((origem: any) => (
                <SelectItem key={origem.id} value={origem.id}>
                  {origem.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Responsável</Label>
          <Select
            value={formData.responsavelId}
            onValueChange={(value) => handleSelectChange("responsavelId", value)}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Selecione o responsável" />
            </SelectTrigger>
            <SelectContent className="bg-white z-50">
              {vendedoresAtivos.map((u: any) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Valor Estimado</Label>
          <Input
            type="number"
            name="valor"
            value={formData.valor}
            onChange={handleChange}
          />
        </div>
      </div>
    </div>
  );
}
