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
    const savedCompanyId = localStorage.getItem("currentCompanyId");
    if (savedCompanyId && companies.length > 0 && !currentCompany) {
      const company = companies.find((c) => c.id === savedCompanyId);
      if (company) {
        setCurrentCompany(company);
      } else if (companies.length > 0) {
        setCurrentCompany(companies[0]);
        localStorage.setItem("currentCompanyId", companies[0].id);
      }
    } else if (companies.length > 0 && !currentCompany) {
      setCurrentCompany(companies[0]);
      localStorage.setItem("currentCompanyId", companies[0].id);
    }
  }, [companies, currentCompany]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      
      const userCompanyId = localStorage.getItem("userCompanyId");
      
      let query = supabase.from("empresas").select("*");
      
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
          created_at: company.created_at ? company.created_at : "",
          updated_at: company.updated_at ? company.updated_at : "",
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
        localStorage.setItem("userCompanyId", data.id);
        
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
          created_at: data.created_at ? data.created_at : "",
          updated_at: data.updated_at ? data.updated_at : "",
        };

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
          cep: company.cep,
          logradouro: company.logradouro,
          numero: company.numero,
          complemento: company.complemento,
          bairro: company.bairro,
          cidade: company.cidade,
          estado: company.estado,
          pais: company.pais || "Brasil",
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
          cep: company.cep,
          logradouro: company.logradouro,
          numero: company.numero,
          complemento: company.complemento,
          bairro: company.bairro,
          cidade: company.cidade,
          estado: company.estado,
          pais: company.pais || "Brasil",
        })
        .eq("id", id);

      if (error) {
        console.error("Erro ao atualizar empresa:", error);
        toast.error("Erro ao atualizar empresa");
        return;
      }

      toast.success("Empresa atualizada com sucesso!");
      await fetchCompanies();

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
