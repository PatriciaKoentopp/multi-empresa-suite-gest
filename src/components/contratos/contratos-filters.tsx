
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ContratosFiltersProps {
  filtros: {
    codigo: string;
    favorecido: string;
    status: string;
    periodicidade: string;
  };
  onFiltrosChange: (filtros: {
    codigo: string;
    favorecido: string;
    status: string;
    periodicidade: string;
  }) => void;
}

export function ContratosFilters({ filtros, onFiltrosChange }: ContratosFiltersProps) {
  const handleFiltroChange = (key: string, value: string) => {
    onFiltrosChange({
      ...filtros,
      [key]: value,
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="space-y-2">
        <Label htmlFor="codigo">Código</Label>
        <Input
          id="codigo"
          placeholder="Filtrar por código..."
          value={filtros.codigo}
          onChange={(e) => handleFiltroChange("codigo", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="favorecido">Favorecido</Label>
        <Input
          id="favorecido"
          placeholder="Filtrar por favorecido..."
          value={filtros.favorecido}
          onChange={(e) => handleFiltroChange("favorecido", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select value={filtros.status} onValueChange={(value) => handleFiltroChange("status", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="ativo">Ativo</SelectItem>
            <SelectItem value="suspenso">Suspenso</SelectItem>
            <SelectItem value="encerrado">Encerrado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="periodicidade">Periodicidade</Label>
        <Select value={filtros.periodicidade} onValueChange={(value) => handleFiltroChange("periodicidade", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Todas as periodicidades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            <SelectItem value="mensal">Mensal</SelectItem>
            <SelectItem value="trimestral">Trimestral</SelectItem>
            <SelectItem value="semestral">Semestral</SelectItem>
            <SelectItem value="anual">Anual</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
