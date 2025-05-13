
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { format } from "date-fns";

// Definições de tipos locais para o formulário de movimentação
interface Parcela {
  numero: number;
  valor: number;
  dataVencimento: Date;
  data_vencimento?: string;  // Para compatibilidade com dados existentes
}

interface MovimentacaoProps {
  id?: string;
  operacao?: "pagar" | "receber" | "transferencia";
  data_emissao?: string | Date;
  data_lancamento?: string | Date;
  num_documento?: string;
  favorecido_id?: string;
  categoria_id?: string;
  tipo_titulo_id?: string;
  descricao?: string;
  valor?: number;
  forma_pagamento_id?: string;
  parcelas?: Parcela[];
  conta_origem_id?: string;
  conta_destino_id?: string;
  considerar_dre?: boolean;
  mes_referencia?: string;
  documento_url?: string;
}

export function useMovimentacaoForm(movimentacaoEditando?: MovimentacaoProps) {
  const { toast } = useToast();
  const { currentCompany } = useCompany();
  
  // Estados do formulário
  const [operacao, setOperacao] = useState<"pagar" | "receber" | "transferencia">(
    movimentacaoEditando?.operacao || "pagar"
  );
  const [dataEmissao, setDataEmissao] = useState<Date>(
    movimentacaoEditando?.data_emissao 
      ? new Date(movimentacaoEditando.data_emissao) 
      : new Date()
  );
  const [dataLancamento, setDataLancamento] = useState<Date>(
    movimentacaoEditando?.data_lancamento 
      ? new Date(movimentacaoEditando.data_lancamento) 
      : new Date()
  );
  const [numDoc, setNumDoc] = useState(movimentacaoEditando?.num_documento || "");
  const [favorecido, setFavorecido] = useState(movimentacaoEditando?.favorecido_id || "");
  const [categoria, setCategoria] = useState(movimentacaoEditando?.categoria_id || "");
  const [tipoTitulo, setTipoTitulo] = useState(movimentacaoEditando?.tipo_titulo_id || "");
  const [descricao, setDescricao] = useState(movimentacaoEditando?.descricao || "");
  const [valor, setValor] = useState(movimentacaoEditando?.valor?.toString() || "");
  const [formaPagamento, setFormaPagamento] = useState(movimentacaoEditando?.forma_pagamento_id || "1");
  const [numParcelas, setNumParcelas] = useState(
    movimentacaoEditando?.parcelas?.length || 1
  );
  const [dataPrimeiroVenc, setDataPrimeiroVenc] = useState<Date>(new Date());
  const [considerarDRE, setConsiderarDRE] = useState(
    movimentacaoEditando?.considerar_dre !== undefined
      ? movimentacaoEditando.considerar_dre
      : true
  );
  const [contaOrigem, setContaOrigem] = useState(
    movimentacaoEditando?.conta_origem_id || ""
  );
  const [contaDestino, setContaDestino] = useState(
    movimentacaoEditando?.conta_destino_id || ""
  );
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [mesReferencia, setMesReferencia] = useState(
    movimentacaoEditando?.mes_referencia || format(new Date(), "MM/yyyy")
  );
  
  // Estados para documento
  const [documentoPdf, setDocumentoPdf] = useState<string | null>(
    movimentacaoEditando?.documento_url || null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Efeito para calcular parcelas ao inicializar ou quando valores relevantes mudarem
  useEffect(() => {
    if (movimentacaoEditando?.parcelas && movimentacaoEditando.parcelas.length > 0) {
      // Se estiver editando, use as parcelas existentes
      setParcelas(movimentacaoEditando.parcelas);
      
      // Encontrar a data do primeiro vencimento
      const primeiraData = movimentacaoEditando.parcelas
        .map(p => p.dataVencimento || new Date(p.data_vencimento || ""))
        .sort((a, b) => a.getTime() - b.getTime())[0];
      
      if (primeiraData) {
        setDataPrimeiroVenc(primeiraData);
      }
    } else {
      // Caso contrário, calcular novas parcelas
      calcularParcelas();
    }
  }, [movimentacaoEditando?.parcelas]);

  // Usar useEffect para recalcular parcelas quando valores relevantes mudarem
  useEffect(() => {
    if (!movimentacaoEditando) {
      calcularParcelas();
    }
  }, [numParcelas, valor, dataPrimeiroVenc]);

  // Função para calcular as parcelas
  const calcularParcelas = () => {
    if (!valor || Number(valor) <= 0 || numParcelas <= 0) {
      setParcelas([]);
      return;
    }

    const valorTotal = Number(valor);
    const valorParcela = valorTotal / numParcelas;
    
    const novasParcelas: Parcela[] = [];
    
    for (let i = 0; i < numParcelas; i++) {
      const dataVenc = new Date(dataPrimeiroVenc);
      dataVenc.setMonth(dataPrimeiroVenc.getMonth() + i);
      
      novasParcelas.push({
        numero: i + 1,
        valor: valorParcela,
        dataVencimento: new Date(dataVenc)
      });
    }
    
    setParcelas(novasParcelas);
  };

  // Handler para atualizar valor de uma parcela específica
  const atualizarValorParcela = (index: number, novoValor: number) => {
    setParcelas(prevParcelas => {
      const novasParcelas = [...prevParcelas];
      novasParcelas[index] = { ...novasParcelas[index], valor: novoValor };
      return novasParcelas;
    });
  };

  // Handler para atualizar data de vencimento de uma parcela específica
  const atualizarDataVencimento = (index: number, novaData: Date) => {
    setParcelas(prevParcelas => {
      const novasParcelas = [...prevParcelas];
      novasParcelas[index] = { ...novasParcelas[index], dataVencimento: novaData };
      return novasParcelas;
    });
  };

  // Tratar mudança no valor total
  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValor(value);
  };

  // Upload de documento PDF
  const handleDocumentoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !currentCompany?.id) {
      return;
    }
    
    const file = e.target.files[0];
    if (file.type !== 'application/pdf') {
      toast({
        title: "Erro",
        description: "Apenas arquivos PDF são aceitos",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${currentCompany.id}/documentos/${fileName}`;
      
      // Upload do arquivo para o Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('documentos_financeiros')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      // Gerar URL pública do arquivo
      const { data } = supabase.storage
        .from('documentos_financeiros')
        .getPublicUrl(filePath);
        
      // Atualizar estado com a URL do documento
      setDocumentoPdf(data.publicUrl);
      
      toast({
        title: "Sucesso",
        description: "Documento anexado com sucesso",
      });
    } catch (error) {
      console.error('Erro ao fazer upload do documento:', error);
      toast({
        title: "Erro",
        description: "Erro ao fazer upload do documento",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Função principal para salvar a movimentação
  const handleSalvar = async () => {
    if (!currentCompany?.id) {
      toast.error("Nenhuma empresa selecionada");
      return false;
    }

    // Validações básicas
    if (operacao === "transferencia") {
      if (!contaOrigem || !contaDestino || !valor || Number(valor) <= 0) {
        toast.error("Preencha todos os campos obrigatórios");
        return false;
      }
    } else {
      if (!tipoTitulo || !favorecido || !categoria || !valor || Number(valor) <= 0) {
        toast.error("Preencha todos os campos obrigatórios");
        return false;
      }
    }

    setIsLoading(true);

    try {
      const dadosComuns = {
        empresa_id: currentCompany.id,
        operacao,
        data_emissao: format(dataEmissao, "yyyy-MM-dd"),
        data_lancamento: format(dataLancamento, "yyyy-MM-dd"),
        descricao,
        valor: Number(valor),
        mes_referencia: mesReferencia || format(new Date(), "MM/yyyy"),
        documento_url: documentoPdf,
        updated_at: new Date().toISOString(),
      };

      // Dados específicos para cada tipo de operação
      if (operacao === "transferencia") {
        const dadosTransferencia = {
          ...dadosComuns,
          conta_origem_id: contaOrigem,
          conta_destino_id: contaDestino,
        };

        if (movimentacaoEditando?.id) {
          // Atualizar transferência existente
          await supabase
            .from("movimentacoes")
            .update(dadosTransferencia)
            .eq("id", movimentacaoEditando.id);
        } else {
          // Inserir nova transferência
          await supabase.from("movimentacoes").insert({
            ...dadosTransferencia,
            created_at: new Date().toISOString(),
          });
        }
      } else {
        // Dados para operações de pagamento ou recebimento
        const dadosTitulo = {
          ...dadosComuns,
          num_documento: numDoc,
          favorecido_id: favorecido,
          categoria_id: categoria,
          tipo_titulo_id: tipoTitulo,
          forma_pagamento_id: formaPagamento,
          considerar_dre: considerarDRE,
        };

        let movimentacaoId = movimentacaoEditando?.id;

        if (movimentacaoId) {
          // Atualizar movimentação existente
          await supabase
            .from("movimentacoes")
            .update(dadosTitulo)
            .eq("id", movimentacaoId);
        } else {
          // Inserir nova movimentação
          const { data, error } = await supabase
            .from("movimentacoes")
            .insert({
              ...dadosTitulo,
              created_at: new Date().toISOString(),
            })
            .select("id")
            .single();

          if (error) throw error;
          movimentacaoId = data.id;
        }

        // Tratar parcelas
        if (movimentacaoId) {
          // Se estiver editando, excluir parcelas antigas
          if (movimentacaoEditando?.id) {
            await supabase
              .from("parcelas")
              .delete()
              .eq("movimentacao_id", movimentacaoId);
          }

          // Inserir parcelas atualizadas
          const parcelasData = parcelas.map((parcela) => ({
            movimentacao_id: movimentacaoId,
            numero: parcela.numero,
            valor: parcela.valor,
            data_vencimento: format(parcela.dataVencimento, "yyyy-MM-dd"),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));

          await supabase.from("parcelas").insert(parcelasData);
        }
      }

      toast.success(movimentacaoEditando?.id ? "Movimentação atualizada com sucesso!" : "Movimentação registrada com sucesso!");
      
      return true; // Retornar true para indicar que o salvamento foi bem-sucedido
    } catch (error) {
      console.error("Erro ao salvar movimentação:", error);
      toast.error("Erro ao salvar movimentação");
      return false;
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
    atualizarValorParcela,
    atualizarDataVencimento,
    mesReferencia,
    setMesReferencia,
    documentoPdf,
    setDocumentoPdf,
    handleDocumentoChange,
    isLoading,
    isUploading,
  };
}
