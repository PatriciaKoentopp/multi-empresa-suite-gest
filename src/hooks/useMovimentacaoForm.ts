
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useParcelasCalculation } from "./useParcelasCalculation";
import { formatDate } from "@/lib/utils";

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
  const [tipoTitulo, setTipoTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState<string>("");
  const [formaPagamento, setFormaPagamento] = useState("");
  const [numParcelas, setNumParcelas] = useState<number>(1);
  const [dataPrimeiroVenc, setDataPrimeiroVenc] = useState<Date | undefined>(new Date());
  const [considerarDRE, setConsiderarDRE] = useState(true);
  const [contaOrigem, setContaOrigem] = useState("");
  const [contaDestino, setContaDestino] = useState("");
  const [parcelasCarregadas, setParcelasCarregadas] = useState(false);
  const [forcarRecalculo, setForcarRecalculo] = useState(false);
  const [movimentacaoId, setMovimentacaoId] = useState<string | undefined>(undefined);

  // Define a função parseValor antes de usá-la
  const parseValor = (valorStr: string): number => {
    return parseFloat(valorStr.replace(/\./g, "").replace(",", ".") || "0");
  };

  // Calcular parcelas com base no valor total, número de parcelas e data do primeiro vencimento
  const valorNumerico = parseValor(valor);
  
  // Usar shouldRecalculate para controlar quando recalcular as parcelas
  const parcelas = useParcelasCalculation(
    valorNumerico, 
    numParcelas, 
    dataPrimeiroVenc, 
    !parcelasCarregadas || forcarRecalculo
  );

  // Função para buscar os dados atualizados da movimentação diretamente do banco
  const recarregarDadosMovimentacao = async (id: string) => {
    if (!currentCompany?.id) return;

    try {
      // Buscar os dados atualizados da movimentação
      const { data: movimentacao, error } = await supabase
        .from('movimentacoes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (movimentacao) {
        // Atualizar o estado com os dados do banco
        setOperacao(movimentacao.tipo_operacao as Operacao);
        setDataEmissao(movimentacao.data_emissao ? new Date(movimentacao.data_emissao + "T12:00:00Z") : undefined);
        setDataLancamento(movimentacao.data_lancamento ? new Date(movimentacao.data_lancamento + "T12:00:00Z") : undefined);
        setNumDoc(movimentacao.numero_documento || "");
        setFavorecido(movimentacao.favorecido_id || "");
        setCategoria(movimentacao.categoria_id || "");
        setTipoTitulo(movimentacao.tipo_titulo_id || "");
        setDescricao(movimentacao.descricao || "");
        setValor(movimentacao.valor?.toString().replace(".", ",") || "");
        setFormaPagamento(movimentacao.forma_pagamento || "");
        setNumParcelas(movimentacao.numero_parcelas || 1);
        setDataPrimeiroVenc(movimentacao.primeiro_vencimento ? new Date(movimentacao.primeiro_vencimento + "T12:00:00Z") : undefined);
        setConsiderarDRE(movimentacao.considerar_dre);
        setMovimentacaoId(movimentacao.id);

        // Se for transferência, atualizar os campos específicos
        if (movimentacao.tipo_operacao === "transferencia") {
          setContaOrigem(movimentacao.conta_origem_id || "");
          setContaDestino(movimentacao.conta_destino_id || "");
        }

        // Buscar as parcelas dessa movimentação
        const { data: parcelasData, error: parcelasError } = await supabase
          .from('movimentacoes_parcelas')
          .select('*')
          .eq('movimentacao_id', id)
          .order('numero', { ascending: true });

        if (!parcelasError && parcelasData) {
          // Definir como parcelas carregadas e não forçar recálculo
          setParcelasCarregadas(true);
          setForcarRecalculo(false);
        }
      }
    } catch (error) {
      console.error("Erro ao recarregar dados da movimentação:", error);
      toast.error("Erro ao carregar dados da movimentação");
    }
  };

  useEffect(() => {
    if (movimentacaoParaEditar) {
      setOperacao(movimentacaoParaEditar.tipo_operacao);
      
      // Usar as datas diretamente do banco, sem ajustes de timezone
      setDataEmissao(movimentacaoParaEditar.data_emissao ? new Date(movimentacaoParaEditar.data_emissao + "T12:00:00Z") : undefined);
      setDataLancamento(movimentacaoParaEditar.data_lancamento ? new Date(movimentacaoParaEditar.data_lancamento + "T12:00:00Z") : undefined);
      
      setNumDoc(movimentacaoParaEditar.numero_documento || "");
      setFavorecido(movimentacaoParaEditar.favorecido_id || "");
      setCategoria(movimentacaoParaEditar.categoria_id || "");
      setTipoTitulo(movimentacaoParaEditar.tipo_titulo_id || "");
      setDescricao(movimentacaoParaEditar.descricao || "");
      setValor(movimentacaoParaEditar.valor?.toString().replace(".", ",") || "");
      setFormaPagamento(movimentacaoParaEditar.forma_pagamento || "");
      setNumParcelas(movimentacaoParaEditar.numero_parcelas || 1);
      setMovimentacaoId(movimentacaoParaEditar.id);
      
      // Usar a data do primeiro vencimento diretamente do banco, sem ajustes de timezone
      setDataPrimeiroVenc(movimentacaoParaEditar.primeiro_vencimento ? new Date(movimentacaoParaEditar.primeiro_vencimento + "T12:00:00Z") : undefined);
      
      setConsiderarDRE(movimentacaoParaEditar.considerar_dre);
      setParcelasCarregadas(true);
      
      if (movimentacaoParaEditar.tipo_operacao === "transferencia") {
        setContaOrigem(movimentacaoParaEditar.conta_origem_id || "");
        setContaDestino(movimentacaoParaEditar.conta_destino_id || "");
      }
    }
  }, [movimentacaoParaEditar]);

  // Efeito para forçar recálculo quando o valor ou número de parcelas mudar
  useEffect(() => {
    if (parcelasCarregadas) {
      setForcarRecalculo(true);
    }
  }, [valorNumerico, numParcelas]);

  // Resetar forcarRecalculo depois que o efeito de recálculo for aplicado
  useEffect(() => {
    if (forcarRecalculo) {
      setForcarRecalculo(false);
      setParcelasCarregadas(false);
    }
  }, [forcarRecalculo]);

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
          tipo_titulo_id: tipoTitulo || undefined,
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
      let novaMovimentacaoId;
      
      if (movimentacaoId) {
        // Atualizar movimentação existente
        response = await supabase
          .from("movimentacoes")
          .update(movimentacaoData)
          .eq('id', movimentacaoId)
          .select()
          .single();

        if (response.error) throw response.error;
        
        try {
          // Excluir parcelas anteriores antes de inserir as novas
          const { error: deleteError } = await supabase
            .from("movimentacoes_parcelas")
            .delete()
            .eq('movimentacao_id', movimentacaoId);
            
          if (deleteError) {
            // Se houver erro ao deletar as parcelas (devido a referências em fluxo_caixa)
            // recarregamos os dados originais do banco e mostramos o erro
            await recarregarDadosMovimentacao(movimentacaoId);
            throw deleteError;
          }

          // Inserir novas parcelas
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

            if (parcelasError) {
              // Caso de erro ao inserir novas parcelas, recarregar dados do banco
              await recarregarDadosMovimentacao(movimentacaoId);
              throw parcelasError;
            }
          }
        } catch (error) {
          // Garantir que os dados são recarregados do banco após qualquer erro
          console.error("Erro ao processar parcelas:", error);
          throw error;
        }
      } else {
        // Inserir nova movimentação
        response = await supabase
          .from("movimentacoes")
          .insert([movimentacaoData])
          .select()
          .single();

        if (response.error) throw response.error;
        novaMovimentacaoId = response.data.id;

        // Inserir parcelas para nova movimentação
        if (operacao !== "transferencia" && parcelas.length > 0) {
          const parcelasData = parcelas.map(parcela => ({
            movimentacao_id: novaMovimentacaoId,
            numero: parcela.numero,
            valor: parcela.valor,
            data_vencimento: format(parcela.dataVencimento, "yyyy-MM-dd")
          }));

          const { error: parcelasError } = await supabase
            .from("movimentacoes_parcelas")
            .insert(parcelasData);

          if (parcelasError) throw parcelasError;
        }
      }

      toast.success(movimentacaoId ? "Movimentação atualizada com sucesso!" : "Movimentação salva com sucesso!");
      navigate(-1);
    } catch (error: any) {
      console.error("Erro ao salvar movimentação:", error);
      
      // Se a mensagem de erro indicar violação de chave estrangeira
      if (error.code === '23503' && error.message?.includes('fluxo_caixa')) {
        toast.error("Não é possível alterar uma movimentação que já possui parcelas pagas");
      } else {
        toast.error("Erro ao salvar movimentação");
      }
      
      // Recarregar dados originais se for uma edição
      if (movimentacaoId) {
        await recarregarDadosMovimentacao(movimentacaoId);
      }
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
    tipoTitulo,
    setTipoTitulo,
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
