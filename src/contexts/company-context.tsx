import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Company } from '@/types';

interface CompanyContextProps {
  companies: Company[];
  currentCompany: Company | null;
  loading: boolean;
  fetchCompanies: () => Promise<void>;
  fetchCompanyById: (id: string) => Promise<void>;
  updateCompany: (id: string, updates: Partial<Company>) => Promise<boolean | undefined>;
  setCompanies: React.Dispatch<React.SetStateAction<Company[]>>;
  setCurrentCompany: React.Dispatch<React.SetStateAction<Company | null>>;
}

const CompanyContext = createContext<CompanyContextProps | undefined>(undefined);

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .order('nome_fantasia');

      if (error) throw error;

      const formattedCompanies: Company[] = (data || []).map(empresa => ({
        id: empresa.id,
        razao_social: empresa.razao_social,
        nome_fantasia: empresa.nome_fantasia,
        cnpj: empresa.cnpj,
        inscricao_estadual: empresa.inscricao_estadual || '',
        inscricao_municipal: empresa.inscricao_municipal || '',
        email: empresa.email || '',
        telefone: empresa.telefone || '',
        site: empresa.site || '',
        cnae: empresa.cnae || '',
        regime_tributacao: empresa.regime_tributacao || '',
        logo: empresa.logo || '',
        created_at: empresa.created_at || new Date().toISOString(),
        updated_at: empresa.updated_at || new Date().toISOString(),
        endereco: {
          logradouro: empresa.logradouro,
          numero: empresa.numero,
          complemento: empresa.complemento || '',
          bairro: empresa.bairro,
          cidade: empresa.cidade,
          estado: empresa.estado,
          cep: empresa.cep,
          pais: empresa.pais
        }
      }));

      setCompanies(formattedCompanies);
    } catch (error) {
      console.error('Erro ao buscar empresas:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyById = async (id: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return;

      const formattedCompany: Company = {
        id: data.id,
        razao_social: data.razao_social,
        nome_fantasia: data.nome_fantasia,
        cnpj: data.cnpj,
        inscricao_estadual: data.inscricao_estadual || '',
        inscricao_municipal: data.inscricao_municipal || '',
        email: data.email || '',
        telefone: data.telefone || '',
        site: data.site || '',
        cnae: data.cnae || '',
        regime_tributacao: data.regime_tributacao || '',
        logo: data.logo || '',
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString(),
        endereco: {
          logradouro: data.logradouro,
          numero: data.numero,
          complemento: data.complemento || '',
          bairro: data.bairro,
          cidade: data.cidade,
          estado: data.estado,
          cep: data.cep,
          pais: data.pais
        }
      };

      setCurrentCompany(formattedCompany);
    } catch (error) {
      console.error('Erro ao buscar empresa:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCompany = async (id: string, updates: Partial<Company>) => {
    try {
      setLoading(true);
      
      const updateData: any = {
        razao_social: updates.razao_social,
        nome_fantasia: updates.nome_fantasia,
        cnpj: updates.cnpj,
        inscricao_estadual: updates.inscricao_estadual,
        inscricao_municipal: updates.inscricao_municipal,
        email: updates.email,
        telefone: updates.telefone,
        site: updates.site,
        cnae: updates.cnae,
        regime_tributacao: updates.regime_tributacao,
        logo: updates.logo,
        logradouro: updates.endereco?.logradouro,
        numero: updates.endereco?.numero,
        complemento: updates.endereco?.complemento,
        bairro: updates.endereco?.bairro,
        cidade: updates.endereco?.cidade,
        estado: updates.endereco?.estado,
        cep: updates.endereco?.cep,
        pais: updates.endereco?.pais
      };

      const { error } = await supabase
        .from('empresas')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      // Atualizar o estado local
      await fetchCompanyById(id);
      await fetchCompanies();
      
      return true;
    } catch (error) {
      console.error('Erro ao atualizar empresa:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const value: CompanyContextProps = {
    companies,
    currentCompany,
    loading,
    fetchCompanies,
    fetchCompanyById,
    updateCompany,
    setCompanies,
    setCurrentCompany
  };

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany deve ser usado dentro de um CompanyProvider');
  }
  return context;
};
