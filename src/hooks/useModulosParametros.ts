
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/company-context';
import { useToast } from '@/components/ui/use-toast';
import { navigationConfig } from '@/config/navigation';

export interface ModuloParametro {
  id: string;
  empresa_id: string;
  modulo_key: string;
  ativo: boolean;
}

export const useModulosParametros = () => {
  const { currentCompany } = useCompany();
  const { toast } = useToast();
  const [parametros, setParametros] = useState<ModuloParametro[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Gerar lista de todas as chaves de módulos/rotinas baseado na navegação
  const gerarChavesModulos = () => {
    const chaves: string[] = [];
    
    navigationConfig.forEach(item => {
      // Adicionar módulo principal
      const moduloKey = item.href ? item.href.replace('/', '') : item.title.toLowerCase().replace(/\s+/g, '-');
      chaves.push(moduloKey);
      
      // Adicionar sub-rotinas
      if (item.subItems) {
        item.subItems.forEach(subItem => {
          const rotinaKey = subItem.href.replace('/', '');
          chaves.push(rotinaKey);
        });
      }
    });
    
    return chaves;
  };

  const fetchParametros = async () => {
    if (!currentCompany?.id) return;

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('modulos_parametros')
        .select('*')
        .eq('empresa_id', currentCompany.id);

      if (error) throw error;

      // Se não há parâmetros salvos, criar configurações padrão (tudo ativo)
      if (!data || data.length === 0) {
        await criarParametrosPadrao();
        return;
      }

      setParametros(data);
    } catch (error: any) {
      console.error('Erro ao buscar parâmetros dos módulos:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os parâmetros dos módulos"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const criarParametrosPadrao = async () => {
    if (!currentCompany?.id) return;

    try {
      const chaves = gerarChavesModulos();
      const parametrosDefault = chaves.map(chave => ({
        empresa_id: currentCompany.id,
        modulo_key: chave,
        ativo: true
      }));

      const { data, error } = await supabase
        .from('modulos_parametros')
        .insert(parametrosDefault)
        .select();

      if (error) throw error;
      
      if (data) {
        setParametros(data);
      }
    } catch (error: any) {
      console.error('Erro ao criar parâmetros padrão:', error);
    }
  };

  const updateParametro = async (moduloKey: string, ativo: boolean) => {
    if (!currentCompany?.id) return false;

    try {
      const { error } = await supabase
        .from('modulos_parametros')
        .update({ ativo })
        .eq('empresa_id', currentCompany.id)
        .eq('modulo_key', moduloKey);

      if (error) throw error;

      // Atualizar estado local
      setParametros(prev => 
        prev.map(param => 
          param.modulo_key === moduloKey ? { ...param, ativo } : param
        )
      );

      toast({
        title: "Sucesso",
        description: `Módulo ${ativo ? 'habilitado' : 'desabilitado'} com sucesso`
      });

      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar parâmetro do módulo:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o parâmetro do módulo"
      });
      return false;
    }
  };

  const isModuloAtivo = (moduloKey: string): boolean => {
    const parametro = parametros.find(p => p.modulo_key === moduloKey);
    return parametro ? parametro.ativo : true;
  };

  const getNavegacaoFiltrada = () => {
    return navigationConfig.filter(item => {
      const moduloKey = item.href ? item.href.replace('/', '') : item.title.toLowerCase().replace(/\s+/g, '-');
      const moduloAtivo = isModuloAtivo(moduloKey);
      
      if (!moduloAtivo) return false;
      
      // Se tem subitens, filtrar os subitens ativos
      if (item.subItems) {
        const subItensAtivos = item.subItems.filter(subItem => {
          const rotinaKey = subItem.href.replace('/', '');
          return isModuloAtivo(rotinaKey);
        });
        
        // Se não há subitens ativos, não mostrar o módulo principal
        if (subItensAtivos.length === 0) return false;
        
        return {
          ...item,
          subItems: subItensAtivos
        };
      }
      
      return true;
    });
  };

  useEffect(() => {
    fetchParametros();
  }, [currentCompany?.id]);

  return {
    parametros,
    isLoading,
    updateParametro,
    isModuloAtivo,
    getNavegacaoFiltrada,
    refetch: fetchParametros
  };
};
