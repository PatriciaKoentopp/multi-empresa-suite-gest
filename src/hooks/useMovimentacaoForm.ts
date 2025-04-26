
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
  const [movimentacaoId, setMovimentacaoId] = useState<string | undefined>(undefined);
  const [dadosOriginais, setDadosOriginais] = useState<any>(null);
  const [carregandoDados, setCarregandoDados] = useState(false);

  // Define a função parseValor antes de usá-la
  const parseValor = (valorStr: string): number => {
    return parseFloat(valorStr.replace(/\./g, "").replace(",", ".") || "0");
  };

  // Determinar o estado das parcelas
  const [parcelasCarregadasDoBanco, setParcelasCarregadasDoBanco] = useState(false);
  const [forcarRecalculo, setForcarRecalculo] = useState(false);

  // Calcular parcelas com base no valor total, número de parcelas e data do primeiro vencimento
  const valorNumerico = parseValor(valor);
  
  // Usar shouldRecalculate para controlar quando recalcular as parcelas
  const parcelas = useParcelasCalculation(
    valorNumerico, 
    numParcelas, 
    dataPrimeiroVenc, 
    !parcelasCarregadasDoBanco || forcarRecalculo
  );

  // Função para buscar os dados atualizados da movimentação diretamente do banco
  const recarregarDadosMovimentacao = async (id: string) => {
    if (!currentCompany?.id || !id) return;

    try {
      setCarregandoDados(true);
      console.log("Recarregando dados da movimentação do banco:", id);

      // Buscar os dados atualizados da movimentação
      const { data: movimentacao, error } = await supabase
        .from('movimentacoes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      if (movimentacao) {
        console.log("Dados recarregados com sucesso:", movimentacao);
        
        // Salvar os dados originais para possível restauração
        setDadosOriginais(movimentacao);
        
        // Atualizar o estado com os dados do banco
        setOperacao(movimentacao.tipo_operacao as Operacao);
        setDataEmissao(movimentacao.data_emissao ? new Date(movimentacao.data_emissao + "T12:00:00Z") : undefined);
        setDataLancamento(movimentacao.data_lancamento ? new Date(movimentacao.data_lancamento + "T12:00:00Z") : undefined);
        setNumDoc(movimentacao.numero_documento || "");
        setFavorecido(movimentacao.favorecido_id || "");
        setCategoria(movimentacao.categoria_id || "");
        setTipoTitulo(movimentacao.tipo_titulo_id || "");
        setDescricao(movimentacao.descricao || "");
        
        // Formatação correta do valor
        const valorFormatado = movimentacao.valor?.toString().replace(".", ",") || "";
        console.log("Valor formatado do banco:", valorFormatado);
        setValor(valorFormatado);
        
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

        // Buscar as parcelas dessa movimentação para evitar cálculo automático
        const { data: parcelasData, error: parcelasError } = await supabase
          .from('movimentacoes_parcelas')
          .select('*')
          .eq('movimentacao_id', id)
          .order('numero', { ascending: true });

        if (!parcelasError && parcelasData) {
          console.log("Parcelas carregadas do banco:", parcelasData.length);
          // Definir como parcelas carregadas do banco, desativando recálculo automático
          setParcelasCarregadasDoBanco(true);
          setForcarRecalculo(false);
        }
      }
    } catch (error) {
      console.error("Erro ao recarregar dados da movimentação:", error);
      toast.error("Erro ao carregar dados da movimentação");
    } finally {
      setCarregandoDados(false);
    }
  };

  // Este efeito inicializa os dados quando o componente monta e recebe movimentacaoParaEditar
  useEffect(() => {
    if (movimentacaoParaEditar) {
      console.log("Inicializando com movimentação para editar:", movimentacaoParaEditar);
      
      // Se temos um ID, vamos carregar os dados do banco diretamente
      if (movimentacaoParaEditar.id) {
        console.log("Carregando dados do banco para ID:", movimentacaoParaEditar.id);
        recarregarDadosMovimentacao(movimentacaoParaEditar.id);
      } else {
        // Configuração inicial sem buscar no banco (caso novo registro)
        setOperacao(movimentacaoParaEditar.tipo_operacao);
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
        setDataPrimeiroVenc(movimentacaoParaEditar.primeiro_vencimento ? new Date(movimentacaoParaEditar.primeiro_vencimento + "T12:00:00Z") : undefined);
        setConsiderarDRE(movimentacaoParaEditar.considerar_dre);
        setParcelasCarregadasDoBanco(true);
        
        if (movimentacaoParaEditar.tipo_operacao === "transferencia") {
          setContaOrigem(movimentacaoParaEditar.conta_origem_id || "");
          setContaDestino(movimentacaoParaEditar.conta_destino_id || "");
        }
      }
    }
  }, []);

  // Efeito para forçar recálculo quando o valor ou número de parcelas mudar depois da carga inicial
  useEffect(() => {
    if (parcelasCarregadasDoBanco && !carregandoDados) {
      console.log("Mudança detectada, forçando recálculo de parcelas");
      setForcarRecalculo(true);
    }
  }, [valorNumerico, numParcelas, dataPrimeiroVenc]);

  // Resetar forcarRecalculo depois que o efeito de recálculo foi aplicado
  useEffect(() => {
    if (forcarRecalculo) {
      console.log("Desativando forçar recálculo");
      setForcarRecalculo(false);
      setParcelasCarregadasDoBanco(false);
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

      let novaMovimentacaoId;
      
      if (movimentacaoId) {
        // Atualizar movimentação existente
        console.log("Atualizando movimentação:", movimentacaoData);
        const { data, error } = await supabase
          .from("movimentacoes")
          .update(movimentacaoData)
          .eq('id', movimentacaoId)
          .eq('empresa_id', currentCompany.id)
          .select()
          .single();

        if (error) {
          console.error("Erro ao atualizar movimentação:", error);
          throw error;
        }
        
        try {
          // Excluir parcelas anteriores antes de inserir as novas
          console.log("Excluindo parcelas anteriores...");
          const { error: deleteError } = await supabase
            .from("movimentacoes_parcelas")
            .delete()
            .eq('movimentacao_id', movimentacaoId);
            
          if (deleteError) {
            console.error("Erro ao excluir parcelas:", deleteError);
            // Se houver erro ao deletar as parcelas (devido a referências em fluxo_caixa)
            await recarregarDadosMovimentacao(movimentacaoId);
            
            if (deleteError.code === '23503' && deleteError.message?.includes('fluxo_caixa')) {
              toast.error("Não é possível alterar uma movimentação que já possui parcelas pagas");
            } else {
              toast.error("Erro ao atualizar parcelas");
            }
            
            return; // Interrompe o fluxo aqui, não tentamos inserir novas parcelas
          }

          // Inserir novas parcelas apenas se não houve erro na exclusão
          if (operacao !== "transferencia" && parcelas.length > 0) {
            console.log("Inserindo novas parcelas:", parcelas.length);
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
              console.error("Erro ao inserir novas parcelas:", parcelasError);
              // Caso de erro ao inserir novas parcelas, recarregar dados do banco
              await recarregarDadosMovimentacao(movimentacaoId);
              toast.error("Erro ao atualizar parcelas");
              return;
            }
          }
          
          toast.success("Movimentação atualizada com sucesso!");
          navigate(-1);
          
        } catch (error) {
          // Garantir que os dados são recarregados do banco após qualquer erro
          console.error("Erro ao processar parcelas:", error);
          await recarregarDadosMovimentacao(movimentacaoId);
          throw error;
        }
      } else {
        // Inserir nova movimentação
        console.log("Criando nova movimentação:", movimentacaoData);
        const { data, error } = await supabase
          .from("movimentacoes")
          .insert([movimentacaoData])
          .select()
          .single();

        if (error) {
          console.error("Erro ao criar movimentação:", error);
          throw error;
        }

        novaMovimentacaoId = data.id;

        // Inserir parcelas para nova movimentação
        if (operacao !== "transferencia" && parcelas.length > 0) {
          console.log("Inserindo parcelas para nova movimentação:", parcelas.length);
          const parcelasData = parcelas.map(parcela => ({
            movimentacao_id: novaMovimentacaoId,
            numero: parcela.numero,
            valor: parcela.valor,
            data_vencimento: format(parcela.dataVencimento, "yyyy-MM-dd")
          }));

          const { error: parcelasError } = await supabase
            .from("movimentacoes_parcelas")
            .insert(parcelasData);

          if (parcelasError) {
            console.error("Erro ao inserir parcelas:", parcelasError);
            throw parcelasError;
          }
        }
        
        toast.success("Movimentação salva com sucesso!");
        navigate(-1);
      }
    } catch (error: any) {
      console.error("Erro ao salvar movimentação:", error);
      
      // Mensagens específicas para violações de restrições
      if (error.code === '23503' && error.message?.includes('fluxo_caixa')) {
        toast.error("Não é possível alterar uma movimentação que já possui parcelas pagas");
      } else {
        toast.error("Erro ao salvar movimentação");
      }
      
      // Recarregar dados originais se for uma edição
      if (movimentacaoId) {
        recarregarDadosMovimentacao(movimentacaoId);
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
    parcelas,
    carregandoDados
  };
}
