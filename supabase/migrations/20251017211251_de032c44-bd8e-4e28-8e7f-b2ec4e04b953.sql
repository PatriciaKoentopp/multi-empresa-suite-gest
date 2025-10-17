-- Criar tabela upload_files para metadados dos arquivos
CREATE TABLE upload_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL,
  tipo_relatorio varchar NOT NULL,
  nome_arquivo text NOT NULL,
  tamanho_bytes bigint NOT NULL,
  mime_type varchar NOT NULL,
  storage_path text NOT NULL,
  total_linhas integer NOT NULL DEFAULT 0,
  data_upload timestamp with time zone NOT NULL DEFAULT now(),
  uploaded_by uuid,
  status varchar NOT NULL DEFAULT 'processado',
  erro_mensagem text,
  metadados jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Criar tabela spreadsheet_data para dados processados
CREATE TABLE spreadsheet_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_file_id uuid NOT NULL REFERENCES upload_files(id) ON DELETE CASCADE,
  empresa_id uuid NOT NULL,
  tipo_relatorio varchar NOT NULL,
  linha_numero integer NOT NULL,
  dados jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_spreadsheet_data_upload_file ON spreadsheet_data(upload_file_id);
CREATE INDEX idx_spreadsheet_data_empresa ON spreadsheet_data(empresa_id);
CREATE INDEX idx_spreadsheet_data_tipo ON spreadsheet_data(tipo_relatorio);
CREATE INDEX idx_spreadsheet_data_dados ON spreadsheet_data USING GIN(dados);

-- RLS para upload_files
ALTER TABLE upload_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários só veem uploads da sua empresa"
  ON upload_files FOR SELECT
  USING (empresa_id = get_user_company_id());

CREATE POLICY "Usuários só inserem uploads na sua empresa"
  ON upload_files FOR INSERT
  WITH CHECK (empresa_id = get_user_company_id());

CREATE POLICY "Usuários só atualizam uploads da sua empresa"
  ON upload_files FOR UPDATE
  USING (empresa_id = get_user_company_id());

CREATE POLICY "Usuários só excluem uploads da sua empresa"
  ON upload_files FOR DELETE
  USING (empresa_id = get_user_company_id());

-- RLS para spreadsheet_data
ALTER TABLE spreadsheet_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários só veem dados de planilhas da sua empresa"
  ON spreadsheet_data FOR SELECT
  USING (empresa_id = get_user_company_id());

CREATE POLICY "Usuários só inserem dados de planilhas na sua empresa"
  ON spreadsheet_data FOR INSERT
  WITH CHECK (empresa_id = get_user_company_id());

CREATE POLICY "Usuários só atualizam dados de planilhas da sua empresa"
  ON spreadsheet_data FOR UPDATE
  USING (empresa_id = get_user_company_id());

CREATE POLICY "Usuários só excluem dados de planilhas da sua empresa"
  ON spreadsheet_data FOR DELETE
  USING (empresa_id = get_user_company_id());

-- Criar bucket para arquivos de planilhas
INSERT INTO storage.buckets (id, name, public) 
VALUES ('relatorios-planilhas', 'relatorios-planilhas', false);

-- Políticas de storage
CREATE POLICY "Usuários podem ver arquivos da sua empresa"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'relatorios-planilhas' AND (storage.foldername(name))[1] = get_user_company_id()::text);

CREATE POLICY "Usuários podem fazer upload na sua empresa"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'relatorios-planilhas' AND (storage.foldername(name))[1] = get_user_company_id()::text);

CREATE POLICY "Usuários podem deletar arquivos da sua empresa"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'relatorios-planilhas' AND (storage.foldername(name))[1] = get_user_company_id()::text);

-- Trigger para updated_at em upload_files
CREATE TRIGGER update_upload_files_updated_at
  BEFORE UPDATE ON upload_files
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();