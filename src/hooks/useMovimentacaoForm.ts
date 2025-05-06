
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { toast } from "sonner";
import { formatDate, parseDateString } from "@/lib/utils";

export const useMovimentacaoForm = (movimentacaoEditando) => {
  const { currentCompany } = useCompany();
  const [operacao, setOperacao] = useState(movimentacaoEditando?.tipo_operacao || "pagar");
  const [dataEmissao, setDataEmissao] = useState(movimentacaoEditando?.data_emissao ? parseDateString(formatDate(movimentacaoEditando.data_emissao)) : new Date());
  const [dataLancamento, setDataLancamento] = useState(movimentacaoEditando?.data_lancamento ? parseDateString(formatDate(movimentacaoEditando.data_lancamento)) : new Date());
  const [numDoc, setNumDoc] = useState(movimentacaoEditando?.numero_documento || "");
  const [tipoTitulo, setTipoTitulo] = useState(movimentacaoEditando?.tipo_titulo_id || "");
  const [favorecido, setFavorecido] = useState(movimentacaoEditando?.favorecido_id || "");
  const [categoria, setCategoria] = useState(movimentacaoEditando?.categoria_id || "");
  const [formaPagamento, setFormaPagamento] = useState(movimentacaoEditando?.forma_pagamento || "1");
  const [descricao, setDescricao] = useState(movimentacaoEditando?.descricao || "");
  const [valor, setValor] = useState(movimentacaoEditando?.valor ? movimentacaoEditando.valor.toString() : "0");
  const [numParcelas, setNumParcelas] = useState(movimentacaoEditando?.numero_parcelas || 1);
  const [dataPrimeiroVenc, setDataPrimeiroVenc] = useState(movimentacaoEditando?.primeiro_vencimento ? parseDateString(formatDate(movimentacaoEditando.primeiro_vencimento)) : new Date());
  const [considerarDRE, setConsiderarDRE] = useState(movimentacaoEditando?.considerar_dre ?? true);
  const [contaOrigem, setContaOrigem] = useState(movimentacaoEditando?.conta_origem_id || "");
  const [contaDestino, setContaDestino] = useState(movimentacaoEditando?.conta_destino_id || "");
  const [parcelas, setParcelas] = useState(movimentacaoEditando?.parcelas || []);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Novos campos
  const [mesReferencia, setMesReferencia] = useState(movimentacaoEditando?.mes_referencia || "");
  const [documentoPdf, setDocumentoPdf] = useState(movimentacaoEditando?.documento_pdf || "");

  const handleValorChange = (e) => {
    const value = e.target.value.replace(/[^0-9,.]/g, '');
    setValor(value);
  };

  // Calcular parcelas quando os valores relevantes mudarem
  useEffect(() => {
    if (operacao !== "transferencia" && Number(numParcelas) > 0 && dataPrimeiroVenc) {
      const valorNumerico = parseFloat(valor.replace(/\./g, '').replace(',', '.')) || 0;
      const valorParcela = valorNumerico / Number(numParcelas);
      
      const novasParcelas = Array.from({ length: Number(numParcelas) }).map((_, index) => {
        // Calcular a data de vencimento para cada parcela
        const dataVencimento = new Date(dataPrimeiroVenc);
        dataVencimento.setMonth(dataPrimeiroVenc.getMonth() + index);

        return {
          numero: index + 1,
          valor: valorParcela,
          dataVencimento
        };
      });
      
      setParcelas(novasParcelas);
    }
  }, [valor, numParcelas, dataPrimeiroVenc, operacao]);

  const atualizarValorParcela = (index, novoValor) => {
    const novasParcelas = [...parcelas];
    novasParcelas[index].valor = novoValor;
    setParcelas(novasParcelas);
  };

  const atualizarDataVencimento = (index, novaData) => {
    const novasParcelas = [...parcelas];
    novasParcelas[index].dataVencimento = novaData;
    setParcelas(novasParcelas);
  };

  // Função auxiliar para formatar mês/ano no padrão MM/YYYY
  const formatarMesReferencia = (data) => {
    if (!data) return "";
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${mes}/${ano}`;
  };

  // Atualizar mês de referência quando a data de lançamento mudar (inicialmente)
  useEffect(() => {
    if (dataLancamento && !mesReferencia) {
      setMesReferencia(formatarMesReferencia(dataLancamento));
    }
  }, [dataLancamento]);

  // Função para fazer upload do documento PDF
  const uploadDocumentoPdf = async (file) => {
    if (!file || !currentCompany?.id) return null;
    
    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${currentCompany.id}/movimentacoes/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documentos')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // Obter URL pública do arquivo
      const { data } = supabase.storage
        .from('documentos')
        .getPublicUrl(filePath);
        
      return data.publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload do arquivo:', error);
      toast.error('Erro ao fazer upload do documento');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleDocumentoChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = await uploadDocumentoPdf(file);
      if (url) {
        setDocumentoPdf(url);
        toast.success("Documento anexado com sucesso!");
      }
    }
  };

  const handleSalvar = async () => {
    if (!currentCompany?.id) {
      toast.error("Nenhuma empresa selecionada");
      return;
    }

    // Validações básicas
    if (operacao === "transferencia") {
      if (!contaOrigem || !contaDestino || !valor || Number(valor) <= 0) {
        toast.error("Preencha todos os campos obrigatórios");
        return;
      }
    } else {
      if (!tipoTitulo || !favorecido || !categoria || !valor || Number(valor) <= 0) {
        toast.error("Preencha todos os campos obrigatórios");
        return;
      }
    }

    try {
      setIsLoading(true);
      
      // Formatar valor para o banco de dados
      const valorNumerico = parseFloat(valor.replace(/\./g, '').replace(',', '.'));
      
      // Formatando datas para o formato aceito pelo Supabase
      const dataEmissaoFormatada = dataEmissao.toISOString().split('T')[0];
      const dataLancamentoFormatada = dataLancamento.toISOString().split('T')[0];
      const dataPrimeiroVencFormatada = dataPrimeiroVenc ? dataPrimeiroVenc.toISOString().split('T')[0] : null;

      // Dados comuns para todas as operações
      const dadosMovimentacao = {
        empresa_id: currentCompany.id,
        tipo_operacao: operacao,
        data_emissao: dataEmissaoFormatada,
        data_lancamento: dataLancamentoFormatada,
        valor: valorNumerico,
        descricao,
        mes_referencia: mesReferencia,
        documento_pdf: documentoPdf,
      };

      // Adicionando dados específicos por tipo de operação
      if (operacao === "transferencia") {
        Object.assign(dadosMovimentacao, {
          conta_origem_id: contaOrigem,
          conta_destino_id: contaDestino,
          numero_parcelas: 1,
          considerar_dre: false,
        });
      } else {
        Object.assign(dadosMovimentacao, {
          numero_documento: numDoc,
          tipo_titulo_id: tipoTitulo,
          favorecido_id: favorecido,
          categoria_id: categoria,
          forma_pagamento: formaPagamento,
          numero_parcelas: Number(numParcelas),
          primeiro_vencimento: dataPrimeiroVencFormatada,
          considerar_dre: considerarDRE,
        });
      }

      let movimentacaoId;

      if (movimentacaoEditando?.id) {
        // Atualizar movimentação existente
        const { data, error } = await supabase
          .from('movimentacoes')
          .update(dadosMovimentacao)
          .eq('id', movimentacaoEditando.id)
          .select();

        if (error) throw error;
        movimentacaoId = movimentacaoEditando.id;
        
        // Excluir parcelas antigas para recriá-las
        if (operacao !== "transferencia") {
          const { error: erroDeletar } = await supabase
            .from('movimentacoes_parcelas')
            .delete()
            .eq('movimentacao_id', movimentacaoId);
          
          if (erroDeletar) throw erroDeletar;
        }
      } else {
        // Inserir nova movimentação
        const { data, error } = await supabase
          .from('movimentacoes')
          .insert(dadosMovimentacao)
          .select();

        if (error) throw error;
        movimentacaoId = data[0].id;
      }

      // Criar parcelas se não for transferência
      if (operacao !== "transferencia" && parcelas && parcelas.length > 0) {
        const parcelasFormatadas = parcelas.map(parcela => ({
          movimentacao_id: movimentacaoId,
          numero: parcela.numero,
          valor: parcela.valor,
          data_vencimento: parcela.dataVencimento.toISOString().split('T')[0],
        }));

        const { error: erroParcelas } = await supabase
          .from('movimentacoes_parcelas')
          .insert(parcelasFormatadas);

        if (erroParcelas) throw erroParcelas;
      }

      toast.success(movimentacaoEditando?.id ? "Movimentação atualizada com sucesso!" : "Movimentação registrada com sucesso!");
      setTimeout(() => window.history.back(), 1000);
    } catch (error) {
      console.error("Erro ao salvar movimentação:", error);
      toast.error(error.message || "Erro ao salvar movimentação");
    } finally {
      setIsLoading(false);
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
    tipoTitulo,
    setTipoTitulo,
    favorecido,
    setFavorecido,
    categoria,
    setCategoria,
    formaPagamento,
    setFormaPagamento,
    descricao,
    setDescricao,
    valor,
    setValor,
    handleValorChange,
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
    parcelas,
    atualizarValorParcela,
    atualizarDataVencimento,
    mesReferencia,
    setMesReferencia,
    documentoPdf,
    setDocumentoPdf,
    handleDocumentoChange,
    handleSalvar,
    isLoading,
    isUploading
  };
};
