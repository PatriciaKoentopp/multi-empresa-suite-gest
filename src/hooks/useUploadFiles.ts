import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface UploadFile {
  id: string;
  empresa_id: string;
  tipo_relatorio: string;
  nome_arquivo: string;
  tamanho_bytes: number;
  mime_type: string;
  storage_path: string;
  total_linhas: number;
  data_upload: string;
  uploaded_by: string | null;
  status: string;
  erro_mensagem: string | null;
  metadados: any;
  created_at: string;
  updated_at: string;
}

export const useUploadFiles = () => {
  const { toast } = useToast();
  const [uploads, setUploads] = useState<UploadFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUploadsByTipo = async (tipoRelatorio: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("upload_files")
        .select("*")
        .eq("tipo_relatorio", tipoRelatorio)
        .order("data_upload", { ascending: false });

      if (error) throw error;
      setUploads(data || []);
      return data || [];
    } catch (error: any) {
      toast({
        title: "Erro ao carregar uploads",
        description: error.message,
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const deleteUpload = async (uploadId: string) => {
    try {
      setIsLoading(true);
      
      // Buscar o arquivo para deletar do storage também
      const { data: uploadData } = await supabase
        .from("upload_files")
        .select("storage_path")
        .eq("id", uploadId)
        .single();

      if (uploadData?.storage_path) {
        await supabase.storage
          .from("relatorios-planilhas")
          .remove([uploadData.storage_path]);
      }

      // Deletar registro (cascade irá deletar os dados relacionados)
      const { error } = await supabase
        .from("upload_files")
        .delete()
        .eq("id", uploadId);

      if (error) throw error;

      setUploads(uploads.filter((u) => u.id !== uploadId));
      toast({
        title: "Upload excluído",
        description: "Arquivo e dados removidos com sucesso",
      });
      return true;
    } catch (error: any) {
      toast({
        title: "Erro ao excluir upload",
        description: error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const downloadOriginalFile = async (storagePath: string, nomeArquivo: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("relatorios-planilhas")
        .download(storagePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = nomeArquivo;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download iniciado",
        description: "O arquivo está sendo baixado",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao baixar arquivo",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return {
    uploads,
    isLoading,
    fetchUploadsByTipo,
    deleteUpload,
    downloadOriginalFile,
  };
};
