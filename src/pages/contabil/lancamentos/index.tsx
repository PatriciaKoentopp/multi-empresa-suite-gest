
import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import LancarDiarioModal from "./LancarDiarioModal";
import { useLancamentosContabeis } from "@/hooks/useLancamentosContabeis";

// Utilidades de data
function dateToBR(date?: Date) {
  if (!date) return "";
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}
function brToDate(value: string): Date | undefined {
  const [dd, mm, yyyy] = value.split("/");
  if (!dd || !mm || !yyyy) return undefined;
  const d = Number(dd),
    m = Number(mm) - 1,
    y = Number(yyyy);
  if (isNaN(d) || isNaN(m) || isNaN(y) || d < 1 || d > 31 || m < 0 || m > 11 || y < 1000 || y > 3000) return undefined;
  const dt = new Date(y, m, d);
  if (dt.getDate() !== d || dt.getMonth() !== m || dt.getFullYear() !== y) return undefined;
  return dt;
}
function maskDateInput(value: string): string {
  value = value.replace(/\D/g, "");
  if (value.length > 8) value = value.slice(0, 8);
  if (value.length > 4) return value.replace(/^(\d{2})(\d{2})(\d{0,4})/, "$1/$2/$3");
  if (value.length > 2) return value.replace(/^(\d{2})(\d{0,2})/, "$1/$2");
  return value;
}
function formatCurrency(val: number) {
  return val.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2
  });
}

export default function LancamentosPage() {
  // Usar o hook personalizado
  const { 
    lancamentos, 
    planosContas, 
    isLoading, 
    carregarDados,
    adicionarLancamento,
    excluirLancamento
  } = useLancamentosContabeis();
  
  const [contaId, setContaId] = useState<string>("todos");
  const [periodo, setPeriodo] = useState<"mes_atual" | "mes_anterior" | "personalizado">("mes_atual");
  const [dataInicial, setDataInicial] = useState<Date | undefined>();
  const [dataFinal, setDataFinal] = useState<Date | undefined>();
  const [dataInicialStr, setDataInicialStr] = useState("");
  const [dataFinalStr, setDataFinalStr] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [novoModalOpen, setNovoModalOpen] = useState(false);
  
  // Definir datas iniciais conforme o período selecionado
  useEffect(() => {
    const hoje = new Date();
    if (periodo === "mes_atual") {
      const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
      setDataInicial(inicio);
      setDataInicialStr(dateToBR(inicio));
      setDataFinal(fim);
      setDataFinalStr(dateToBR(fim));
    } else if (periodo === "mes_anterior") {
      const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
      const fim = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
      setDataInicial(inicio);
      setDataInicialStr(dateToBR(inicio));
      setDataFinal(fim);
      setDataFinalStr(dateToBR(fim));
    } else {
      setDataInicial(undefined);
      setDataInicialStr("");
      setDataFinal(undefined);
      setDataFinalStr("");
    }
  }, [periodo]);

  // Funções para manipulação das datas do filtro
  function onChangeDataInicialStr(e: React.ChangeEvent<HTMLInputElement>) {
    const val = maskDateInput(e.target.value);
    setDataInicialStr(val);
    setDataInicial(brToDate(val));
  }
  
  function onBlurDataInicial(e: React.FocusEvent<HTMLInputElement>) {
    if (e.target.value && !brToDate(e.target.value)) {
      setDataInicial(undefined);
      setDataInicialStr("");
    }
  }
  
  function onChangeDataFinalStr(e: React.ChangeEvent<HTMLInputElement>) {
    const val = maskDateInput(e.target.value);
    setDataFinalStr(val);
    setDataFinal(brToDate(val));
  }
  
  function onBlurDataFinal(e: React.FocusEvent<HTMLInputElement>) {
    if (e.target.value && !brToDate(e.target.value)) {
      setDataFinal(undefined);
      setDataFinalStr("");
    }
  }

  // Filtro de lançamentos
  const filteredLancamentos = useMemo(() => {
    return lancamentos.filter(l => {
      // Filtrar por conta
      const isConta = contaId === "todos" || l.conta === contaId;
      
      // Filtrar por termo de busca
      const termoOk = searchTerm 
        ? l.historico.toLowerCase().includes(searchTerm.toLowerCase()) ||
          l.conta_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          l.conta_codigo?.toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      
      // Converter a data do lançamento para um objeto Date
      let dataLanc: Date;
      if (typeof l.data === "string") {
        if (l.data.includes("/")) {
          const [dd, mm, yyyy] = l.data.split("/");
          dataLanc = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
        } else {
          dataLanc = new Date(l.data);
        }
      } else {
        dataLanc = new Date(l.data);
      }
      
      // Filtrar por data
      const dataInicioOk = !dataInicial || dataLanc >= dataInicial;
      const dataFimOk = !dataFinal || dataLanc <= dataFinal;
      
      return isConta && termoOk && dataInicioOk && dataFimOk;
    });
  }, [contaId, searchTerm, dataInicial, dataFinal, lancamentos]);

  // Função para editar um lançamento
  function handleEdit(id: string) {
    toast.info("Ação de editar lançamento: " + id);
  }

  // Função para excluir um lançamento
  function handleDelete(id: string) {
    excluirLancamento(id);
  }

  // Função para adicionar um novo lançamento contábil
  function handleNovoLancamento(novo: { data: string; historico: string; debito: string; credito: string; valor: number }) {
    adicionarLancamento(novo);
    setNovoModalOpen(false);
  }

  // Limpar filtros
  function limparFiltros() {
    setContaId("todos");
    setPeriodo("mes_atual");
    setSearchTerm("");
    const hoje = new Date();
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    setDataInicial(inicio);
    setDataInicialStr(dateToBR(inicio));
    setDataFinal(fim);
    setDataFinalStr(dateToBR(fim));
  }

  return <div className="space-y-4">
      <LancarDiarioModal
        open={novoModalOpen}
        onClose={() => setNovoModalOpen(false)}
        onSave={handleNovoLancamento}
        contas={planosContas}
        contaInicalId={contaId !== "todos" ? contaId : ""}
      />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Diário Contábil</h1>
        <Button
          variant="blue"
          className="rounded-md px-6 py-2 text-base font-semibold"
          onClick={() => setNovoModalOpen(true)}
        >
          Novo Lançamento
        </Button>
      </div>
      <Card>
        <CardContent className="pt-6 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            {/* Conta contábil */}
            <div className="col-span-1">
              <Select value={contaId} onValueChange={setContaId}>
                <SelectTrigger className="w-full bg-white border rounded-lg h-[52px] shadow-sm pl-4 text-base font-normal">
                  <SelectValue placeholder="Conta Contábil" />
                </SelectTrigger>
                <SelectContent className="bg-white border max-h-[400px] overflow-y-auto">
                  <SelectItem value="todos">Todas as Contas</SelectItem>
                  {planosContas.map(cc => <SelectItem key={cc.id} value={cc.id}>
                      {cc.codigo} - {cc.descricao}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {/* Período */}
            <div className="col-span-1">
              <Select value={periodo} onValueChange={v => setPeriodo(v as any)}>
                <SelectTrigger className="w-full bg-white border rounded-lg h-[52px] shadow-sm pl-4 text-base font-normal">
                  <CalendarIcon className="mr-2 h-5 w-5 text-neutral-400" />
                  <SelectValue placeholder="Selecionar Período" />
                </SelectTrigger>
                <SelectContent className="bg-white border">
                  <SelectItem value="mes_atual">Mês Atual</SelectItem>
                  <SelectItem value="mes_anterior">Mês Anterior</SelectItem>
                  <SelectItem value="personalizado">Selecionar Período</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Data Inicial */}
            <div className="col-span-1 flex flex-col">
              <label className="text-xs font-medium mb-1 ml-1">Data Inicial</label>
              <div className="relative">
                <Input type="text" inputMode="numeric" className="bg-white border rounded-lg h-[52px] pl-10 text-base font-normal" placeholder="DD/MM/AAAA" disabled={periodo !== "personalizado"} value={dataInicialStr} maxLength={10} onChange={onChangeDataInicialStr} onFocus={e => {
                if (!dataInicialStr) setDataInicialStr("");
              }} onBlur={onBlurDataInicial} style={{
                minHeight: 52
              }} autoComplete="off" />
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400 pointer-events-none" />
              </div>
            </div>
            {/* Data Final */}
            <div className="col-span-1 flex flex-col">
              <label className="text-xs font-medium mb-1 ml-1">Data Final</label>
              <div className="relative">
                <Input type="text" inputMode="numeric" className="bg-white border rounded-lg h-[52px] pl-10 text-base font-normal" placeholder="DD/MM/AAAA" disabled={periodo !== "personalizado"} value={dataFinalStr} maxLength={10} onChange={onChangeDataFinalStr} onFocus={e => {
                if (!dataFinalStr) setDataFinalStr("");
              }} onBlur={onBlurDataFinal} style={{
                minHeight: 52
              }} autoComplete="off" />
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400 pointer-events-none" />
              </div>
            </div>
            {/* Busca e Limpar filtros */}
            <div className="col-span-1 flex gap-2">
              <div className="relative flex-1 min-w-[140px]">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 p-0 m-0 bg-transparent border-none cursor-pointer text-neutral-400" style={{
                lineHeight: 0
              }} tabIndex={-1} aria-label="Buscar">
                  <Search className="h-5 w-5" />
                </span>
                <Input id="busca-lancamento" placeholder="Buscar" className="pl-10 bg-white border rounded-lg h-[52px] text-base font-normal border-gray-300 shadow-sm focus:bg-white min-w-[140px] w-full" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} autoComplete="off" />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={limparFiltros}
                className="text-gray-500 hover:bg-gray-100 h-[52px] w-[52px]"
                title="Limpar filtros"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
          {/* Separador */}
          <div className="mb-4" />
          <div className="mt-6">
            {isLoading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead>Histórico</TableHead>
                      <TableHead>Débito</TableHead>
                      <TableHead>Crédito</TableHead>
                      <TableHead>Saldo</TableHead>
                      <TableHead className="text-center w-[60px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLancamentos.length === 0 ? <TableRow>
                        <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                          Nenhum lançamento encontrado
                        </TableCell>
                      </TableRow> : filteredLancamentos.map(lanc => {
                        // Converter a data para exibição
                        let dataExibicao = "";
                        if (typeof lanc.data === "string") {
                          if (lanc.data.includes("/")) {
                            dataExibicao = lanc.data;
                          } else {
                            const data = new Date(lanc.data);
                            dataExibicao = dateToBR(data);
                          }
                        } else {
                          dataExibicao = dateToBR(new Date(lanc.data));
                        }
                        
                        return (
                          <TableRow key={lanc.id}>
                            <TableCell>{dataExibicao}</TableCell>
                            <TableCell className="font-mono">{lanc.conta_codigo || '-'}</TableCell>
                            <TableCell>
                              <div className="max-w-xs truncate">
                                {lanc.historico}
                              </div>
                              <div className="text-xs text-gray-500">
                                {lanc.conta_nome || ''}
                              </div>
                            </TableCell>
                            <TableCell>
                              {lanc.tipo === "debito" ? formatCurrency(lanc.valor) : "-"}
                            </TableCell>
                            <TableCell>
                              {lanc.tipo === "credito" ? formatCurrency(lanc.valor) : "-"}
                            </TableCell>
                            <TableCell>{formatCurrency(lanc.saldo)}</TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center gap-2 justify-center">
                                <Button variant="ghost" size="icon" className="text-blue-500 hover:bg-blue-100" aria-label="Editar" onClick={() => handleEdit(lanc.id)}>
                                  <svg className="inline h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinejoin="round" strokeLinecap="round" strokeWidth={2} d="M16.862 4.487a2.5 2.5 0 1 1 3.535 3.536L7.5 20.918l-4.242.707.707-4.243L16.862 4.487z" /></svg>
                                </Button>
                                <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-100" aria-label="Excluir" onClick={() => handleDelete(lanc.id)}>
                                  <svg className="inline h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinejoin="round" strokeLinecap="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>;
}
