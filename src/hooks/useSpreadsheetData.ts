import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

export interface SpreadsheetData {
  id: string;
  upload_file_id: string;
  empresa_id: string;
  tipo_relatorio: string;
  linha_numero: number;
  dados: any;
  created_at: string;
}

export interface HoraTrabalhadaData {
  projeto: string;
  cliente: string;
  descricao: string;
  tarefa: string;
  usuario: string;
  grupo: string;
  email: string;
  etiqueta: string;
  faturavel: boolean;
  data_inicio: string;
  hora_inicio: string;
  data_final: string;
  hora_termino: string;
  duracao_horas: string;
  duracao_decimal: number;
  valor_faturavel: number;
}

export const useSpreadsheetData = () => {
  const { toast } = useToast();
  const [data, setData] = useState<SpreadsheetData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDataByUpload = async (uploadId: string, filtros?: any) => {
    try {
      setIsLoading(true);
      let query = supabase
        .from("spreadsheet_data")
        .select("*", { count: 'exact' })
        .eq("upload_file_id", uploadId)
        .range(0, 10000)
        .limit(10000);

      if (filtros?.dataInicio) {
        query = query.gte("dados->>data_inicio", filtros.dataInicio);
      }
      if (filtros?.dataFim) {
        query = query.lte("dados->>data_final", filtros.dataFim);
      }
      if (filtros?.projeto) {
        query = query.ilike("dados->>projeto", `%${filtros.projeto}%`);
      }
      if (filtros?.cliente) {
        query = query.ilike("dados->>cliente", `%${filtros.cliente}%`);
      }
      if (filtros?.usuario) {
        query = query.ilike("dados->>usuario", `%${filtros.usuario}%`);
      }
      if (filtros?.tarefa) {
        query = query.ilike("dados->>tarefa", `%${filtros.tarefa}%`);
      }
      if (filtros?.faturavel !== undefined && filtros?.faturavel !== "todos") {
        query = query.eq("dados->>faturavel", filtros.faturavel === "sim" ? "true" : "false");
      }

      console.log('[DEBUG fetchDataByUpload] Iniciando query para Upload ID:', uploadId);
      console.log('[DEBUG fetchDataByUpload] Filtros aplicados:', filtros);

      const { data: result, error, count } = await query;

      console.log('[DEBUG fetchDataByUpload] Count total no banco:', count);
      console.log('[DEBUG fetchDataByUpload] Total de registros retornados:', result?.length || 0);
      
      if (error) {
        console.error('[DEBUG fetchDataByUpload] Erro na query:', error);
        throw error;
      }
      setData(result || []);
      return result || [];
    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const parseExcelAndInsert = async (
    file: File,
    empresaId: string,
    tipoRelatorio: string,
    uploadedBy: string
  ) => {
    try {
      setIsLoading(true);

      // Ler o arquivo Excel
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        throw new Error("Planilha vazia ou sem dados válidos");
      }

      // Fazer upload do arquivo original para o storage
      const timestamp = Date.now();
      const storagePath = `${empresaId}/${timestamp}_${file.name}`;
      
      const { error: storageError } = await supabase.storage
        .from("relatorios-planilhas")
        .upload(storagePath, file);

      if (storageError) throw storageError;

      // Criar registro de upload
      const { data: uploadRecord, error: uploadError } = await supabase
        .from("upload_files")
        .insert({
          empresa_id: empresaId,
          tipo_relatorio: tipoRelatorio,
          nome_arquivo: file.name,
          tamanho_bytes: file.size,
          mime_type: file.type,
          storage_path: storagePath,
          total_linhas: jsonData.length,
          uploaded_by: uploadedBy,
          status: "processando",
        })
        .select()
        .single();

      if (uploadError) throw uploadError;

      // Processar e inserir dados em lotes
      const batchSize = 1000;
      const totalBatches = Math.ceil(jsonData.length / batchSize);

      for (let i = 0; i < totalBatches; i++) {
        const batch = jsonData.slice(i * batchSize, (i + 1) * batchSize);
        const dataToInsert = batch.map((row: any, index: number) => ({
          upload_file_id: uploadRecord.id,
          empresa_id: empresaId,
          tipo_relatorio: tipoRelatorio,
          linha_numero: i * batchSize + index + 1,
          dados: normalizeRowData(row, tipoRelatorio),
        }));

        const { error: insertError } = await supabase
          .from("spreadsheet_data")
          .insert(dataToInsert);

        if (insertError) throw insertError;
      }

      // Atualizar status do upload
      await supabase
        .from("upload_files")
        .update({ status: "processado" })
        .eq("id", uploadRecord.id);

      toast({
        title: "Upload concluído",
        description: `${jsonData.length} registros processados com sucesso`,
      });

      return uploadRecord.id;
    } catch (error: any) {
      toast({
        title: "Erro ao processar planilha",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const normalizeRowData = (row: any, tipoRelatorio: string): any => {
    if (tipoRelatorio === "tempo") {
      let duracaoDecimal = parseFloat(row["Duração (decimal)"] || 0);
      const duracaoHoras = row["Duração (h)"] || "";
      
      // Se duracao_decimal não existir ou for 0, tentar calcular a partir de duracao_horas
      if (duracaoDecimal === 0 && duracaoHoras) {
        try {
          const [hours, minutes, seconds] = duracaoHoras.split(':').map(Number);
          duracaoDecimal = hours + (minutes / 60) + (seconds / 3600);
        } catch (error) {
          console.error("Erro ao converter duração:", error);
        }
      }
      
      return {
        projeto: row["Projeto"] || "",
        cliente: row["Cliente"] || "",
        descricao: row["Descrição"] || "",
        tarefa: row["Tarefa"] || "",
        usuario: row["Usuário"] || "",
        grupo: row["Grupo"] || "",
        email: row["E-mail"] || "",
        etiqueta: row["Etiqueta"] || "",
        faturavel: row["Faturável"] === "Sim",
        data_inicio: row["Data de início"] || "",
        hora_inicio: row["Hora de início"] || "",
        data_final: row["Data final"] || "",
        hora_termino: row["Hora de término"] || "",
        duracao_horas: duracaoHoras,
        duracao_decimal: duracaoDecimal,
        valor_faturavel: parseFloat(row["Valor faturável"] || 0),
      };
    }
    return row;
  };

  return {
    data,
    isLoading,
    fetchDataByUpload,
    parseExcelAndInsert,
  };
};
