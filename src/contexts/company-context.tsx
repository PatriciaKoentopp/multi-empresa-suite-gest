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
  fetchCompanyById: (id: string) => Promise<Company | null>;
  createCompany: (company: Partial<Company>) => Promise<Company | null>;
  updateCompany: (id: string, company: Partial<Company>) => Promise<Company | null>;
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

  const transformCompanyData = (company: any): Company => ({
    ...company,
    razaoSocial: company.razao_social,
    nomeFantasia: company.nome_fantasia,
    inscricaoEstadual: company.inscricao_estadual,
    inscricaoMunicipal: company.inscricao_municipal
  });

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .order('nome_fantasia');

      if (error) throw error;

      const companiesWithAliases = (data || []).map(transformCompanyData);
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

  const fetchCompanyById = async (id: string): Promise<Company | null> => {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data ? transformCompanyData(data) : null;
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

  const createCompany = async (companyData: Partial<Company>): Promise<Company | null> => {
    try {
      // Converter de volta para o formato do banco - com campos obrigatórios
      const dbData = {
        razao_social: companyData.razaoSocial || companyData.razao_social || '',
        nome_fantasia: companyData.nomeFantasia || companyData.nome_fantasia || '',
        cnpj: companyData.cnpj || '',
        cep: companyData.cep || '',
        logradouro: companyData.logradouro || '',
        numero: companyData.numero || '',
        bairro: companyData.bairro || '',
        cidade: companyData.cidade || '',
        estado: companyData.estado || '',
        pais: companyData.pais || 'Brasil',
        inscricao_estadual: companyData.inscricaoEstadual || companyData.inscricao_estadual,
        inscricao_municipal: companyData.inscricaoMunicipal || companyData.inscricao_municipal,
        cnae: companyData.cnae,
        email: companyData.email,
        telefone: companyData.telefone,
        site: companyData.site,
        logo: companyData.logo,
        regime_tributacao: companyData.regimeTributacao || companyData.regime_tributacao,
        complemento: companyData.complemento
      };

      const { data, error } = await supabase
        .from('empresas')
        .insert(dbData)
        .select()
        .single();

      if (error) throw error;

      const newCompany = transformCompanyData(data);
      await loadCompanies();
      
      toast({
        title: "Empresa criada com sucesso",
        description: `${newCompany.nomeFantasia} foi criada.`
      });

      return newCompany;
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

  const updateCompany = async (id: string, companyData: Partial<Company>): Promise<Company | null> => {
    try {
      // Converter de volta para o formato do banco
      const dbData = {
        razao_social: companyData.razaoSocial || companyData.razao_social,
        nome_fantasia: companyData.nomeFantasia || companyData.nome_fantasia,
        cnpj: companyData.cnpj,
        cep: companyData.cep,
        logradouro: companyData.logradouro,
        numero: companyData.numero,
        bairro: companyData.bairro,
        cidade: companyData.cidade,
        estado: companyData.estado,
        pais: companyData.pais,
        inscricao_estadual: companyData.inscricaoEstadual || companyData.inscricao_estadual,
        inscricao_municipal: companyData.inscricaoMunicipal || companyData.inscricao_municipal,
        cnae: companyData.cnae,
        email: companyData.email,
        telefone: companyData.telefone,
        site: companyData.site,
        logo: companyData.logo,
        regime_tributacao: companyData.regimeTributacao || companyData.regime_tributacao,
        complemento: companyData.complemento
      };

      // Remover campos undefined
      Object.keys(dbData).forEach(key => {
        if (dbData[key as keyof typeof dbData] === undefined) {
          delete dbData[key as keyof typeof dbData];
        }
      });

      const { data, error } = await supabase
        .from('empresas')
        .update(dbData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedCompany = transformCompanyData(data);
      await loadCompanies();
      
      // Atualizar empresa atual se for a mesma
      if (currentCompany?.id === id) {
        setCurrentCompany(updatedCompany);
      }

      toast({
        title: "Empresa atualizada com sucesso",
        description: `${updatedCompany.nomeFantasia} foi atualizada.`
      });

      return updatedCompany;
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
