import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/company-context';
import { useAuth } from '@/contexts/auth-context';

interface LogTransacaoParams {
  acao: string;
  modulo: string;
  entidade: string;
  entidade_id?: string;
  descricao: string;
  dados_anteriores?: Record<string, unknown>;
  dados_novos?: Record<string, unknown>;
}

export const useLogTransacao = () => {
  const { currentCompany } = useCompany();
  const { user } = useAuth();

  const registrarLog = async (params: LogTransacaoParams) => {
    if (!currentCompany?.id) return;

    try {
      await supabase
        .from('logs_transacoes' as any)
        .insert({
          empresa_id: currentCompany.id,
          usuario_id: user?.id || null,
          usuario_nome: user?.email || 'Sistema',
          acao: params.acao,
          modulo: params.modulo,
          entidade: params.entidade,
          entidade_id: params.entidade_id || null,
          descricao: params.descricao,
          dados_anteriores: params.dados_anteriores || null,
          dados_novos: params.dados_novos || null,
        });
    } catch (error) {
      console.error('Erro ao registrar log:', error);
    }
  };

  return { registrarLog };
};
