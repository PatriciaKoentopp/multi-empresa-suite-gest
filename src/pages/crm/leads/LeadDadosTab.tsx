
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Origem, Usuario } from "@/types";
import { EtapaFunil } from "./types";
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
  const { favorecidos, isLoading: loadingFavorecidos } = useFavorecidos();

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
          <Select 
            value={formData.favorecido_id || "none"} 
            onValueChange={(value) => {
              if (value === "none") {
                handleSelectChange("favorecido_id", "");
                handleSelectChange("empresa", "");
              } else {
                handleSelectChange("favorecido_id", value);
                // Encontrar o favorecido selecionado e preencher o campo empresa
                const favorecidoSelecionado = favorecidos.find(f => f.id === value);
                if (favorecidoSelecionado) {
                  handleSelectChange("empresa", favorecidoSelecionado.nome);
                }
              }
            }}
            disabled={loadingFavorecidos}
          >
            <SelectTrigger>
              <SelectValue placeholder={loadingFavorecidos ? "Carregando..." : "Selecione uma empresa (opcional)"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhuma empresa</SelectItem>
              {favorecidos.map((favorecido) => (
                <SelectItem key={favorecido.id} value={favorecido.id}>
                  {favorecido.nome} - {favorecido.documento}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            value={formData.etapaId} 
            onValueChange={(value) => handleSelectChange("etapaId", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma etapa" />
            </SelectTrigger>
            <SelectContent>
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
            value={formData.origemId} 
            onValueChange={(value) => handleSelectChange("origemId", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma origem" />
            </SelectTrigger>
            <SelectContent>
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
            value={formData.responsavelId} 
            onValueChange={(value) => handleSelectChange("responsavelId", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um responsável" />
            </SelectTrigger>
            <SelectContent>
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
