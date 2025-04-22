
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { Company } from "@/types";
import { supabase } from "@/integrations/supabase/client";

interface CompanyContextType {
  currentCompany: Company | null;
  availableCompanies: Company[];
  setCurrentCompany: (company: Company) => void;
  addCompany: (company: Company) => Promise<void>;
  updateCompany: (id: string, company: Partial<Company>) => Promise<void>;
  isLoading: boolean;
}

// Ajustando para Company padrão do projeto (evitar conflitos de tipos)
function supabaseToCompany(data: any): Company {
  return {
    id: data.id,
    name: data.nome_fantasia || data.razao_social || "",
    razaoSocial: data.razao_social,
    nomeFantasia: data.nome_fantasia,
    cnpj: data.cnpj,
    inscricaoEstadual: data.inscricao_estadual,
    inscricaoMunicipal: data.inscricao_municipal,
    cnae: data.cnae,
    email: data.email,
    site: data.site,
    telefone: data.telefone,
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
    regimeTributacao: data.regime_tributacao as Company["regimeTributacao"],
    logo: data.logo,
    createdAt: data.created_at ? new Date(data.created_at) : new Date(),
    updatedAt: data.updated_at ? new Date(data.updated_at) : new Date()
  }
}

const CompanyContext = createContext<CompanyContextType>({} as CompanyContextType);

export function useCompany() {
  return useContext(CompanyContext);
}

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [currentCompany, setCurrentCompanyState] = useState<Company | null>(null);
  const [availableCompanies, setAvailableCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar empresas do Supabase ao iniciar
  useEffect(() => {
    const fetchCompanies = async () => {
      setIsLoading(true);
      const { data } = await supabase.from("empresas").select("*").limit(1);
      if (data && data.length > 0) {
        const company = supabaseToCompany(data[0]);
        setAvailableCompanies([company]);
        setCurrentCompanyState(company);
      } else {
        setAvailableCompanies([]);
        setCurrentCompanyState(null);
      }
      setIsLoading(false);
    };

    fetchCompanies();
  }, []);

  const setCurrentCompany = (company: Company) => {
    setCurrentCompanyState(company);
  };

  // Adiciona no banco e atualiza na memória
  const addCompany = async (company: Company) => {
    setIsLoading(true);
    // Transformar para nomes snake_case para banco + datas como string ISO
    const toInsert = {
      id: company.id,
      razao_social: company.razaoSocial,
      nome_fantasia: company.nomeFantasia,
      cnpj: company.cnpj,
      inscricao_estadual: company.inscricaoEstadual,
      inscricao_municipal: company.inscricaoMunicipal,
      cnae: company.cnae,
      email: company.email,
      site: company.site,
      telefone: company.telefone,
      cep: company.endereco?.cep,
      logradouro: company.endereco?.logradouro,
      numero: company.endereco?.numero,
      complemento: company.endereco?.complemento,
      bairro: company.endereco?.bairro,
      cidade: company.endereco?.cidade,
      estado: company.endereco?.estado,
      pais: company.endereco?.pais || "Brasil",
      regime_tributacao: company.regimeTributacao,
      logo: company.logo,
      created_at: company.createdAt ? company.createdAt.toISOString() : new Date().toISOString(),
      updated_at: company.updatedAt ? company.updatedAt.toISOString() : new Date().toISOString()
    }
    const { data } = await supabase.from("empresas").insert([toInsert]).select().maybeSingle();

    if (data) {
      const nova = supabaseToCompany(data);
      setAvailableCompanies([nova]);
      setCurrentCompanyState(nova);
    }
    setIsLoading(false);
  };

  // Atualiza no banco e atualiza na memória
  const updateCompany = async (id: string, companyData: Partial<Company>) => {
    setIsLoading(true);
    // Transformar para snake_case e as datas para string
    const toUpdate: any = {};
    if (companyData.razaoSocial !== undefined) toUpdate.razao_social = companyData.razaoSocial;
    if (companyData.nomeFantasia !== undefined) toUpdate.nome_fantasia = companyData.nomeFantasia;
    if (companyData.cnpj !== undefined) toUpdate.cnpj = companyData.cnpj;
    if (companyData.inscricaoEstadual !== undefined) toUpdate.inscricao_estadual = companyData.inscricaoEstadual;
    if (companyData.inscricaoMunicipal !== undefined) toUpdate.inscricao_municipal = companyData.inscricaoMunicipal;
    if (companyData.cnae !== undefined) toUpdate.cnae = companyData.cnae;
    if (companyData.email !== undefined) toUpdate.email = companyData.email;
    if (companyData.site !== undefined) toUpdate.site = companyData.site;
    if (companyData.telefone !== undefined) toUpdate.telefone = companyData.telefone;
    if (companyData.logo !== undefined) toUpdate.logo = companyData.logo;
    if (companyData.regimeTributacao !== undefined) toUpdate.regime_tributacao = companyData.regimeTributacao;
    if (companyData.endereco) {
      if (companyData.endereco.cep !== undefined) toUpdate.cep = companyData.endereco.cep;
      if (companyData.endereco.logradouro !== undefined) toUpdate.logradouro = companyData.endereco.logradouro;
      if (companyData.endereco.numero !== undefined) toUpdate.numero = companyData.endereco.numero;
      if (companyData.endereco.complemento !== undefined) toUpdate.complemento = companyData.endereco.complemento;
      if (companyData.endereco.bairro !== undefined) toUpdate.bairro = companyData.endereco.bairro;
      if (companyData.endereco.cidade !== undefined) toUpdate.cidade = companyData.endereco.cidade;
      if (companyData.endereco.estado !== undefined) toUpdate.estado = companyData.endereco.estado;
      if (companyData.endereco.pais !== undefined) toUpdate.pais = companyData.endereco.pais;
    }
    toUpdate.updated_at = new Date().toISOString();

    const { data } = await supabase
      .from("empresas")
      .update(toUpdate)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (data) {
      const nova = supabaseToCompany(data);
      setAvailableCompanies([nova]);
      setCurrentCompanyState(nova);
    }
    setIsLoading(false);
  };

  return (
    <CompanyContext.Provider
      value={{
        currentCompany,
        availableCompanies,
        setCurrentCompany,
        addCompany,
        updateCompany,
        isLoading,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

