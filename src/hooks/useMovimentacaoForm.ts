
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useParcelasCalculation } from "./useParcelasCalculation";

export type Operacao = "pagar" | "receber" | "transferencia";

export interface MovimentacaoFormData {
  empresa_id: string;
  tipo_operacao: Operacao;
  data_emissao?: string;
  data_lancamento: string;
  numero_documento?: string;
  tipo_titulo_id?: string;
  favorecido_id?: string;
  categoria_id?: string;
  descricao?: string;
  valor: number;
  forma_pagamento?: string;
  numero_parcelas: number;
  primeiro_vencimento?: string;
  considerar_dre: boolean;
  conta_origem_id?: string;
  conta_destino_id?: string;
}

export function useMovimentacaoForm(movimentacaoParaEditar?: any) {
  const { currentCompany } = useCompany();
  const navigate = useNavigate();

  const [operacao, setOperacao] = useState<Operacao>("pagar");
  const [dataEmissao, setDataEmissao] = useState<Date | undefined>(new Date());
  const [dataLancamento, setDataLancamento] = useState<Date | undefined>(new Date());
  const [numDoc, setNumDoc] = useState("");
  const [favorecido, setFavorecido] = useState("");
  const [categoria, setCategoria] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState<string>("");
  const [formaPagamento, setFormaPagamento] = useState("");
  const [numParcelas, setNumParcelas] = useState<number>(1);
  const [dataPrimeiroVenc, setDataPrimeiroVenc] = useState<Date | undefined>(new Date());
  const [considerarDRE, setConsiderarDRE] = useState(true);
  const [contaOrigem, setContaOrigem] = useState("");
  const [contaDestino, setContaDestino] = useState("");

  // Define a função parseValor antes de usá-la
  const parseValor = (valorStr: string): number => {
    return parseFloat(valorStr.replace(/\./g, "").replace(",", ".") || "0");
  };

  // Calcular parcelas com base no valor total, número de parcelas e data do primeiro vencimento
  const valorNumerico = parseValor(valor);
  const parcelas = useParcelasCalculation(valorNumerico, numParcelas, dataPrimeiroVenc);

  useEffect(() => {
    if (movimentacaoParaEditar) {
      setOperacao(movimentacaoParaEditar.tipo_operacao);
      setDataEmissao(movimentacaoParaEditar.data_emissao ? new Date(movimentacaoParaEditar.data_emissao) : undefined);
      setDataLancamento(movimentacaoParaEditar.data_lancamento ? new Date(movimentacaoParaEditar.data_lancamento) : undefined);
      setNumDoc(movimentacaoParaEditar.numero_documento || "");
      setFavorecido(movimentacaoParaEditar.favorecido_id || "");
      setCategoria(movimentacaoParaEditar.categoria_id || "");
      setDescricao(movimentacaoParaEditar.descricao || "");
      setValor(movimentacaoParaEditar.valor?.toString().replace(".", ",") || "");
      setFormaPagamento(movimentacaoParaEditar.forma_pagamento || "");
      setNumParcelas(movimentacaoParaEditar.numero_parcelas || 1);
      setDataPrimeiroVenc(movimentacaoParaEditar.primeiro_vencimento ? new Date(movimentacaoParaEditar.primeiro_vencimento) : undefined);
      setConsiderarDRE(movimentacaoParaEditar.considerar_dre);
      
      if (movimentacaoParaEditar.tipo_operacao === "transferencia") {
        setContaOrigem(movimentacaoParaEditar.conta_origem_id || "");
        setContaDestino(movimentacaoParaEditar.conta_destino_id || "");
      }
    }
  }, [movimentacaoParaEditar]);

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9,]/g, "");
    if ((val.match(/,/g) || []).length > 1) {
      val = val.slice(0, -1);
    }
    setValor(val);
  };

  const handleSalvar = async () => {
    if (!currentCompany?.id) {
      toast.error("Nenhuma empresa selecionada");
      return;
    }

    try {
      let movimentacaoData: MovimentacaoFormData;

      if (operacao === "transferencia") {
        if (!contaOrigem || !contaDestino || contaOrigem === contaDestino || !valor || !dataLancamento) {
          toast.error("Preencha todos os campos corretamente para Transferência.");
          return;
        }

        movimentacaoData = {
          empresa_id: currentCompany.id,
          tipo_operacao: operacao,
          data_lancamento: format(dataLancamento, "yyyy-MM-dd"),
          valor: parseValor(valor),
          descricao,
          numero_parcelas: 1,
          considerar_dre: false,
          conta_origem_id: contaOrigem,
          conta_destino_id: contaDestino
        };
      } else {
        // Validar campos obrigatórios para pagar/receber
        if (!valor || !dataLancamento || !favorecido || !categoria || !formaPagamento || !dataPrimeiroVenc) {
          toast.error("Preencha todos os campos obrigatórios.");
          return;
        }

        movimentacaoData = {
          empresa_id: currentCompany.id,
          tipo_operacao: operacao,
          data_emissao: dataEmissao ? format(dataEmissao, "yyyy-MM-dd") : undefined,
          data_lancamento: format(dataLancamento, "yyyy-MM-dd"),
          numero_documento: numDoc || undefined,
          favorecido_id: favorecido,
          categoria_id: categoria,
          descricao,
          valor: parseValor(valor),
          forma_pagamento: formaPagamento,
          numero_parcelas: numParcelas,
          primeiro_vencimento: dataPrimeiroVenc ? format(dataPrimeiroVenc, "yyyy-MM-dd") : undefined,
          considerar_dre: considerarDRE
        };
      }

      let response;
      let movimentacaoId;
      
      if (movimentacaoParaEditar) {
        // Atualizar movimentação existente
        response = await supabase
          .from("movimentacoes")
          .update(movimentacaoData)
          .eq('id', movimentacaoParaEditar.id)
          .select()
          .single();

        if (response.error) throw response.error;
        movimentacaoId = movimentacaoParaEditar.id;

        // Excluir parcelas anteriores antes de inserir as novas
        const { error: deleteError } = await supabase
          .from("movimentacoes_parcelas")
          .delete()
          .eq('movimentacao_id', movimentacaoId);
          
        if (deleteError) throw deleteError;
      } else {
        // Inserir nova movimentação
        response = await supabase
          .from("movimentacoes")
          .insert([movimentacaoData])
          .select()
          .single();

        if (response.error) throw response.error;
        movimentacaoId = response.data.id;
      }

      // Inserir parcelas se não for transferência
      if (operacao !== "transferencia" && parcelas.length > 0) {
        const parcelasData = parcelas.map(parcela => ({
          movimentacao_id: movimentacaoId,
          numero: parcela.numero,
          valor: parcela.valor,
          data_vencimento: format(parcela.dataVencimento, "yyyy-MM-dd")
        }));

        const { error: parcelasError } = await supabase
          .from("movimentacoes_parcelas")
          .insert(parcelasData);

        if (parcelasError) throw parcelasError;
      }

      toast.success(movimentacaoParaEditar ? "Movimentação atualizada com sucesso!" : "Movimentação salva com sucesso!");
      navigate(-1);
    } catch (error) {
      console.error("Erro ao salvar movimentação:", error);
      toast.error("Erro ao salvar movimentação");
    }
  };

  return {
    operacao,
    setOperacao,
    dataEmissao,
    setDataEmissao,
    dataLancamento,
    setDataLancamento,
    numDoc,
    setNumDoc,
    favorecido,
    setFavorecido,
    categoria,
    setCategoria,
    descricao,
    setDescricao,
    valor,
    handleValorChange,
    formaPagamento,
    setFormaPagamento,
    numParcelas,
    setNumParcelas,
    dataPrimeiroVenc,
    setDataPrimeiroVenc,
    considerarDRE,
    setConsiderarDRE,
    contaOrigem,
    setContaOrigem,
    contaDestino,
    setContaDestino,
    handleSalvar,
    parcelas
  };
}
