import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/company-context';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

interface BackupTable {
  id: string;
  name: string;
  description: string;
}

export const backupTables: BackupTable[] = [
  { id: 'empresas', name: 'Empresa', description: 'Dados da empresa' },
  { id: 'favorecidos', name: 'Favorecidos', description: 'Clientes e fornecedores' },
  { id: 'grupo_favorecidos', name: 'Grupos de Favorecidos', description: 'Grupos de favorecidos' },
  { id: 'profissoes', name: 'Profissões', description: 'Profissões cadastradas' },
  { id: 'origens', name: 'Origens', description: 'Origens dos leads' },
  { id: 'motivos_perda', name: 'Motivos de Perda', description: 'Motivos de perda de leads' },
  { id: 'contas_correntes', name: 'Contas Correntes', description: 'Contas bancárias' },
  { id: 'tipos_titulos', name: 'Tipos de Títulos', description: 'Tipos de títulos' },
  { id: 'plano_contas', name: 'Plano de Contas', description: 'Plano de contas' },
  { id: 'produtos', name: 'Produtos', description: 'Produtos cadastrados' },
  { id: 'grupo_produtos', name: 'Grupos de Produtos', description: 'Grupos de produtos' },
  { id: 'servicos', name: 'Serviços', description: 'Serviços cadastrados' },
  { id: 'tabelas_precos', name: 'Tabelas de Preços', description: 'Tabelas de preços de serviços' },
  { id: 'tabelas_precos_itens', name: 'Itens de Tabelas de Preços', description: 'Itens das tabelas de preços' },
  { id: 'movimentacoes', name: 'Movimentações', description: 'Movimentações financeiras' },
  { id: 'movimentacoes_parcelas', name: 'Parcelas', description: 'Parcelas das movimentações' },
  { id: 'impostos_retidos', name: 'Impostos Retidos', description: 'Cadastro de impostos retidos' },
  { id: 'movimentacoes_impostos_retidos', name: 'Movim. Impostos Retidos', description: 'Impostos retidos das movimentações' },
  { id: 'fluxo_caixa', name: 'Fluxo de Caixa', description: 'Fluxo de caixa' },
  { id: 'antecipacoes', name: 'Antecipações', description: 'Antecipações' },
  { id: 'movimentacoes_parcelas_antecipacoes', name: 'Uso de Antecipações', description: 'Vínculo de antecipações com parcelas' },
  { id: 'lancamentos_contabeis', name: 'Lançamentos Contábeis', description: 'Lançamentos contábeis' },
  { id: 'fechamentos_mensais', name: 'Fechamentos Mensais', description: 'Fechamentos mensais' },
  { id: 'funis', name: 'Funis', description: 'Funis do CRM' },
  { id: 'funil_etapas', name: 'Etapas do Funil', description: 'Etapas dos funis' },
  { id: 'leads', name: 'Leads', description: 'Leads do CRM' },
  { id: 'leads_interacoes', name: 'Interações de Leads', description: 'Interações dos leads' },
  { id: 'leads_fechamento', name: 'Fechamentos de Leads', description: 'Fechamentos dos leads' },
  { id: 'orcamentos', name: 'Orçamentos', description: 'Orçamentos/Vendas' },
  { id: 'orcamentos_itens', name: 'Itens de Orçamentos', description: 'Itens dos orçamentos' },
  { id: 'orcamentos_parcelas', name: 'Parcelas de Orçamentos', description: 'Parcelas dos orçamentos' },
  { id: 'numeracao_orcamentos', name: 'Numeração de Orçamentos', description: 'Controle de numeração de orçamentos' },
  { id: 'contratos', name: 'Contratos', description: 'Contratos' },
  { id: 'contratos_parcelas', name: 'Parcelas de Contratos', description: 'Parcelas dos contratos' },
  { id: 'relogio_tipos_projeto', name: 'Relógio - Tipos de Projeto', description: 'Tipos de projeto do Relógio' },
  { id: 'relogio_tarefas', name: 'Relógio - Tarefas', description: 'Tarefas dos tipos de projeto' },
  { id: 'relogio_projetos', name: 'Relógio - Projetos', description: 'Projetos do Relógio' },
  { id: 'relogio_apontamentos', name: 'Relógio - Apontamentos', description: 'Apontamentos de horas' },
  { id: 'dashboard_cards_config', name: 'Configuração Dashboard', description: 'Configuração dos cards' },
  { id: 'modulos_parametros', name: 'Parâmetros', description: 'Parâmetros dos módulos' },
  { id: 'usuarios', name: 'Usuários', description: 'Usuários da empresa' },
  { id: 'upload_files', name: 'Arquivos Importados', description: 'Arquivos de importação enviados' },
  { id: 'spreadsheet_data', name: 'Dados de Planilhas', description: 'Linhas importadas das planilhas' },
  { id: 'logs_transacoes', name: 'Logs de Transações', description: 'Logs de auditoria do sistema' },
];



// Função para formatar datas no padrão DD/MM/YYYY
const formatDateValue = (value: any): string => {
  if (!value) return '';
  
  // Verificar se é uma data válida
  if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return format(date, 'dd/MM/yyyy');
      }
    } catch {
      return value;
    }
  }
  
  return value;
};

// Função para formatar valores monetários
const formatCurrencyValue = (value: any): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return value;
};

// Função para formatar os dados de uma linha
const formatRowData = (row: Record<string, any>, dateColumns: string[], currencyColumns: string[]): Record<string, any> => {
  const formattedRow: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(row)) {
    if (dateColumns.includes(key)) {
      formattedRow[key] = formatDateValue(value);
    } else if (currencyColumns.includes(key)) {
      formattedRow[key] = formatCurrencyValue(value);
    } else {
      formattedRow[key] = value ?? '';
    }
  }
  
  return formattedRow;
};

// Colunas de data conhecidas
const dateColumns = [
  'created_at', 'updated_at', 'data', 'data_emissao', 'data_lancamento', 
  'data_vencimento', 'data_pagamento', 'data_aniversario', 'data_criacao',
  'data_inicio', 'data_fim', 'data_primeiro_vencimento', 'data_geracao_conta',
  'data_movimentacao', 'data_venda', 'data_nota_fiscal', 'ultimo_contato',
  'data_fechamento'

];

// Colunas de valor monetário conhecidas
const currencyColumns = [
  'valor', 'valor_total', 'valor_mensal', 'valor_utilizado', 'valor_disponivel',
  'valor_devolvido', 'saldo', 'saldo_inicial', 'multa', 'juros', 'desconto',
  'valor_antecipacao_utilizado'
];

export function useBackup() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTable, setCurrentTable] = useState<string>('');
  const { currentCompany } = useCompany();

  const fetchTableData = async (tableId: string, empresaId: string): Promise<any[]> => {
    let query;

    switch (tableId) {
      case 'empresas':
        query = supabase.from('empresas').select('*').eq('id', empresaId);
        break;

      case 'movimentacoes_parcelas':
        // Buscar parcelas através das movimentações da empresa
        const { data: movIds } = await supabase
          .from('movimentacoes')
          .select('id')
          .eq('empresa_id', empresaId);
        
        if (!movIds || movIds.length === 0) return [];
        
        query = supabase
          .from('movimentacoes_parcelas')
          .select('*')
          .in('movimentacao_id', movIds.map(m => m.id));
        break;

      case 'funil_etapas':
        // Buscar etapas através dos funis da empresa
        const { data: funilIds } = await supabase
          .from('funis')
          .select('id')
          .eq('empresa_id', empresaId);
        
        if (!funilIds || funilIds.length === 0) return [];
        
        query = supabase
          .from('funil_etapas')
          .select('*')
          .in('funil_id', funilIds.map(f => f.id));
        break;

      case 'leads_interacoes':
      case 'leads_fechamento':
        // Buscar através dos leads da empresa
        const { data: leadIds } = await supabase
          .from('leads')
          .select('id')
          .eq('empresa_id', empresaId);
        
        if (!leadIds || leadIds.length === 0) return [];
        
        query = supabase
          .from(tableId)
          .select('*')
          .in('lead_id', leadIds.map(l => l.id));
        break;

      case 'orcamentos_itens':
      case 'orcamentos_parcelas':
        // Buscar através dos orçamentos da empresa
        const { data: orcIds } = await supabase
          .from('orcamentos')
          .select('id')
          .eq('empresa_id', empresaId);
        
        if (!orcIds || orcIds.length === 0) return [];
        
        query = supabase
          .from(tableId)
          .select('*')
          .in('orcamento_id', orcIds.map(o => o.id));
        break;

      case 'contratos_parcelas':
        // Buscar através dos contratos da empresa
        const { data: contratoIds } = await supabase
          .from('contratos')
          .select('id')
          .eq('empresa_id', empresaId);
        
        if (!contratoIds || contratoIds.length === 0) return [];
        
        query = supabase
          .from('contratos_parcelas')
          .select('*')
          .in('contrato_id', contratoIds.map(c => c.id));
        break;

      case 'movimentacoes_impostos_retidos': {
        const { data: movIds2 } = await supabase
          .from('movimentacoes')
          .select('id')
          .eq('empresa_id', empresaId);
        if (!movIds2 || movIds2.length === 0) return [];
        query = supabase
          .from('movimentacoes_impostos_retidos')
          .select('*')
          .in('movimentacao_id', movIds2.map(m => m.id));
        break;
      }

      case 'movimentacoes_parcelas_antecipacoes': {
        const { data: movIds3 } = await supabase
          .from('movimentacoes')
          .select('id')
          .eq('empresa_id', empresaId);
        if (!movIds3 || movIds3.length === 0) return [];
        const { data: parcelaIds } = await supabase
          .from('movimentacoes_parcelas')
          .select('id')
          .in('movimentacao_id', movIds3.map(m => m.id));
        if (!parcelaIds || parcelaIds.length === 0) return [];
        query = supabase
          .from('movimentacoes_parcelas_antecipacoes')
          .select('*')
          .in('movimentacao_parcela_id', parcelaIds.map(p => p.id));
        break;
      }

      case 'tabelas_precos_itens': {
        const { data: tabIds } = await supabase
          .from('tabelas_precos')
          .select('id')
          .eq('empresa_id', empresaId);
        if (!tabIds || tabIds.length === 0) return [];
        query = supabase
          .from('tabelas_precos_itens')
          .select('*')
          .in('tabela_id', tabIds.map(t => t.id));
        break;
      }

      case 'relogio_tarefas': {
        const { data: tipoIds } = await supabase
          .from('relogio_tipos_projeto')
          .select('id')
          .eq('empresa_id', empresaId);
        if (!tipoIds || tipoIds.length === 0) return [];
        query = supabase
          .from('relogio_tarefas')
          .select('*')
          .in('tipo_projeto_id', tipoIds.map(t => t.id));
        break;
      }

      case 'servicos':
        // Tabela servicos usa empresa_id
        query = supabase.from('servicos').select('*').eq('empresa_id', empresaId);
        break;

      case 'tipos_titulos':
        query = supabase.from('tipos_titulos').select('*').eq('empresa_id', empresaId);
        break;


      default:
        // Tabelas com empresa_id direto
        query = supabase.from(tableId as any).select('*').eq('empresa_id', empresaId);
        break;
    }

    const { data, error } = await query;
    
    if (error) {
      console.error(`Erro ao buscar dados de ${tableId}:`, error);
      return [];
    }

    return data || [];
  };

  const generateBackup = async (selectedTables: string[]) => {
    if (!currentCompany?.id) {
      throw new Error('Empresa não selecionada');
    }

    setIsGenerating(true);
    setProgress(0);

    try {
      const workbook = XLSX.utils.book_new();
      const totalTables = selectedTables.length;

      for (let i = 0; i < selectedTables.length; i++) {
        const tableId = selectedTables[i];
        const tableInfo = backupTables.find(t => t.id === tableId);
        
        if (!tableInfo) continue;

        setCurrentTable(tableInfo.name);
        setProgress(Math.round(((i + 0.5) / totalTables) * 100));

        const data = await fetchTableData(tableId, currentCompany.id);

        // Formatar os dados
        const formattedData = data.map(row => formatRowData(row, dateColumns, currencyColumns));

        // Criar a planilha
        const worksheet = XLSX.utils.json_to_sheet(formattedData);
        
        // Nome da aba (máximo 31 caracteres)
        const sheetName = tableInfo.name.substring(0, 31);
        
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

        setProgress(Math.round(((i + 1) / totalTables) * 100));
      }

      // Gerar o arquivo
      const nomeEmpresa = currentCompany.nome_fantasia || currentCompany.razao_social || 'empresa';
      const nomeArquivo = `backup-${nomeEmpresa.replace(/[^a-zA-Z0-9]/g, '_')}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      
      XLSX.writeFile(workbook, nomeArquivo);

      return { success: true, fileName: nomeArquivo };
    } finally {
      setIsGenerating(false);
      setProgress(0);
      setCurrentTable('');
    }
  };

  return {
    tables: backupTables,
    generateBackup,
    isGenerating,
    progress,
    currentTable,
  };
}
