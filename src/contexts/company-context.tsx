
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Company } from "@/types";

interface CompanyContextType {
  currentCompany: Company | null;
  companies: Company[];
  setCurrentCompany: (company: Company) => void;
  loading: boolean;
  refreshCompanies: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshCompanies = async () => {
    try {
      setLoading(true);
      console.log("Buscando empresas...");
      
      const { data, error } = await supabase
        .from("empresas")
        .select("*")
        .order("nome_fantasia");

      if (error) {
        console.error("Erro ao buscar empresas:", error);
        return;
      }

      if (data) {
        console.log("Empresas encontradas:", data);
        const companiesFormatted: Company[] = data.map(empresa => ({
          id: empresa.id,
          nome_fantasia: empresa.nome_fantasia,
          razao_social: empresa.razao_social,
          cnpj: empresa.cnpj,
          email: empresa.email || "",
          telefone: empresa.telefone || "",
          logradouro: empresa.logradouro,
          numero: empresa.numero,
          complemento: empresa.complemento || "",
          bairro: empresa.bairro,
          cidade: empresa.cidade,
          estado: empresa.estado,
          cep: empresa.cep,
          pais: empresa.pais,
          created_at: empresa.created_at,
          updated_at: empresa.updated_at
        }));

        setCompanies(companiesFormatted);

        // Se não há empresa selecionada e há empresas disponíveis, seleciona a primeira
        if (!currentCompany && companiesFormatted.length > 0) {
          console.log("Selecionando primeira empresa:", companiesFormatted[0]);
          setCurrentCompany(companiesFormatted[0]);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar empresas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshCompanies();
  }, []);

  return (
    <CompanyContext.Provider
      value={{
        currentCompany,
        companies,
        setCurrentCompany,
        loading,
        refreshCompanies,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return context;
}
