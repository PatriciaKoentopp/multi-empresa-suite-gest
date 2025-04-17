
import { useState } from "react";
import { useCompany } from "@/contexts/company-context";
import { Building2, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { CompanyModal } from "./company-modal";
import { Company } from "@/types";

export default function EmpresasPage() {
  const { availableCompanies } = useCompany();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const filteredCompanies = availableCompanies.filter(
    (company) =>
      company.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.nomeFantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.cnpj.includes(searchTerm)
  );

  const handleAddCompany = () => {
    setSelectedCompany(null);
    setIsModalOpen(true);
  };

  const handleEditCompany = (company: Company) => {
    setSelectedCompany(company);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Empresas</h1>
          <p className="text-muted-foreground">
            Gerencie as empresas cadastradas no sistema
          </p>
        </div>
        <Button onClick={handleAddCompany}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Empresa
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Lista de Empresas</CardTitle>
          <CardDescription>
            Total de {filteredCompanies.length} empresas cadastradas
          </CardDescription>
          <div className="flex w-full max-w-sm items-center space-x-2 pt-2">
            <Input
              placeholder="Buscar empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
            <Button type="submit" variant="secondary" className="shrink-0">
              <Search className="h-4 w-4" />
              <span className="sr-only">Buscar</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCompanies.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        {company.logo ? (
                          <img
                            src={company.logo}
                            alt={company.razaoSocial}
                            className="mr-2 h-8 w-8 rounded"
                          />
                        ) : (
                          <Building2 className="mr-2 h-5 w-5 text-muted-foreground" />
                        )}
                        <div>
                          <div>{company.nomeFantasia}</div>
                          <div className="text-xs text-muted-foreground">
                            {company.razaoSocial}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{company.cnpj}</TableCell>
                    <TableCell>{company.email || "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditCompany(company)}
                      >
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">Nenhuma empresa encontrada</h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm
                  ? "Tente ajustar sua busca."
                  : "Cadastre sua primeira empresa."}
              </p>
              {!searchTerm && (
                <Button onClick={handleAddCompany} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Empresa
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <CompanyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        company={selectedCompany}
      />
    </div>
  );
}
