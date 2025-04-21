
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { CalendarIcon, Plus, Pencil, Trash2, Edit, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Table, TableHead, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

type Vigencia = { dataInicial: Date | null; dataFinal: Date | null };
type Servico = { id: number; nome: string; precoPadrao: number };

type TabelaPreco = {
  id: number;
  nome: string;
  vigencia: Vigencia;
  servicos: { servicoId: number; nome: string; preco: number }[];
};

// Mocks de Serviços centralizados
const MOCK_SERVICOS: Servico[] = [
  { id: 1, nome: "Consultoria Fiscal", precoPadrao: 700 },
  { id: 2, nome: "Auditoria Contábil", precoPadrao: 3500 },
  { id: 3, nome: "Abertura de Empresa", precoPadrao: 1200 },
  { id: 4, nome: "Encerramento de Empresa", precoPadrao: 950 },
  { id: 5, nome: "BPO Financeiro", precoPadrao: 2500 },
  { id: 6, nome: "Elaboração de Contrato Social", precoPadrao: 890 }
];

// Mock de tabelas já cadastradas para exemplo inicial
const MOCK_TABELAS: TabelaPreco[] = [
  {
    id: 100,
    nome: "Tabela 2025",
    vigencia: { dataInicial: new Date(2025, 0, 1), dataFinal: new Date(2025, 11, 31) },
    servicos: [
      { servicoId: 1, nome: "Consultoria Fiscal", preco: 700 },
      { servicoId: 2, nome: "Auditoria Contábil", preco: 3500 }
    ]
  },
  {
    id: 101,
    nome: "Tabela Promocional",
    vigencia: { dataInicial: new Date(2024, 6, 1), dataFinal: new Date(2024, 8, 30) },
    servicos: [
      { servicoId: 3, nome: "Abertura de Empresa", preco: 1050 },
      { servicoId: 5, nome: "BPO Financeiro", preco: 2300 }
    ]
  }
];

export default function TabelaPrecosPage() {
  const form = useForm({ defaultValues: {} });

  // Tabelas cadastradas (começando com mocks)
  const [tabelas, setTabelas] = useState<TabelaPreco[]>([...MOCK_TABELAS]);

  // Estado do formulário (edição/nova)
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [nome, setNome] = useState("");
  const [vigencia, setVigencia] = useState<Vigencia>({ dataInicial: null, dataFinal: null });
  const [servicosTabela, setServicosTabela] = useState<{ servicoId: number; nome: string; preco: number }[]>([]);
  const [novoServicoId, setNovoServicoId] = useState<number | "">("");
  const [novoPreco, setNovoPreco] = useState<string>("");

  function resetarFormulario() {
    setEditandoId(null);
    setNome("");
    setVigencia({ dataInicial: null, dataFinal: null });
    setServicosTabela([]);
    setNovoServicoId("");
    setNovoPreco("");
  }

  // Adicionar serviço à tabela em edição/criação
  function adicionarServico() {
    if (!novoServicoId || novoPreco === "") return;
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

  // Salvar (novo ou editado)
  function salvarTabela() {
    if (!nome.trim() || !vigencia.dataInicial || !vigencia.dataFinal || !servicosTabela.length) {
      toast({ title: "Preencha todos os campos obrigatórios!" });
      return;
    }
    if (editandoId) {
      setTabelas(tabs =>
        tabs.map(tab =>
          tab.id === editandoId
            ? { ...tab, nome, vigencia: { ...vigencia }, servicos: [...servicosTabela] }
            : tab
        )
      );
      toast({ title: "Tabela atualizada com sucesso!" });
    } else {
      setTabelas(tabs =>
        [
          ...tabs,
          {
            id: Date.now(),
            nome,
            vigencia: { ...vigencia },
            servicos: [...servicosTabela]
          }
        ]
      );
      toast({ title: "Tabela de preços criada com sucesso!" });
    }
    resetarFormulario();
  }

  // Editar tabela
  function handleEditarTabela(tab: TabelaPreco) {
    setEditandoId(tab.id);
    setNome(tab.nome);
    setVigencia({
      dataInicial: tab.vigencia.dataInicial ? new Date(tab.vigencia.dataInicial) : null,
      dataFinal: tab.vigencia.dataFinal ? new Date(tab.vigencia.dataFinal) : null
    });
    setServicosTabela([...tab.servicos]);
    setNovoServicoId("");
    setNovoPreco("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleExcluirTabela(id: number) {
    setTabelas(tabs => tabs.filter(tab => tab.id !== id));
    if (editandoId === id) resetarFormulario();
    toast({ title: "Tabela excluída com sucesso!" });
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Plus className="text-primary" />
            <span className="text-xl font-semibold">{editandoId ? "Editar Tabela de Preços" : "Nova Tabela de Preços"}</span>
            {editandoId &&
              <Button size="icon" variant="ghost" onClick={resetarFormulario} className="ml-2" title="Cancelar edição">
                <X />
              </Button>
            }
          </div>
        </CardHeader>
        <CardContent>
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
                          "bg-white/70 hover:bg-white/70" // transparência ajustada
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
                          "bg-white/70 hover:bg-white/70" // transparência ajustada
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
            <div className="mb-6">
              <h2 className="font-semibold mb-2 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Incluir Serviço e Preço
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-8 gap-2 items-center">
                <select
                  className="border rounded px-2 py-1 md:col-span-4 bg-white"
                  value={novoServicoId}
                  onChange={e => setNovoServicoId(Number(e.target.value) || "")}
                >
                  <option value="">Selecione um serviço...</option>
                  {MOCK_SERVICOS
                    .filter(s => !servicosTabela.some(st => st.servicoId === s.id))
                    .map(s => (
                      <option key={s.id} value={s.id}>{s.nome}</option>
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
                variant="blue"
                onClick={salvarTabela}
                disabled={!nome || !vigencia.dataInicial || !vigencia.dataFinal || !servicosTabela.length}
              >
                <Pencil className="w-4 h-4 mr-2" />
                {editandoId ? "Salvar Alterações" : "Salvar Tabela"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={resetarFormulario}
                disabled={
                  !nome && !vigencia.dataInicial && !vigencia.dataFinal && !servicosTabela.length && !editandoId
                }
              >
                Limpar
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>

      {/* Listagem de tabelas cadastradas */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Tabelas de Preço Cadastradas</h2>
        {tabelas.length === 0 && (
          <div className="text-muted-foreground text-sm">Nenhuma tabela cadastrada ainda.</div>
        )}
        <div className="grid gap-5">
          {tabelas.map(tab => (
            <Card key={tab.id} className="bg-white/90 shadow flex flex-col">
              <CardHeader className="flex flex-row justify-between items-center pb-2 border-b mb-2 px-4 pt-4">
                <div>
                  <div className="font-bold text-lg mb-1">{tab.nome}</div>
                  <div className="text-xs text-muted-foreground">
                    Vigente de {format(tab.vigencia.dataInicial!, "dd/MM/yyyy")} até {format(tab.vigencia.dataFinal!, "dd/MM/yyyy")}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="blue"
                    size="icon"
                    onClick={() => handleEditarTabela(tab)}
                    title="Editar"
                  >
                    <Edit />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleExcluirTabela(tab.id)}
                    title="Excluir"
                  >
                    <Trash2 />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
