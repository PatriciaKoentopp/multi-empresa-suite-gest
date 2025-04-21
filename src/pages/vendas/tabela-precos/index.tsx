
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormItem, FormLabel, FormControl, FormMessage, FormField } from "@/components/ui/form";
import { CalendarIcon, Plus, Pencil, Tag } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Vigencia = { dataInicial: Date | null; dataFinal: Date | null };
type Servico = { id: number; nome: string; preco: number };

export default function TabelaPrecosPage() {
  const [nome, setNome] = useState("");
  const [vigencia, setVigencia] = useState<Vigencia>({ dataInicial: null, dataFinal: null });
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [novoServico, setNovoServico] = useState<{ nome: string; preco: string }>({ nome: "", preco: "" });

  function adicionarServico() {
    if (novoServico.nome && novoServico.preco) {
      setServicos([...servicos, {
        id: Date.now(),
        nome: novoServico.nome,
        preco: parseFloat(novoServico.preco.replace(",", "."))
      }]);
      setNovoServico({ nome: "", preco: "" });
    }
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md mt-8">
      <h1 className="text-lg font-bold flex items-center gap-2 mb-2">
        <Tag className="text-primary" /> Tabela de Preços
      </h1>
      <Form>
        <div className="mb-4">
          <FormItem>
            <FormLabel>Nome</FormLabel>
            <FormControl>
              <Input
                placeholder="Ex: Tabela 2025"
                value={nome}
                onChange={e => setNome(e.target.value)}
              />
            </FormControl>
          </FormItem>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Data de Início */}
          <FormItem>
            <FormLabel>Vigência (Início)</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {vigencia.dataInicial
                      ? format(vigencia.dataInicial, "dd/MM/yyyy", { locale: ptBR })
                      : <span>Selecione...</span>
                    }
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={vigencia.dataInicial}
                  onSelect={date => setVigencia(prev => ({ ...prev, dataInicial: date ?? null }))}
                  initialFocus
                  locale={ptBR}
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </FormItem>
          {/* Data Final */}
          <FormItem>
            <FormLabel>Vigência (Final)</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {vigencia.dataFinal
                      ? format(vigencia.dataFinal, "dd/MM/yyyy", { locale: ptBR })
                      : <span>Selecione...</span>
                    }
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={vigencia.dataFinal}
                  onSelect={date => setVigencia(prev => ({ ...prev, dataFinal: date ?? null }))}
                  initialFocus
                  locale={ptBR}
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </FormItem>
        </div>
        <div className="mb-8">
          <h2 className="font-semibold mb-2 flex items-center gap-2"><Plus className="w-4 h-4" /> Incluir Serviço e Preço</h2>
          <div className="grid grid-cols-1 md:grid-cols-8 gap-2 items-center">
            <Input
              placeholder="Serviço"
              className="md:col-span-4"
              value={novoServico.nome}
              onChange={e => setNovoServico(s => ({ ...s, nome: e.target.value }))}
            />
            <Input
              placeholder="Preço (R$)"
              type="number"
              step="0.01"
              min={0}
              className="md:col-span-3"
              value={novoServico.preco}
              onChange={e => setNovoServico(s => ({ ...s, preco: e.target.value }))}
            />
            <Button
              type="button"
              size="sm"
              className="md:col-span-1"
              onClick={adicionarServico}
              variant="secondary"
            >
              <Plus className="h-4 w-4 mr-1" /> Adicionar
            </Button>
          </div>
          {/* Listagem dos serviços adicionados */}
          <div className="mt-3">
            {servicos.length === 0 && (
              <div className="text-muted-foreground text-sm">Nenhum serviço adicionado ainda.</div>
            )}
            {servicos.length > 0 && (
              <table className="w-full border mt-2 rounded text-sm">
                <thead>
                  <tr className="bg-muted">
                    <th className="py-1 px-2 font-bold text-left">Serviço</th>
                    <th className="py-1 px-2 font-bold text-left">Preço (R$)</th>
                  </tr>
                </thead>
                <tbody>
                  {servicos.map(srv => (
                    <tr key={srv.id} className="border-t">
                      <td className="py-1 px-2">{srv.nome}</td>
                      <td className="py-1 px-2">
                        {srv.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="submit" variant="default" disabled>
            <Pencil className="w-4 h-4 mr-2" />
            Salvar (simulação)
          </Button>
        </div>
      </Form>
    </div>
  );
}
