
import { Company } from "@/types";
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useAuth } from "./auth-context";

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
  const { user, updateUser } = useAuth();
  const [currentCompany, setCurrentCompanyState] = useState<Company | null>(null);
  const [availableCompanies, setAvailableCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize companies from user data
  useEffect(() => {
    if (user) {
      setAvailableCompanies(user.companies);
      
      // Set current company
      if (user.currentCompanyId) {
        const company = user.companies.find(c => c.id === user.currentCompanyId);
        if (company) {
          setCurrentCompanyState(company);
        } else if (user.companies.length > 0) {
          setCurrentCompanyState(user.companies[0]);
          updateUser({
            ...user,
            currentCompanyId: user.companies[0].id
          });
        }
      } else if (user.companies.length > 0) {
        setCurrentCompanyState(user.companies[0]);
        updateUser({
          ...user,
          currentCompanyId: user.companies[0].id
        });
      }
      
      setIsLoading(false);
    }
  }, [user]);

  const setCurrentCompany = (company: Company) => {
    setCurrentCompanyState(company);
    
    if (user) {
      updateUser({
        ...user,
        currentCompanyId: company.id
      });
    }
  };

  const addCompany = (company: Company) => {
    // Add to available companies
    const updatedCompanies = [...availableCompanies, company];
    setAvailableCompanies(updatedCompanies);
    
    // Update user
    if (user) {
      updateUser({
        ...user,
        companies: updatedCompanies
      });
    }
  };

  const updateCompany = (id: string, companyData: Partial<Company>) => {
    const updatedCompanies = availableCompanies.map(company => {
      if (company.id === id) {
        const updatedCompany = { ...company, ...companyData };
        
        // If this is the current company, update that too
        if (currentCompany && currentCompany.id === id) {
          setCurrentCompanyState(updatedCompany);
        }
        
        return updatedCompany;
      }
      return company;
    });
    
    setAvailableCompanies(updatedCompanies);
    
    // Update user
    if (user) {
      updateUser({
        ...user,
        companies: updatedCompanies
      });
    }
  };

  return (
    <CompanyContext.Provider
      value={{
        currentCompany,
        availableCompanies,
        setCurrentCompany,
        addCompany,
        updateCompany,
        isLoading
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}
