
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
      
      console.log('Buscando parâmetros para empresa:', currentCompany.id);
      
      const { data, error } = await supabase
        .from('modulos_parametros')
        .select('*')
        .eq('empresa_id', currentCompany.id);

      if (error) {
        console.error('Erro ao buscar parâmetros:', error);
        throw error;
      }

      console.log('Parâmetros encontrados:', data);

      // Se não há parâmetros salvos, criar configurações padrão (tudo ativo)
      if (!data || data.length === 0) {
        console.log('Nenhum parâmetro encontrado, criando padrões...');
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
      console.log('Criando parâmetros padrão para chaves:', chaves);
      
      const parametrosDefault = chaves.map(chave => ({
        empresa_id: currentCompany.id,
        modulo_key: chave,
        ativo: true
      }));

      console.log('Inserindo parâmetros:', parametrosDefault);

      const { data, error } = await supabase
        .from('modulos_parametros')
        .insert(parametrosDefault)
        .select();

      if (error) {
        console.error('Erro ao inserir parâmetros:', error);
        throw error;
      }
      
      console.log('Parâmetros criados:', data);
      
      if (data) {
        setParametros(data);
        toast({
          title: "Sucesso",
          description: "Parâmetros dos módulos criados com sucesso"
        });
      }
    } catch (error: any) {
      console.error('Erro ao criar parâmetros padrão:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível criar os parâmetros padrão"
      });
    }
  };

  const updateParametro = async (moduloKey: string, ativo: boolean) => {
    if (!currentCompany?.id) return false;

    try {
      console.log('Atualizando parâmetro:', moduloKey, 'para:', ativo);
      
      const { error } = await supabase
        .from('modulos_parametros')
        .update({ ativo })
        .eq('empresa_id', currentCompany.id)
        .eq('modulo_key', moduloKey);

      if (error) {
        console.error('Erro ao atualizar:', error);
        throw error;
      }

      // Atualizar estado local
      setParametros(prev => 
        prev.map(param => 
          param.modulo_key === moduloKey ? { ...param, ativo } : param
        )
      );

      console.log('Parâmetro atualizado com sucesso no estado local');

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
    console.log(`Verificando se módulo ${moduloKey} está ativo...`);
    const parametro = parametros.find(p => p.modulo_key === moduloKey);
    const ativo = parametro ? parametro.ativo : true;
    console.log(`Módulo ${moduloKey}: ${ativo ? 'ATIVO' : 'INATIVO'}`);
    return ativo;
  };

  const getNavegacaoFiltrada = () => {
    console.log('Filtrando navegação com parâmetros:', parametros);
    
    const navegacaoFiltrada = navigationConfig.filter(item => {
      const moduloKey = item.href ? item.href.replace('/', '') : item.title.toLowerCase().replace(/\s+/g, '-');
      const moduloAtivo = isModuloAtivo(moduloKey);
      
      console.log(`Verificando módulo principal: ${moduloKey} - Ativo: ${moduloAtivo}`);
      
      if (!moduloAtivo) {
        console.log(`Módulo ${moduloKey} está INATIVO, removendo do menu`);
        return false;
      }
      
      // Se tem subitens, filtrar os subitens ativos
      if (item.subItems) {
        const subItensAtivos = item.subItems.filter(subItem => {
          const rotinaKey = subItem.href.replace('/', '');
          const rotinaAtiva = isModuloAtivo(rotinaKey);
          console.log(`Verificando subitem: ${rotinaKey} - Ativo: ${rotinaAtiva}`);
          return rotinaAtiva;
        });
        
        console.log(`Subitens ativos para ${moduloKey}:`, subItensAtivos.length);
        
        // Se não há subitens ativos, não mostrar o módulo principal
        if (subItensAtivos.length === 0) {
          console.log(`Nenhum subitem ativo para ${moduloKey}, removendo módulo`);
          return false;
        }
        
        // Retornar item com subitens filtrados
        return {
          ...item,
          subItems: subItensAtivos
        };
      }
      
      console.log(`Módulo ${moduloKey} incluído no menu`);
      return true;
    }).map(item => {
      // Se o item tem subitens, aplicar o filtro novamente
      if (item.subItems) {
        const subItensAtivos = item.subItems.filter(subItem => {
          const rotinaKey = subItem.href.replace('/', '');
          return isModuloAtivo(rotinaKey);
        });
        
        return {
          ...item,
          subItems: subItensAtivos
        };
      }
      
      return item;
    });

    console.log('Navegação filtrada final:', navegacaoFiltrada);
    return navegacaoFiltrada;
  };

  useEffect(() => {
    if (currentCompany?.id) {
      fetchParametros();
    }
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
