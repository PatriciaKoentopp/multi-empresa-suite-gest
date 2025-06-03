import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { useQuery } from "@tanstack/react-query";
import { FiltroFluxoCaixa } from "@/types/financeiro";

interface FluxoCaixaFilterProps {
  onFilterChange: (filtros: FiltroFluxoCaixa) => void;
}

export function FluxoCaixaFilter({ onFilterChange }: FluxoCaixaFilterProps) {
  const [dataInicio, setDataInicio] = useState<Date>(new Date());
  const [dataFim, setDataFim] = useState<Date>(new Date());
  const [contaId, setContaId] = useState<string>("");
  const [situacao, setSituacao] = useState<string>("");
  const { currentCompany } = useCompany();

  const { data: contasCorrente = [] } = useQuery({
    queryKey: ["contas-correntes", currentCompany?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contas_correntes")
        .select("*")
        .eq("empresa_id", currentCompany?.id)
        .eq("status", "ativo");

      if (error) {
        console.error("Erro ao buscar contas correntes:", error);
        return [];
      }

      return data;
    },
    enabled: !!currentCompany?.id,
  });

  const handleFilterSubmit = () => {
    onFilterChange({
      dataInicio,
      dataFim,
      conta_corrente_id: contaId,
      situacao
    });
  };

  const handleClearFilters = () => {
    setDataInicio(new Date());
    setDataFim(new Date());
    setContaId("");
    setSituacao("");
    
    onFilterChange({
      dataInicio: new Date(),
      dataFim: new Date(),
      conta_corrente_id: "",
      situacao: ""
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Filtros</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="flex flex-wrap gap-4 mb-6 items-end">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Data Início</label>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                className="w-full"
                value={format(dataInicio, "yyyy-MM-dd")}
                onChange={e => setDataInicio(new Date(e.target.value + "T00:00:00"))}
              />
              <Calendar className="text-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Data Fim</label>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                className="w-full"
                value={format(dataFim, "yyyy-MM-dd")}
                onChange={e => setDataFim(new Date(e.target.value + "T00:00:00"))}
              />
              <Calendar className="text-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Conta Corrente</label>
            <Select value={contaId} onValueChange={setContaId}>
              <SelectTrigger className="w-[180px] bg-white">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="">Todas</SelectItem>
                {contasCorrente.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id}>{opt.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Situação</label>
            <Select value={situacao} onValueChange={setSituacao}>
              <SelectTrigger className="w-[180px] bg-white">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="">Todas</SelectItem>
                <SelectItem value="conciliado">Conciliado</SelectItem>
                <SelectItem value="nao_conciliado">Não Conciliado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Button type="button" size="sm" onClick={handleFilterSubmit}>
              Filtrar
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={handleClearFilters}>
              Limpar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
