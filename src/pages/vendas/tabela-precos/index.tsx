
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { CalendarIcon, Plus, Pencil, Tag } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Table, TableHead, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";

type Vigencia = { dataInicial: Date | null; dataFinal: Date | null };
type Servico = { id: number; nome: string; precoPadrao: number };

type TabelaPreco = {
  id: number;
  nome: string;
  vigencia: Vigencia;
  servicos: { servicoId: number; nome: string; preco: number }[];
};

const MOCK_SERVICOS: Servico[] = [
  { id: 1, nome: "Consultoria Fiscal", precoPadrao: 700 },
  { id: 2, nome: "Auditoria", precoPadrao: 3500 },
  { id: 3, nome: "Abertura de Empresa", precoPadrao: 1200 },
  { id: 4, nome: "Encerramento de Empresa", precoPadrao: 950 }
];

export default function TabelaPrecosPage() {
  const form = useForm();
  
  // Estado geral de tabelas de preço
  const [tabelas, setTabelas] = useState<TabelaPreco[]>([]);

  // Estado da tabela atualmente sendo criada
  const [nome, setNome] = useState("");
  const [vigencia, setVigencia] = useState<Vigencia>({ dataInicial: null, dataFinal: null });
  const [servicosTabela, setServicosTabela] = useState<{ servicoId: number; nome: string; preco: number }[]>([]);
  const [novoServicoId, setNovoServicoId] = useState<number | "">("");
  const [novoPreco, setNovoPreco] = useState<string>("");

  function adicionarServico() {
    if (!novoServicoId || novoPreco === "") return;

    // Evitar duplicado
    if (servicosTabela.find(s => s.servicoId === novoServicoId)) {
      toast({ title: "Serviço já adicionado!" });
      return;
    }

    const servicoObj = MOCK_SERVICOS.find(s => s.id === novoServicoId);
    if (!servicoObj) return;

    setServicosTabela(prev => [
      ...prev,
      { servicoId: servicoObj.id, nome: servicoObj.nome, preco: parseFloat(novoPreco.replace(",", ".")) }
    ]);
    setNovoServicoId("");
    setNovoPreco("");
  }

  function removerServico(servicoId: number) {
    setServicosTabela(prev => prev.filter(s => s.servicoId !== servicoId));
  }

  function salvarTabela() {
    if (!nome || !vigencia.dataInicial || !vigencia.dataFinal || !servicosTabela.length) {
      toast({ title: "Preencha todos os campos obrigatórios!" });
      return;
    }
    setTabelas(old =>
      [
        ...old,
        {
          id: Date.now(),
          nome,
          vigencia: { ...vigencia },
          servicos: [...servicosTabela]
        }
      ]
    );
    setNome("");
    setVigencia({ dataInicial: null, dataFinal: null });
    setServicosTabela([]);
    setNovoServicoId("");
    setNovoPreco("");
    toast({ title: "Tabela de preços salva com sucesso!" });
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md mt-8">
      <h1 className="text-lg font-bold flex items-center gap-2 mb-2">
        <Tag className="text-primary" /> Tabela de Preços
      </h1>

      <Form {...form}>
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
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      "bg-white/70 hover:bg-white/90" // Transparência clara
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {vigencia.dataInicial
                      ? format(vigencia.dataInicial, "dd/MM/yyyy", { locale: ptBR })
                      : <span className="text-muted-foreground">Selecione...</span>
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
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      "bg-white/70 hover:bg-white/90" // Transparência clara
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {vigencia.dataFinal
                      ? format(vigencia.dataFinal, "dd/MM/yyyy", { locale: ptBR })
                      : <span className="text-muted-foreground">Selecione...</span>
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
          <h2 className="font-semibold mb-2 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Incluir Serviço e Preço
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-8 gap-2 items-center">
            {/* Select de Serviços */}
            <select
              className="border rounded px-2 py-1 md:col-span-4 bg-white"
              value={novoServicoId}
              onChange={e => setNovoServicoId(Number(e.target.value) || "")}
            >
              <option value="">Selecione um serviço...</option>
              {MOCK_SERVICOS
                .filter(s => !servicosTabela.some(st => st.servicoId === s.id))
                .map(s => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
            </select>
            <Input
              placeholder="Preço (R$)"
              type="number"
              step="0.01"
              min={0}
              className="md:col-span-3"
              value={novoPreco}
              onChange={e => setNovoPreco(e.target.value)}
              disabled={!novoServicoId}
            />
            <Button
              type="button"
              size="sm"
              className="md:col-span-1"
              onClick={adicionarServico}
              variant="secondary"
              disabled={!novoServicoId || !novoPreco}
            >
              <Plus className="h-4 w-4 mr-1" /> Adicionar
            </Button>
          </div>
          {/* Listagem dos serviços adicionados */}
          <div className="mt-3">
            {servicosTabela.length === 0 && (
              <div className="text-muted-foreground text-sm">Nenhum serviço adicionado ainda.</div>
            )}
            {servicosTabela.length > 0 && (
              <table className="w-full border mt-2 rounded text-sm">
                <thead>
                  <tr className="bg-muted">
                    <th className="py-1 px-2 font-bold text-left">Serviço</th>
                    <th className="py-1 px-2 font-bold text-left">Preço (R$)</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {servicosTabela.map(srv => (
                    <tr key={srv.servicoId} className="border-t">
                      <td className="py-1 px-2">{srv.nome}</td>
                      <td className="py-1 px-2">
                        {srv.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <Button variant="outline" size="sm" onClick={() => removerServico(srv.servicoId)}>
                          Remover
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="default"
            onClick={salvarTabela}
            disabled={!nome || !vigencia.dataInicial || !vigencia.dataFinal || !servicosTabela.length}
          >
            <Pencil className="w-4 h-4 mr-2" />
            Salvar Tabela
          </Button>
        </div>
      </Form>

      {/* Listagem de tabelas cadastradas */}
      <div className="mt-10">
        <h2 className="font-semibold text-md mb-3">Tabelas de Preço Cadastradas</h2>
        {tabelas.length === 0 && (
          <div className="text-muted-foreground text-sm">Nenhuma tabela cadastrada ainda.</div>
        )}
        <div className="space-y-5">
          {tabelas.map(tab => (
            <div key={tab.id} className="rounded border p-4 shadow-sm bg-white/90">
              <div className="flex justify-between items-center pb-2 border-b mb-2">
                <div className="font-bold">{tab.nome}</div>
                <div className="text-xs text-muted-foreground">
                  Vigente de {format(tab.vigencia.dataInicial!, "dd/MM/yyyy")} até {format(tab.vigencia.dataFinal!, "dd/MM/yyyy")}
                </div>
              </div>
              <Table>
                <thead>
                  <TableRow>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Preço (R$)</TableHead>
                  </TableRow>
                </thead>
                <TableBody>
                  {tab.servicos.map(srv => (
                    <TableRow key={srv.servicoId}>
                      <TableCell>{srv.nome}</TableCell>
                      <TableCell>
                        {srv.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
