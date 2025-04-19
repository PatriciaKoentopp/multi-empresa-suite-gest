import { useState, useMemo, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, Search, Filter } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ContasAPagarTable, ContaPagar } from "@/components/contas-a-pagar/contas-a-pagar-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mock data inicial
const initialContasAPagar: ContaPagar[] = [
  {
    id: "1",
    favorecido: "Fornecedor ABC",
    descricao: "Compra de equipamentos",
    dataVencimento: new Date("2024-05-05"),
    dataPagamento: new Date("2024-05-06"),
    status: "pago",
    valor: 1800.45,
  },
  {
    id: "2",
    favorecido: "Fornecedor XPTO",
    descricao: "Serviços de manutenção",
    dataVencimento: new Date("2024-03-25"),
    dataPagamento: undefined,
    status: "em_aberto",
    valor: 950,
  },
  {
    id: "3",
    favorecido: "Empresa Beta",
    descricao: "Material de escritório",
    dataVencimento: new Date("2024-03-10"),
    dataPagamento: new Date("2024-03-18"),
    status: "pago_em_atraso",
    valor: 239.99,
  },
];

export default function ContasAPagarPage() {
  const [contas, setContas] = useState<ContaPagar[]>(initialContasAPagar);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todas" | "pago" | "pago_em_atraso" | "em_aberto">("todas");
  const [dataVencInicio, setDataVencInicio] = useState<string>("");
  const [dataVencFim, setDataVencFim] = useState<string>("");
  const [dataPagInicio, setDataPagInicio] = useState<string>("");
  const [dataPagFim, setDataPagFim] = useState<string>("");

  const inputBuscaRef = useRef<HTMLInputElement>(null);

  function formatInputDate(date: Date | undefined) {
    if (!date) return "";
    return format(date, "yyyy-MM-dd");
  }

  // Ações (exemplo, pode ser desacoplado)
  const handleEdit = (conta: ContaPagar) => {
    toast.info("Ação Editar ainda não implementada.");
  };

  const handleBaixar = (conta: ContaPagar) => {
    toast.info("Ação Baixar ainda não implementada.");
  };

  const handleDelete = (id: string) => {
    setContas((prev) => prev.filter((c) => c.id !== id));
    toast.success("Conta excluída.");
  };

  // Filtro
  const filteredContas = useMemo(() => {
    return contas.filter((conta) => {
      const textoBusca = (conta.favorecido + conta.descricao)
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const statusOk = statusFilter === "todas" || conta.status === statusFilter;
      const vencimentoDentroRange =
        (!dataVencInicio || conta.dataVencimento >= new Date(dataVencInicio)) &&
        (!dataVencFim || conta.dataVencimento <= new Date(dataVencFim));
      const pagamentoDentroRange =
        (!dataPagInicio || (conta.dataPagamento && conta.dataPagamento >= new Date(dataPagInicio))) &&
        (!dataPagFim || (conta.dataPagamento && conta.dataPagamento <= new Date(dataPagFim)));

      return textoBusca && statusOk && vencimentoDentroRange && pagamentoDentroRange;
    });
  }, [contas, searchTerm, statusFilter, dataVencInicio, dataVencFim, dataPagInicio, dataPagFim]);

  function handleLupaClick() {
    inputBuscaRef.current?.focus();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Contas a Pagar</h1>
        <Button variant="blue" disabled>
          Nova Conta a Pagar
        </Button>
      </div>
      <Card>
        <CardContent className="pt-6">
          {/* Primeira linha: Busca + Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative col-span-1 min-w-[240px]">
              <button
                type="button"
                className="absolute left-3 top-3 z-10 p-0 m-0 bg-transparent border-none cursor-pointer text-muted-foreground hover:text-blue-500"
                style={{ lineHeight: 0 }}
                onClick={handleLupaClick}
                tabIndex={-1}
                aria-label="Buscar"
              >
                <Search className="h-5 w-5" />
              </button>
              <Input
                ref={inputBuscaRef}
                placeholder="Buscar favorecido ou descrição"
                className="pl-10 bg-white border-gray-300 shadow-sm focus:bg-white min-w-[180px] w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    inputBuscaRef.current?.blur();
                  }
                }}
                autoComplete="off"
              />
            </div>
            <div className="col-span-1 min-w-[180px]">
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as any)}
              >
                <SelectTrigger className="w-full bg-white dark:bg-gray-900">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200">
                  <SelectItem value="todas">Todos Status</SelectItem>
                  <SelectItem value="em_aberto" className="text-blue-600">Em Aberto</SelectItem>
                  <SelectItem value="pago" className="text-green-600">Pago</SelectItem>
                  <SelectItem value="pago_em_atraso" className="text-red-600">Pago em Atraso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div /> {/* Espaço só para organizar em tela grande */}
          </div>
          {/* Linha única de filtros de datas, sempre abaixo da busca */}
          <div className="mt-2 flex flex-col md:flex-row gap-2">
            {/* Vencimento: de - até */}
            <div className="flex flex-row gap-2 flex-1 min-w-[240px]">
              <div className="flex flex-col flex-1">
                <label className="text-xs font-medium">Venc. de</label>
                <Input
                  type="date"
                  className="min-w-[120px] max-w-[140px]"
                  value={dataVencInicio}
                  max={dataVencFim || undefined}
                  onChange={e => setDataVencInicio(e.target.value)}
                />
              </div>
              <div className="flex flex-col flex-1">
                <label className="text-xs font-medium">até</label>
                <Input
                  type="date"
                  className="min-w-[120px] max-w-[140px]"
                  value={dataVencFim}
                  min={dataVencInicio || undefined}
                  onChange={e => setDataVencFim(e.target.value)}
                />
              </div>
            </div>
            {/* Pagamento: de - até */}
            <div className="flex flex-row gap-2 flex-1 min-w-[240px]">
              <div className="flex flex-col flex-1">
                <label className="text-xs font-medium">Pagto. de</label>
                <Input
                  type="date"
                  className="min-w-[120px] max-w-[140px]"
                  value={dataPagInicio}
                  max={dataPagFim || undefined}
                  onChange={e => setDataPagInicio(e.target.value)}
                />
              </div>
              <div className="flex flex-col flex-1">
                <label className="text-xs font-medium">até</label>
                <Input
                  type="date"
                  className="min-w-[120px] max-w-[140px]"
                  value={dataPagFim}
                  min={dataPagInicio || undefined}
                  onChange={e => setDataPagFim(e.target.value)}
                />
              </div>
            </div>
          </div>
          <ContasAPagarTable
            contas={filteredContas}
            onEdit={handleEdit}
            onBaixar={handleBaixar}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>
    </div>
  );
}
