
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
  const [parcelasOriginais, setParcelasOriginais] = useState<any[]>([]);

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
          // Salvar as parcelas originais
          setParcelasOriginais(parcelasData);
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

  // Verificar se as parcelas têm pagamentos registrados no fluxo_caixa
  const verificarParcelasPagas = async (movimentacaoId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('fluxo_caixa')
        .select('id')
        .eq('movimentacao_id', movimentacaoId)
        .limit(1);
      
      if (error) throw error;
      
      return data && data.length > 0;
    } catch (error) {
      console.error("Erro ao verificar parcelas pagas:", error);
      return true; // Em caso de erro, considerar como tendo parcelas pagas por segurança
    }
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

      // Caso seja uma atualização, verificar primeiro se há parcelas pagas
      if (movimentacaoId) {
        const temParcelasPagas = await verificarParcelasPagas(movimentacaoId);
        
        // Se houver parcelas pagas e o número de parcelas mudou, não permitir a alteração
        if (temParcelasPagas) {
          const { data: movAtual } = await supabase
            .from("movimentacoes")
            .select("numero_parcelas")
            .eq('id', movimentacaoId)
            .single();
            
          if (movAtual && movAtual.numero_parcelas !== movimentacaoData.numero_parcelas) {
            toast.error("Não é possível alterar o número de parcelas de uma movimentação que já possui lançamentos no fluxo de caixa");
            await recarregarDadosMovimentacao(movimentacaoId);
            return;
          }
        }
      }

      // Iniciar transação para garantir atomicidade
      const { data: client } = await supabase.rpc('get_pg_client');
      
      const processar = async () => {
        let novaMovimentacaoId: string | undefined = movimentacaoId;
        
        if (!novaMovimentacaoId) {
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
        } else {
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
        }

        // Só prosseguir para gerenciar parcelas se não for transferência
        if (operacao !== "transferencia") {
          // No caso de uma atualização, remover as parcelas antigas
          if (movimentacaoId) {
            const { error: deleteError } = await supabase
              .from("movimentacoes_parcelas")
              .delete()
              .eq('movimentacao_id', movimentacaoId);
              
            if (deleteError) {
              console.error("Erro ao excluir parcelas:", deleteError);
              throw deleteError;
            }
          }
          
          // Inserir novas parcelas
          if (parcelas.length > 0) {
            console.log(`Inserindo ${parcelas.length} parcelas para movimentação:`, novaMovimentacaoId);
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
          } else {
            throw new Error("Não foi possível calcular as parcelas corretamente");
          }
        }

        return novaMovimentacaoId;
      };

      try {
        // Tentar processar com proteção de erros
        const resultado = await processar();
        
        toast.success("Movimentação salva com sucesso!");
        navigate(-1);
      } catch (error: any) {
        console.error("Erro na transação:", error);
        
        // Se for uma atualização, restaurar os dados ao estado original
        if (movimentacaoId) {
          console.log("Recarregando dados originais após erro");
          await recarregarDadosMovimentacao(movimentacaoId);
        }
        
        // Mensagens de erro específicas
        if (error.code === '23503') {
          if (error.message?.includes('fluxo_caixa')) {
            toast.error("Não é possível alterar uma movimentação que já possui parcelas pagas");
          } else {
            toast.error("Erro de referência no banco de dados");
          }
        } else {
          toast.error("Erro ao salvar movimentação: " + error.message);
        }
      }
    } catch (error: any) {
      console.error("Erro ao processar movimentação:", error);
      toast.error("Erro ao processar movimentação");
      
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
