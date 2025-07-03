
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FiltroFluxoCaixa } from "@/types/financeiro";
import { subDays } from "date-fns";

interface FluxoCaixaFilterProps {
  filtro: FiltroFluxoCaixa;
  onFiltroChange: (filtro: FiltroFluxoCaixa) => void;
  contasCorrentes: { id: string; nome: string }[];
}

export function FluxoCaixaFilter({ filtro, onFiltroChange, contasCorrentes }: FluxoCaixaFilterProps) {
  const [dataInicio, setDataInicio] = useState<Date | undefined>(filtro.dataInicio);
  const [dataFim, setDataFim] = useState<Date | undefined>(filtro.dataFim);
  const [contaId, setContaId] = useState<string>(filtro.contaId || '');
  const [situacao, setSituacao] = useState<string>(filtro.situacao || '');

  useEffect(() => {
    setDataInicio(filtro.dataInicio);
    setDataFim(filtro.dataFim);
    setContaId(filtro.contaId || '');
    setSituacao(filtro.situacao || '');
  }, [filtro]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltroChange({
      dataInicio,
      dataFim,
      conta_corrente_id: contaId,
      contaId,
      situacao
    });
  };

  const handleLimpar = () => {
    const novoFiltro = {
      dataInicio: subDays(new Date(), 30),
      dataFim: new Date(),
      conta_corrente_id: '',
      contaId: '',
      situacao: ''
    };
    
    setDataInicio(novoFiltro.dataInicio);
    setDataFim(novoFiltro.dataFim);
    setContaId('');
    setSituacao('');
    
    onFiltroChange(novoFiltro);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end">
      <div className="flex flex-col">
        <Label htmlFor="dataInicio">Data Início</Label>
        <Input
          type="date"
          id="dataInicio"
          value={dataInicio ? dataInicio.toISOString().split('T')[0] : ''}
          onChange={(e) => setDataInicio(e.target.value ? new Date(e.target.value) : undefined)}
        />
      </div>

      <div className="flex flex-col">
        <Label htmlFor="dataFim">Data Fim</Label>
        <Input
          type="date"
          id="dataFim"
          value={dataFim ? dataFim.toISOString().split('T')[0] : ''}
          onChange={(e) => setDataFim(e.target.value ? new Date(e.target.value) : undefined)}
        />
      </div>

      <div className="flex flex-col">
        <Label htmlFor="contaCorrente">Conta Corrente</Label>
        <Select value={contaId} onValueChange={setContaId}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Selecione a conta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas</SelectItem>
            {contasCorrentes.map((conta) => (
              <SelectItem key={conta.id} value={conta.id}>
                {conta.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col">
        <Label htmlFor="situacao">Situação</Label>
        <Select value={situacao} onValueChange={setSituacao}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Selecione a situação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button type="submit" variant="blue">
          Filtrar
        </Button>
        <Button type="button" variant="outline" onClick={handleLimpar}>
          Limpar
        </Button>
      </div>
    </form>
  );
}
