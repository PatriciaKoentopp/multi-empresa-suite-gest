import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Company } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface CompanyContextProps {
  companies: Company[];
  currentCompany: Company | null;
  setCurrentCompany: (company: Company | null) => void;
  loading: boolean;
  refetch: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextProps>({
  companies: [],
  currentCompany: null,
  setCurrentCompany: () => {},
  loading: false,
  refetch: async () => {}
});

export const useCompany = () => useContext(CompanyContext);

export const CompanyProvider = ({ children }: { children: ReactNode }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .order('nome_fantasia');

      if (error) throw error;

      // Transformar dados para compatibilidade com interface Company
      const companiesWithAliases = (data || []).map(company => ({
        ...company,
        razaoSocial: company.razao_social,
        nomeFantasia: company.nome_fantasia,
        inscricaoEstadual: company.inscricao_estadual,
        inscricaoMunicipal: company.inscricao_municipal
      }));

      setCompanies(companiesWithAliases);
    } catch (error: any) {
      console.error('Erro ao carregar empresas:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar empresas",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentCompany = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setCurrentCompany(null);
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('empresa_id')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;

      if (userData?.empresa_id) {
        const { data: companyData, error: companyError } = await supabase
          .from('empresas')
          .select('*')
          .eq('id', userData.empresa_id)
          .single();

        if (companyError) throw companyError;

        // Transformar dados para compatibilidade com interface Company
        const companyWithAliases = {
          ...companyData,
          razaoSocial: companyData.razao_social,
          nomeFantasia: companyData.nome_fantasia,
          inscricaoEstadual: companyData.inscricao_estadual,
          inscricaoMunicipal: companyData.inscricao_municipal
        };

        setCurrentCompany(companyWithAliases);
      } else {
        setCurrentCompany(null);
      }
    } catch (error: any) {
      console.error('Erro ao carregar empresa atual:', error);
      setCurrentCompany(null);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    loadCurrentCompany();
  }, []);

  return (
    <CompanyContext.Provider value={{
      companies,
      currentCompany,
      setCurrentCompany,
      loading,
      refetch: loadCompanies
    }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompanyContext = () => useContext(CompanyContext);
