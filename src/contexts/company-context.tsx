
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Company, CompanyUpdate } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface CompanyContextProps {
  companies: Company[];
  currentCompany: Company | null;
  setCurrentCompany: (company: Company | null) => void;
  loading: boolean;
  refetch: () => Promise<void>;
  fetchCompanyById: (id: string) => Promise<Company | null>;
  createCompany: (company: CompanyUpdate) => Promise<Company | null>;
  updateCompany: (id: string, company: CompanyUpdate) => Promise<Company | null>;
}

const CompanyContext = createContext<CompanyContextProps>({
  companies: [],
  currentCompany: null,
  setCurrentCompany: () => {},
  loading: false,
  refetch: async () => {},
  fetchCompanyById: async () => null,
  createCompany: async () => null,
  updateCompany: async () => null,
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

      setCompanies(data || []);
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

  const fetchCompanyById = async (id: string): Promise<Company | null> => {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Erro ao buscar empresa:', error);
      toast({
        variant: "destructive",
        title: "Erro ao buscar empresa",
        description: error.message
      });
      return null;
    }
  };

  const createCompany = async (companyData: CompanyUpdate): Promise<Company | null> => {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .insert(companyData)
        .select()
        .single();

      if (error) throw error;

      await loadCompanies();
      
      toast({
        title: "Empresa criada com sucesso",
        description: `${data.nome_fantasia} foi criada.`
      });

      return data;
    } catch (error: any) {
      console.error('Erro ao criar empresa:', error);
      toast({
        variant: "destructive",
        title: "Erro ao criar empresa",
        description: error.message
      });
      return null;
    }
  };

  const updateCompany = async (id: string, companyData: CompanyUpdate): Promise<Company | null> => {
    try {
      // Remover campos undefined
      const cleanData = Object.fromEntries(
        Object.entries(companyData).filter(([_, value]) => value !== undefined)
      );

      const { data, error } = await supabase
        .from('empresas')
        .update(cleanData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await loadCompanies();
      
      // Atualizar empresa atual se for a mesma
      if (currentCompany?.id === id) {
        setCurrentCompany(data);
      }

      toast({
        title: "Empresa atualizada com sucesso",
        description: `${data.nome_fantasia} foi atualizada.`
      });

      return data;
    } catch (error: any) {
      console.error('Erro ao atualizar empresa:', error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar empresa",
        description: error.message
      });
      return null;
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
        const company = await fetchCompanyById(userData.empresa_id);
        setCurrentCompany(company);
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
      refetch: loadCompanies,
      fetchCompanyById,
      createCompany,
      updateCompany
    }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompanyContext = () => useContext(CompanyContext);
