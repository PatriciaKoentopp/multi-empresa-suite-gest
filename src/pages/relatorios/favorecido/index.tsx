
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { FavorecidoCadastroTab } from "@/components/relatorios/FavorecidoCadastroTab";
import { FavorecidoVendasTab } from "@/components/relatorios/FavorecidoVendasTab";
import { FavorecidoContasReceberTab } from "@/components/relatorios/FavorecidoContasReceberTab";
import { FavorecidoContasPagarTab } from "@/components/relatorios/FavorecidoContasPagarTab";
import { Favorecido } from "@/types";

export default function RelatorioFavorecido() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [favorecidos, setFavorecidos] = useState<Favorecido[]>([]);
  const [selectedFavorecidoId, setSelectedFavorecidoId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { currentCompany } = useCompany();

  // Carregar favorecidos do Supabase
  useEffect(() => {
    const fetchFavorecidos = async () => {
      if (!currentCompany) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("favorecidos")
          .select("*")
          .eq("empresa_id", currentCompany.id)
          .order("nome");
  
        if (error) {
          console.error("Erro ao carregar favorecidos:", error);
          toast.error("Erro ao carregar favorecidos");
          return;
        }
  
        if (data) {
          // Preservamos os tipos originais dos dados sem conversão adicional
          setFavorecidos(data);

          // Verificar se há um favorecido na URL
          const favorecidoId = searchParams.get('id');
          if (favorecidoId) {
            setSelectedFavorecidoId(favorecidoId);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar favorecidos:", error);
        toast.error("Erro ao carregar favorecidos");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavorecidos();
  }, [currentCompany, searchParams]);

  const handleSearch = () => {
    const filteredFavorecidos = favorecidos.filter(favorecido =>
      favorecido.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      favorecido.documento.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (filteredFavorecidos.length === 1) {
      // Se encontrou exatamente um favorecido, seleciona-o automaticamente
      setSelectedFavorecidoId(filteredFavorecidos[0].id);
      setSearchParams({ id: filteredFavorecidos[0].id });
    } else if (filteredFavorecidos.length > 1) {
      // Se encontrou mais de um, não faz nada e permite que o usuário selecione
      toast.info(`Foram encontrados ${filteredFavorecidos.length} favorecidos. Selecione um da lista.`);
    } else {
      // Se não encontrou nenhum
      toast.error("Nenhum favorecido encontrado com este termo de pesquisa.");
    }
  };

  const handleSelectChange = (value: string) => {
    setSelectedFavorecidoId(value);
    setSearchParams({ id: value });
  };

  const selectedFavorecido = favorecidos.find(f => f.id === selectedFavorecidoId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relatório de Favorecido</h1>
        <p className="text-muted-foreground">
          Consulta completa de favorecidos com vendas e situação financeira
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6 items-end">
            <div className="flex-1">
              <p className="mb-2 text-sm font-medium">Buscar favorecido:</p>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Digite nome ou documento..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <Button onClick={handleSearch}>Buscar</Button>
              </div>
            </div>

            <div className="w-full md:w-96">
              <p className="mb-2 text-sm font-medium">Selecione um favorecido:</p>
              <Select value={selectedFavorecidoId || ""} onValueChange={handleSelectChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um favorecido" />
                </SelectTrigger>
                <SelectContent>
                  {favorecidos.map((favorecido) => (
                    <SelectItem key={favorecido.id} value={favorecido.id}>
                      {favorecido.nome} - {favorecido.documento}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedFavorecido ? (
            <Tabs defaultValue="cadastro" className="mt-6">
              <TabsList className="mb-4">
                <TabsTrigger value="cadastro">Cadastro</TabsTrigger>
                <TabsTrigger value="vendas">Vendas</TabsTrigger>
                <TabsTrigger value="contas-receber">Contas a Receber</TabsTrigger>
                <TabsTrigger value="contas-pagar">Contas a Pagar</TabsTrigger>
              </TabsList>
              
              <TabsContent value="cadastro" className="mt-4">
                <FavorecidoCadastroTab favorecido={selectedFavorecido} />
              </TabsContent>
              
              <TabsContent value="vendas" className="mt-4">
                <FavorecidoVendasTab favorecidoId={selectedFavorecido.id} />
              </TabsContent>
              
              <TabsContent value="contas-receber" className="mt-4">
                <FavorecidoContasReceberTab favorecidoId={selectedFavorecido.id} />
              </TabsContent>
              
              <TabsContent value="contas-pagar" className="mt-4">
                <FavorecidoContasPagarTab favorecidoId={selectedFavorecido.id} />
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Selecione um favorecido para visualizar os detalhes
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
