
import React, { createContext, useContext, useState, useEffect } from "react";
import { Company } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CompanyContextType {
  companies: Company[];
  currentCompany: Company | null;
  setCurrentCompany: (company: Company) => void;
  fetchCompanies: () => Promise<void>;
  fetchCompanyById: (companyId: string) => Promise<void>;
  createCompany: (company: Partial<Company>) => Promise<void>;
  updateCompany: (id: string, company: Partial<Company>) => Promise<void>;
  loading: boolean;
}

const CompanyContext = createContext<CompanyContextType>({
  companies: [],
  currentCompany: null,
  setCurrentCompany: () => {},
  fetchCompanies: async () => {},
  fetchCompanyById: async () => {},
  createCompany: async () => {},
  updateCompany: async () => {},
  loading: false,
});

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    // Carregar a empresa dos cookies sempre que a lista de empresas mudar
    const savedCompanyId = localStorage.getItem("currentCompanyId");
    if (savedCompanyId && companies.length > 0 && !currentCompany) {
      const company = companies.find((c) => c.id === savedCompanyId);
      if (company) {
        setCurrentCompany(company);
      } else if (companies.length > 0) {
        // Se não encontrou a empresa salva, usa a primeira da lista
        setCurrentCompany(companies[0]);
        localStorage.setItem("currentCompanyId", companies[0].id);
      }
    } else if (companies.length > 0 && !currentCompany) {
      // Se não tem empresa salva, usa a primeira da lista
      setCurrentCompany(companies[0]);
      localStorage.setItem("currentCompanyId", companies[0].id);
    }
  }, [companies, currentCompany]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      
      // Verificamos se temos o ID da empresa do usuário no localStorage
      const userCompanyId = localStorage.getItem("userCompanyId");
      
      let query = supabase.from("empresas").select("*");
      
      // Se temos um ID de empresa específico, filtramos por ele
      if (userCompanyId) {
        query = query.eq("id", userCompanyId);
      }
      
      const { data, error } = await query;

      if (error) {
        console.error("Erro ao carregar empresas:", error);
        toast.error("Erro ao carregar empresas");
        return;
      }

      if (data) {
        // Mapear os dados do banco para o formato da aplicação
        const formattedCompanies: Company[] = data.map((company) => ({
          id: company.id,
          razao_social: company.razao_social,
          nome_fantasia: company.nome_fantasia,
          cnpj: company.cnpj,
          inscricao_estadual: company.inscricao_estadual,
          inscricao_municipal: company.inscricao_municipal,
          email: company.email,
          telefone: company.telefone,
          site: company.site,
          cnae: company.cnae,
          regime_tributacao: company.regime_tributacao,
          logo: company.logo,
          cep: company.cep,
          logradouro: company.logradouro,
          numero: company.numero,
          complemento: company.complemento,
          bairro: company.bairro,
          cidade: company.cidade,
          estado: company.estado,
          pais: company.pais,
          created_at: company.created_at,
          updated_at: company.updated_at,
          
          // Adicionar aliases em camelCase para compatibilidade
          razaoSocial: company.razao_social,
          nomeFantasia: company.nome_fantasia,
          inscricaoEstadual: company.inscricao_estadual,
          inscricaoMunicipal: company.inscricao_municipal,
          regimeTributacao: company.regime_tributacao,
          createdAt: company.created_at,
          updatedAt: company.updated_at,
          
          // Adicionar objeto endereco para compatibilidade
          endereco: {
            cep: company.cep,
            logradouro: company.logradouro,
            numero: company.numero,
            complemento: company.complemento,
            bairro: company.bairro,
            cidade: company.cidade,
            estado: company.estado,
            pais: company.pais,
          },
        }));

        setCompanies(formattedCompanies);
      }
    } catch (error) {
      console.error("Erro ao carregar empresas:", error);
      toast.error("Erro ao carregar empresas");
    } finally {
      setLoading(false);
    }
  };

  // Nova função para buscar empresa por ID
  const fetchCompanyById = async (companyId: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("empresas")
        .select("*")
        .eq("id", companyId)
        .single();

      if (error) {
        console.error("Erro ao carregar empresa:", error);
        toast.error("Erro ao carregar empresa");
        return;
      }

      if (data) {
        // Salvar o ID da empresa do usuário no localStorage
        localStorage.setItem("userCompanyId", data.id);
        
        // Converter para o formato da aplicação
        const company: Company = {
          id: data.id,
          razao_social: data.razao_social,
          nome_fantasia: data.nome_fantasia,
          cnpj: data.cnpj,
          inscricao_estadual: data.inscricao_estadual,
          inscricao_municipal: data.inscricao_municipal,
          email: data.email,
          telefone: data.telefone,
          site: data.site,
          cnae: data.cnae,
          regime_tributacao: data.regime_tributacao,
          logo: data.logo,
          cep: data.cep,
          logradouro: data.logradouro,
          numero: data.numero,
          complemento: data.complemento,
          bairro: data.bairro,
          cidade: data.cidade,
          estado: data.estado,
          pais: data.pais,
          created_at: data.created_at,
          updated_at: data.updated_at,
          
          // Adicionar aliases em camelCase para compatibilidade
          razaoSocial: data.razao_social,
          nomeFantasia: data.nome_fantasia,
          inscricaoEstadual: data.inscricao_estadual,
          inscricaoMunicipal: data.inscricao_municipal,
          regimeTributacao: data.regime_tributacao,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          
          // Adicionar objeto endereco para compatibilidade
          endereco: {
            cep: data.cep,
            logradouro: data.logradouro,
            numero: data.numero,
            complemento: data.complemento,
            bairro: data.bairro,
            cidade: data.cidade,
            estado: data.estado,
            pais: data.pais,
          },
        };

        // Atualizar o estado com a empresa carregada
        setCompanies([company]);
        setCurrentCompany(company);
        localStorage.setItem("currentCompanyId", company.id);
      }
    } catch (error) {
      console.error("Erro ao carregar empresa:", error);
      toast.error("Erro ao carregar empresa");
    } finally {
      setLoading(false);
    }
  };

  const createCompany = async (company: Partial<Company>) => {
    try {
      setLoading(true);
      // Mapear os dados da aplicação para o formato do banco
      const { data, error } = await supabase.from("empresas").insert([
        {
          razao_social: company.razao_social,
          nome_fantasia: company.nome_fantasia,
          cnpj: company.cnpj,
          inscricao_estadual: company.inscricao_estadual,
          inscricao_municipal: company.inscricao_municipal,
          email: company.email,
          telefone: company.telefone,
          site: company.site,
          cnae: company.cnae,
          regime_tributacao: company.regime_tributacao,
          logo: company.logo,
          cep: company.cep || (company.endereco ? company.endereco.cep : ""),
          logradouro: company.logradouro || (company.endereco ? company.endereco.logradouro : ""),
          numero: company.numero || (company.endereco ? company.endereco.numero : ""),
          complemento: company.complemento || (company.endereco ? company.endereco.complemento : null),
          bairro: company.bairro || (company.endereco ? company.endereco.bairro : ""),
          cidade: company.cidade || (company.endereco ? company.endereco.cidade : ""),
          estado: company.estado || (company.endereco ? company.endereco.estado : ""),
          pais: company.pais || (company.endereco ? company.endereco.pais : "Brasil"),
        },
      ]);

      if (error) {
        console.error("Erro ao criar empresa:", error);
        toast.error("Erro ao criar empresa");
        return;
      }

      toast.success("Empresa criada com sucesso!");
      await fetchCompanies();
    } catch (error) {
      console.error("Erro ao criar empresa:", error);
      toast.error("Erro ao criar empresa");
    } finally {
      setLoading(false);
    }
  };

  const updateCompany = async (id: string, company: Partial<Company>) => {
    try {
      setLoading(true);
      // Mapear os dados da aplicação para o formato do banco
      const { data, error } = await supabase
        .from("empresas")
        .update({
          razao_social: company.razao_social,
          nome_fantasia: company.nome_fantasia,
          cnpj: company.cnpj,
          inscricao_estadual: company.inscricao_estadual,
          inscricao_municipal: company.inscricao_municipal,
          email: company.email,
          telefone: company.telefone,
          site: company.site,
          cnae: company.cnae,
          regime_tributacao: company.regime_tributacao,
          logo: company.logo,
          cep: company.cep || (company.endereco ? company.endereco.cep : ""),
          logradouro: company.logradouro || (company.endereco ? company.endereco.logradouro : ""),
          numero: company.numero || (company.endereco ? company.endereco.numero : ""),
          complemento: company.complemento || (company.endereco ? company.endereco.complemento : null),
          bairro: company.bairro || (company.endereco ? company.endereco.bairro : ""),
          cidade: company.cidade || (company.endereco ? company.endereco.cidade : ""),
          estado: company.estado || (company.endereco ? company.endereco.estado : ""),
          pais: company.pais || (company.endereco ? company.endereco.pais : "Brasil"),
        })
        .eq("id", id);

      if (error) {
        console.error("Erro ao atualizar empresa:", error);
        toast.error("Erro ao atualizar empresa");
        return;
      }

      toast.success("Empresa atualizada com sucesso!");
      await fetchCompanies();

      // Se a empresa atualizada for a atual, atualize-a
      if (currentCompany && currentCompany.id === id) {
        const updatedCompany = companies.find((c) => c.id === id);
        if (updatedCompany) {
          setCurrentCompany(updatedCompany);
        }
      }
    } catch (error) {
      console.error("Erro ao atualizar empresa:", error);
      toast.error("Erro ao atualizar empresa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CompanyContext.Provider
      value={{
        companies,
        currentCompany,
        setCurrentCompany: (company) => {
          setCurrentCompany(company);
          localStorage.setItem("currentCompanyId", company.id);
        },
        fetchCompanies,
        fetchCompanyById,
        createCompany,
        updateCompany,
        loading,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export const useCompany = () => useContext(CompanyContext);
