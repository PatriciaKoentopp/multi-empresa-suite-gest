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

  function sanitize(value: string | undefined | null, maxLength?: number): string | null {
    if (typeof value !== "string" || value.trim() === "") return null;
    return maxLength ? value.slice(0, maxLength) : value;
  }

  // Adiciona no banco e atualiza na memória
  const addCompany = async (company: Company) => {
    setIsLoading(true);

    const toInsert = {
      id: company.id,
      razao_social: company.razaoSocial,
      nome_fantasia: company.nomeFantasia,
      cnpj: sanitize(company.cnpj, 18) ?? "",
      inscricao_estadual: sanitize(company.inscricaoEstadual, 20),
      inscricao_municipal: sanitize(company.inscricaoMunicipal, 20),
      cnae: sanitize(company.cnae, 10),
      email: sanitize(company.email),
      site: sanitize(company.site),
      telefone: sanitize(company.telefone, 20),
      logo: sanitize(company.logo),
      regime_tributacao: sanitize(company.regimeTributacao),
      cep: sanitize(company.endereco?.cep, 10) ?? "",
      logradouro: company.endereco?.logradouro ?? "",
      numero: sanitize(company.endereco?.numero, 10) ?? "",
      complemento: sanitize(company.endereco?.complemento),
      bairro: company.endereco?.bairro ?? "",
      cidade: company.endereco?.cidade ?? "",
      estado: sanitize(company.endereco?.estado, 2) ?? "",
      pais: sanitize(company.endereco?.pais, 30) ?? "Brasil",
      created_at: (company.createdAt || new Date()).toISOString(),
      updated_at: (company.updatedAt || new Date()).toISOString(),
    };

    // Limpa campos obrigatórios para garantir que não passem como null/undefined
    Object.keys(toInsert).forEach((key) => {
      if (
        toInsert[key] === undefined &&
        ["razao_social", "nome_fantasia", "cnpj", "cep", "logradouro", "numero", "bairro", "cidade", "estado", "pais", "created_at", "updated_at"].includes(key)
      ) {
        toInsert[key] = "";
      }
    });

    // Envia para o supabase (como array para insert em lote)
    const { data, error } = await supabase.from("empresas").insert([toInsert]).select().maybeSingle();

    if (error) {
      console.error("Erro ao inserir empresa:", error, toInsert);
    }

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

    const toUpdate: any = {};
    if (companyData.razaoSocial !== undefined) toUpdate.razao_social = companyData.razaoSocial;
    if (companyData.nomeFantasia !== undefined) toUpdate.nome_fantasia = companyData.nomeFantasia;
    if (companyData.cnpj !== undefined) toUpdate.cnpj = sanitize(companyData.cnpj, 18) ?? "";
    if (companyData.inscricaoEstadual !== undefined) toUpdate.inscricao_estadual = sanitize(companyData.inscricaoEstadual, 20);
    if (companyData.inscricaoMunicipal !== undefined) toUpdate.inscricao_municipal = sanitize(companyData.inscricaoMunicipal, 20);
    if (companyData.cnae !== undefined) toUpdate.cnae = sanitize(companyData.cnae, 10);
    if (companyData.email !== undefined) toUpdate.email = sanitize(companyData.email);
    if (companyData.site !== undefined) toUpdate.site = sanitize(companyData.site);
    if (companyData.telefone !== undefined) toUpdate.telefone = sanitize(companyData.telefone, 20);
    if (companyData.logo !== undefined) toUpdate.logo = sanitize(companyData.logo);
    if (companyData.regimeTributacao !== undefined) toUpdate.regime_tributacao = sanitize(companyData.regimeTributacao);
    if (companyData.endereco) {
      if (companyData.endereco.cep !== undefined) toUpdate.cep = sanitize(companyData.endereco.cep, 10) ?? "";
      if (companyData.endereco.logradouro !== undefined) toUpdate.logradouro = companyData.endereco.logradouro ?? "";
      if (companyData.endereco.numero !== undefined) toUpdate.numero = sanitize(companyData.endereco.numero, 10) ?? "";
      if (companyData.endereco.complemento !== undefined) toUpdate.complemento = sanitize(companyData.endereco.complemento);
      if (companyData.endereco.bairro !== undefined) toUpdate.bairro = companyData.endereco.bairro ?? "";
      if (companyData.endereco.cidade !== undefined) toUpdate.cidade = companyData.endereco.cidade ?? "";
      if (companyData.endereco.estado !== undefined) toUpdate.estado = sanitize(companyData.endereco.estado, 2) ?? "";
      if (companyData.endereco.pais !== undefined) toUpdate.pais = sanitize(companyData.endereco.pais, 30) ?? "Brasil";
    }
    toUpdate.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("empresas")
      .update(toUpdate)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      console.error("Erro ao atualizar empresa:", error, toUpdate);
    }

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
