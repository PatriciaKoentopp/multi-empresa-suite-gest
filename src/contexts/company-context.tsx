
import { createContext, useContext, useState, ReactNode } from "react";
import { Company } from "@/types";

// Removemos dependências com user e updateUser, para evitar erros
interface CompanyContextType {
  currentCompany: Company | null;
  availableCompanies: Company[];
  setCurrentCompany: (company: Company) => void;
  addCompany: (company: Company) => void;
  updateCompany: (id: string, company: Partial<Company>) => void;
  isLoading: boolean;
}

const CompanyContext = createContext<CompanyContextType>({} as CompanyContextType);

export function useCompany() {
  return useContext(CompanyContext);
}

export function CompanyProvider({ children }: { children: ReactNode }) {
  // Por enquanto, tratamos empresas localmente, pois cadastro real de empresa será feito à parte em processo próprio
  const [currentCompany, setCurrentCompanyState] = useState<Company | null>(null);
  const [availableCompanies, setAvailableCompanies] = useState<Company[]>([]);
  const [isLoading] = useState(false);

  const setCurrentCompany = (company: Company) => {
    setCurrentCompanyState(company);
  };

  const addCompany = (company: Company) => {
    const updatedCompanies = [...availableCompanies, company];
    setAvailableCompanies(updatedCompanies);
    setCurrentCompanyState(company);
  };

  const updateCompany = (id: string, companyData: Partial<Company>) => {
    const updatedCompanies = availableCompanies.map(company => {
      if (company.id === id) {
        const updatedCompany = { ...company, ...companyData };
        if (currentCompany && currentCompany.id === id) {
          setCurrentCompanyState(updatedCompany);
        }
        return updatedCompany;
      }
      return company;
    });
    setAvailableCompanies(updatedCompanies);
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
