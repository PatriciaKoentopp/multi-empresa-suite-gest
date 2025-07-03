import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function FavorecidoCadastroTab() {
  const [nomeFilter, setNomeFilter] = useState('');
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [grupoFilter, setGrupoFilter] = useState('todos');
  const [profissaoFilter, setProfissaoFilter] = useState('todos');
  const [dataInicio, setDataInicio] = useState<Date | undefined>(undefined);
  const [dataFim, setDataFim] = useState<Date | undefined>(undefined);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = {
      nome: nomeFilter,
      tipo: tipoFilter,
      grupo_id: grupoFilter === "todos" ? undefined : grupoFilter,
      profissao_id: profissaoFilter === "todos" ? undefined : profissaoFilter,
      data_inicio: dataInicio ? dataInicio.toISOString().split('T')[0] : undefined,
      data_fim: dataFim ? dataFim.toISOString().split('T')[0] : undefined,
    };
    console.log('Filtros aplicados:', formData);
  };

  const handleExport = () => {
    const exportData = {
      filtros: {
        nome: nomeFilter,
        tipo: tipoFilter,
        grupo_id: grupoFilter === "todos" ? undefined : grupoFilter,
        profissao_id: profissaoFilter === "todos" ? undefined : profissaoFilter,
        data_inicio: dataInicio ? dataInicio.toISOString().split('T')[0] : undefined,
        data_fim: dataFim ? dataFim.toISOString().split('T')[0] : undefined,
      }
    };
    console.log('Exportando dados:', exportData);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Nome */}
        <div>
          <Label htmlFor="nome">Nome</Label>
          <Input
            type="text"
            id="nome"
            value={nomeFilter}
            onChange={(e) => setNomeFilter(e.target.value)}
            placeholder="Digite o nome"
          />
        </div>

        {/* Tipo */}
        <div>
          <Label htmlFor="tipo">Tipo</Label>
          <Select value={tipoFilter} onValueChange={setTipoFilter}>
            <SelectTrigger id="tipo">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="fisica">Física</SelectItem>
              <SelectItem value="juridica">Jurídica</SelectItem>
              <SelectItem value="publico">Público</SelectItem>
              <SelectItem value="funcionario">Funcionário</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Grupo */}
        <div>
          <Label htmlFor="grupo">Grupo</Label>
          <Select value={grupoFilter} onValueChange={setGrupoFilter}>
            <SelectTrigger id="grupo">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {/* Aqui você pode adicionar os grupos dinamicamente */}
              <SelectItem value="grupo1">Grupo 1</SelectItem>
              <SelectItem value="grupo2">Grupo 2</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Profissão */}
        <div>
          <Label htmlFor="profissao">Profissão</Label>
          <Select value={profissaoFilter} onValueChange={setProfissaoFilter}>
            <SelectTrigger id="profissao">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas</SelectItem>
              {/* Aqui você pode adicionar as profissões dinamicamente */}
              <SelectItem value="profissao1">Profissão 1</SelectItem>
              <SelectItem value="profissao2">Profissão 2</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Data de Início */}
        <div>
          <Label>Data de Início</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dataInicio ? (
                  format(dataInicio, "dd/MM/yyyy", { locale: ptBR })
                ) : (
                  <span>Selecione a data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dataInicio}
                onSelect={setDataInicio}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Data de Fim */}
        <div>
          <Label>Data de Fim</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dataFim ? (
                  format(dataFim, "dd/MM/yyyy", { locale: ptBR })
                ) : (
                  <span>Selecione a data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dataFim}
                onSelect={setDataFim}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Ações */}
      <div className="flex justify-end gap-2">
        <Button type="submit" variant="blue">
          Aplicar Filtros
        </Button>
        <Button type="button" variant="outline" onClick={handleExport}>
          Exportar
        </Button>
      </div>
    </form>
  );
}
