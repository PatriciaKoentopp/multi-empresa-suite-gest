import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Search, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ContasAPagarTable,
  ContaPagar,
} from "@/components/contas-a-pagar/contas-a-pagar-table";
import { BaixarContaPagarModal } from "@/components/contas-a-pagar/BaixarContaPagarModal";
import { toast } from "sonner";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";

function formatDateBR(dateStr: string) {
  const [yyyy, mm, dd] = dateStr.split("-");
  return `${dd}/${mm}/${yyyy}`;
}

export default function ContasAPagarPage() {
  const [contas, setContas] = useState<ContaPagar[]>([]);
  const [isBaixarModalOpen, setIsBaixarModalOpen] = useState(false);
  const [contaParaBaixar, setContaParaBaixar] = useState<ContaPagar | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "pago" | "pago_em_atraso" | "em_aberto">("em_aberto");
  const navigate = useNavigate();
  const { currentCompany } = useCompany();
  const queryClient = useQueryClient();

  // Buscar contas a pagar
  const { data: contasPagar = [], isLoading } = useQuery({
    queryKey: ["contas-a-pagar", currentCompany?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movimentacoes_parcelas")
        .select(`
          id,
          movimentacao_id,
          numero,
          valor,
          data_vencimento,
          data_pagamento,
          multa,
          juros,
          desconto,
          forma_pagamento,
          movimentacoes (
            descricao,
            favorecido_id
          ),
          favorecidos (
            nome
          )
        `)
        .eq("empresa_id", currentCompany?.id)
        .not("data_pagamento", "is", null)
        .order("data_vencimento", { ascending: false });

      if (error) {
        toast.error("Erro ao carregar contas a pagar");
        console.error(error);
        return [];
      }

      // Formatar os dados para o formato esperado pelo componente ContasAPagarTable
      const contasPagarFormatadas: ContaPagar[] = data.map((item) => ({
        id: item.id,
        movimentacao_id: item.movimentacao_id,
        favorecido: item.favorecidos?.nome || "-",
        descricao: item.movimentacoes?.descricao || "-",
        dataVencimento: new Date(item.data_vencimento),
        dataPagamento: item.data_pagamento ? new Date(item.data_pagamento) : undefined,
        valor: item.valor,
        numeroParcela: item.numero,
        status: item.data_pagamento
          ? new Date(item.data_pagamento) > new Date(item.data_vencimento)
            ? "pago_em_atraso"
            : "pago"
          : "em_aberto",
        numeroTitulo: item.movimentacoes?.numero_documento,
        forma_pagamento: item.forma_pagamento,
        multa: item.multa,
        juros: item.juros,
        desconto: item.desconto
      }));

      return contasPagarFormatadas;
    },
    enabled: !!currentCompany?.id,
  });

  useEffect(() => {
    if (contasPagar) {
      setContas(contasPagar);
    }
  }, [contasPagar]);

  const contasFiltradas = useMemo(() => {
    return contas.filter((conta) => {
      const searchTermLower = searchTerm.toLowerCase();
      const favorecidoLower = conta.favorecido?.toLowerCase() || "";
      const descricaoLower = conta.descricao?.toLowerCase() || "";

      const searchMatch =
        favorecidoLower.includes(searchTermLower) ||
        descricaoLower.includes(searchTermLower);

      const statusMatch =
        statusFilter === "todos" || conta.status === statusFilter;

      return searchMatch && statusMatch;
    });
  }, [contas, searchTerm, statusFilter]);

  function handleEdit(conta: ContaPagar) {
    navigate("/financeiro/editar-conta-pagar", { state: { conta } });
  }

  function handleBaixar(conta: ContaPagar) {
    setContaParaBaixar(conta);
    setIsBaixarModalOpen(true);
  }

  function handleDelete(id: string) {
    console.log("Deletar conta com ID:", id);
    toast.info("Ação de deletar conta: " + id);
  }

  function handleVisualizar(conta: ContaPagar) {
    console.log("Visualizar conta com ID:", conta.id);
    toast.info("Ação de visualizar conta: " + conta.id);
  }

  const onBaixarConta = async (dados: {
    dataPagamento: Date;
    contaCorrenteId: string;
    multa: number;
    juros: number;
    desconto: number;
    formaPagamento: string;
  }) => {
    if (!contaParaBaixar) return;

    try {
      // Atualizar a conta localmente
      setContas((prevContas) =>
        prevContas.map((conta) =>
          conta.id === contaParaBaixar.id
            ? {
                ...conta,
                dataPagamento: dados.dataPagamento,
                status:
                  dados.dataPagamento > conta.dataVencimento
                    ? "pago_em_atraso"
                    : "pago",
              }
            : conta
        )
      );

      // Atualizar o cache do TanStack Query
      queryClient.invalidateQueries({ queryKey: ["contas-a-pagar"] });

      setIsBaixarModalOpen(false);
      setContaParaBaixar(null);
      toast.success("Conta paga com sucesso!");
    } catch (error) {
      console.error("Erro ao baixar conta:", error);
      toast.error("Erro ao baixar conta");
    }
  };

  // Adicionar função para desfazer baixa
  const handleDesfazerBaixa = async (conta: ContaPagar) => {
    try {
      // 1. Primeiro, verificamos se existe registro no fluxo_caixa
      const { data: fluxoCaixa, error: fluxoError } = await supabase
        .from("fluxo_caixa")
        .select("*")
        .eq("movimentacao_parcela_id", conta.id);

      if (fluxoError) throw fluxoError;

      // 2. Excluímos o registro do fluxo de caixa, se existir
      if (fluxoCaixa && fluxoCaixa.length > 0) {
        const { error: deleteError } = await supabase
          .from("fluxo_caixa")
          .delete()
          .eq("movimentacao_parcela_id", conta.id);

        if (deleteError) throw deleteError;
      }

      // 3. Resetamos os campos de pagamento na parcela da movimentação
      const { error: updateError } = await supabase
        .from("movimentacoes_parcelas")
        .update({
          data_pagamento: null,
          conta_corrente_id: null,
          multa: null,
          juros: null,
          desconto: null,
          forma_pagamento: null
        })
        .eq("id", conta.id);

      if (updateError) throw updateError;

      toast.success("Baixa desfeita com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["contas-a-pagar"] });
    } catch (error) {
      console.error("Erro ao desfazer baixa:", error);
      toast.error("Erro ao desfazer baixa do título");
    }
  };

  return (
    <div className="space-y-4">
      <BaixarContaPagarModal
        conta={contaParaBaixar}
        open={isBaixarModalOpen}
        onClose={() => setIsBaixarModalOpen(false)}
        onBaixar={onBaixarConta}
      />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Contas a Pagar</h1>
        <Button
          variant="blue"
          className="rounded-md px-6 py-2 text-base font-semibold"
          onClick={() => navigate("/financeiro/incluir-conta-pagar")}
        >
          Nova Conta a Pagar
        </Button>
      </div>
      <Card>
        <CardContent className="pt-6 pb-6">
          <div className="flex items-center justify-between flex-col sm:flex-row gap-4">
            <div className="flex-1 min-w-[320px]">
              <Input
                type="search"
                placeholder="Buscar por favorecido ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={v => setStatusFilter(v as any)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filtrar por Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="em_aberto">Em Aberto</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="pago_em_atraso">Pago em Atraso</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mt-4">
            <ContasAPagarTable
              contas={contasFiltradas}
              onEdit={handleEdit}
              onBaixar={handleBaixar}
              onDelete={handleDelete}
              onVisualizar={handleVisualizar}
              onDesfazerBaixa={handleDesfazerBaixa}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
