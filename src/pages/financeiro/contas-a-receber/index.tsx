
import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, Search, Filter } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ContasAReceberTable, ContaReceber } from "@/components/contas-a-receber/contas-a-receber-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BaixarContaReceberModal } from "@/components/contas-a-receber/BaixarContaReceberModal";

// Dados mock: parcelas de vendas e movimentações tipo receber
const initialContasAReceber: ContaReceber[] = [
  {
    id: "1",
    cliente: "Cliente Alfa",
    descricao: "Venda produto A",
    dataVencimento: new Date("2024-05-02"),
    dataRecebimento: new Date("2024-05-04"),
    status: "recebido",
    valor: 1200.00,
  },
  {
    id: "2",
    cliente: "Cliente Beta",
    descricao: "Venda serviço B",
    dataVencimento: new Date("2024-06-10"),
    dataRecebimento: undefined,
    status: "em_aberto",
    valor: 3000.99,
  },
  {
    id: "3",
    cliente: "Cliente Gama",
    descricao: "Recebimento de parcela",
    dataVencimento: new Date("2024-04-12"),
    dataRecebimento: new Date("2024-04-18"),
    status: "recebido_em_atraso",
    valor: 482.10,
  },
];

export default function ContasAReceberPage() {
  const [contas, setContas] = useState<ContaReceber[]>(initialContasAReceber);

  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todas" | "recebido" | "recebido_em_atraso" | "em_aberto">("todas");
  const [dataVencInicio, setDataVencInicio] = useState<string>("");
  const [dataVencFim, setDataVencFim] = useState<string>("");
  const [dataRecInicio, setDataRecInicio] = useState<string>("");
  const [dataRecFim, setDataRecFim] = useState<string>("");

  const inputBuscaRef = useRef<HTMLInputElement>(null);

  function formatInputDate(date: Date | undefined) {
    if (!date) return "";
    return format(date, "yyyy-MM-dd");
  }

  // Modal Baixar
  const [contaParaBaixar, setContaParaBaixar] = useState<ContaReceber | null>(null);
  const [modalBaixarAberto, setModalBaixarAberto] = useState(false);

  // Ações
  const handleEdit = (conta: ContaReceber) => {
    // Simulação: navega para inclusão/edição de movimentação passando a conta
    navigate("/financeiro/incluir-movimentacao", {
      state: { contaReceber: conta }
    });
  };

  const handleBaixar = (conta: ContaReceber) => {
    setContaParaBaixar(conta);
    setModalBaixarAberto(true);
  };

  const handleDelete = (id: string) => {
    setContas((prev) => prev.filter((c) => c.id !== id));
    toast.success("Conta excluída.");
  };

  function realizarBaixa({ dataRecebimento, contaCorrenteId, multa, juros, desconto }: {
    dataRecebimento: Date;
    contaCorrenteId: string;
    multa: number;
    juros: number;
    desconto: number;
  }) {
    setContas(prev =>
      prev.map(item =>
        item.id === contaParaBaixar?.id
          ? {
              ...item,
              dataRecebimento,
              status: "recebido", // sempre define recebido (por ora)
            }
          : item
      )
    );
    toast.success("Recebimento efetivado com sucesso!");
  }

  // Filtro
  const filteredContas = useMemo(() => {
    return contas.filter((conta) => {
      const textoBusca = (conta.cliente + conta.descricao)
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const statusOk = statusFilter === "todas" || conta.status === statusFilter;
      const vencimentoDentroRange =
        (!dataVencInicio || conta.dataVencimento >= new Date(dataVencInicio)) &&
        (!dataVencFim || conta.dataVencimento <= new Date(dataVencFim));
      const recebimentoDentroRange =
        (!dataRecInicio || (conta.dataRecebimento && conta.dataRecebimento >= new Date(dataRecInicio))) &&
        (!dataRecFim || (conta.dataRecebimento && conta.dataRecebimento <= new Date(dataRecFim)));

      return textoBusca && statusOk && vencimentoDentroRange && recebimentoDentroRange;
    });
  }, [contas, searchTerm, statusFilter, dataVencInicio, dataVencFim, dataRecInicio, dataRecFim]);

  function handleLupaClick() {
    inputBuscaRef.current?.focus();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Contas a Receber</h1>
        <Button
          variant="blue"
          onClick={() => navigate("/financeiro/incluir-movimentacao")}
        >
          Nova Conta a Receber
        </Button>
      </div>
      <Card>
        <CardContent className="pt-6">
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
                placeholder="Buscar cliente ou descrição"
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
                  <SelectItem value="recebido" className="text-green-600">Recebido</SelectItem>
                  <SelectItem value="recebido_em_atraso" className="text-red-600">Recebido em Atraso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div />
          </div>
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
            {/* Recebimento: de - até */}
            <div className="flex flex-row gap-2 flex-1 min-w-[240px]">
              <div className="flex flex-col flex-1">
                <label className="text-xs font-medium">Rec. de</label>
                <Input
                  type="date"
                  className="min-w-[120px] max-w-[140px]"
                  value={dataRecInicio}
                  max={dataRecFim || undefined}
                  onChange={e => setDataRecInicio(e.target.value)}
                />
              </div>
              <div className="flex flex-col flex-1">
                <label className="text-xs font-medium">até</label>
                <Input
                  type="date"
                  className="min-w-[120px] max-w-[140px]"
                  value={dataRecFim}
                  min={dataRecInicio || undefined}
                  onChange={e => setDataRecFim(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="mb-4" />
          <div className="mt-6">
            <ContasAReceberTable
              contas={filteredContas}
              onEdit={handleEdit}
              onBaixar={handleBaixar}
              onDelete={handleDelete}
            />
          </div>
        </CardContent>
      </Card>
      <BaixarContaReceberModal
        conta={contaParaBaixar}
        open={modalBaixarAberto}
        onClose={() => setModalBaixarAberto(false)}
        onBaixar={realizarBaixa}
      />
    </div>
  );
}
