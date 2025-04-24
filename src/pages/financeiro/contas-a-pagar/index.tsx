import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { BaixarContaPagarModal } from "@/components/contas-a-pagar/BaixarContaPagarModal";
import { supabase } from "@/integrations/supabase/client";
import { Movimentacao, MovimentacaoParcela } from "@/types/movimentacoes";

export default function ContasAPagarPage() {
  const [contas, setContas] = useState<ContaPagar[]>([]);

  // Novo: navegação
  const navigate = useNavigate();

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

  // Novo estado para modal Baixar
  const [contaParaBaixar, setContaParaBaixar] = useState<ContaPagar | null>(null);
  const [modalBaixarAberto, setModalBaixarAberto] = useState(false);

  // Ações (exemplo, pode ser desacoplado)
  const handleEdit = (conta: ContaPagar) => {
    navigate("/financeiro/incluir-movimentacao", {
      state: { contaPagar: conta }
    });
  };

  const handleBaixar = (conta: ContaPagar) => {
    setContaParaBaixar(conta);
    setModalBaixarAberto(true);
  };

  const handleDelete = (id: string) => {
    setContas((prev) => prev.filter((c) => c.id !== id));
    toast.success("Conta excluída.");
  };

  function realizarBaixa({ dataPagamento, contaCorrenteId, multa, juros, desconto }: {
    dataPagamento: Date;
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
              dataPagamento,
              status: "pago", // sempre define pago (por ora)
            }
          : item
      )
    );
    // Aqui normalmente: lança no fluxo de caixa, etc — mas deixamos só atualização mock
    toast.success("Título baixado com sucesso!");
  }

  // Carregar dados do Supabase
  useEffect(() => {
    async function carregarContasAPagar() {
      try {
        const { data: movimentacoes, error } = await supabase
          .from('movimentacoes')
          .select(`
            *,
            favorecido:favorecidos(nome)
          `)
          .eq('tipo_operacao', 'pagar');

        if (error) throw error;

        if (movimentacoes) {
          // Converter movimentações em contas a pagar
          const contasFormatadas: ContaPagar[] = movimentacoes.map((mov: any) => ({
            id: mov.id,
            favorecido: mov.favorecido?.nome || 'Não informado',
            descricao: mov.descricao || '',
            dataVencimento: new Date(mov.primeiro_vencimento),
            dataPagamento: undefined, // TODO: Implementar quando baixar
            status: 'em_aberto', // TODO: Implementar lógica de status
            valor: Number(mov.valor),
            numeroParcela: mov.numero_documento
          }));

          setContas(contasFormatadas);
        }
      } catch (error: any) {
        console.error('Erro ao carregar contas:', error);
        toast.error('Erro ao carregar as contas a pagar');
      }
    }

    carregarContasAPagar();
  }, []);

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
        <Button
          variant="blue"
          onClick={() => navigate("/financeiro/incluir-movimentacao")}
        >
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
          {/* Separador para dar respiro visual */}
          <div className="mb-4" />
          <div className="mt-6">
            <ContasAPagarTable
              contas={filteredContas}
              onEdit={handleEdit}
              onBaixar={handleBaixar}
              onDelete={handleDelete}
            />
          </div>
        </CardContent>
      </Card>
      <BaixarContaPagarModal
        conta={contaParaBaixar}
        open={modalBaixarAberto}
        onClose={() => setModalBaixarAberto(false)}
        onBaixar={realizarBaixa}
      />
    </div>
  );
}
