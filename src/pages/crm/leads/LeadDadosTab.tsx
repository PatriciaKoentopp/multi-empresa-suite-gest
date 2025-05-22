
import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useProdutosServicos } from "@/hooks/useProdutosServicos";
import { useFavorecidos } from "@/hooks/useFavorecidos";
import { Loader2 } from "lucide-react";

interface LeadDadosTabProps {
  formData: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
  etapas: any[];
  origensAtivas: any[];
  vendedoresAtivos: any[];
  handleProdutoChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function LeadDadosTab({
  formData,
  handleChange,
  handleSelectChange,
  etapas,
  origensAtivas,
  vendedoresAtivos
}: LeadDadosTabProps) {
  const { items: produtosServicos, isLoading: isLoadingProdutos } = useProdutosServicos();
  const { favorecidos, isLoading: isLoadingFavorecidos } = useFavorecidos();

  // Função para lidar com a seleção de produto ou serviço
  const handleItemSelect = (value: string) => {
    if (!value || value === "_none_") {
      // Se o valor for vazio, limpar todos os campos relacionados
      handleSelectChange("produto_id", "");
      handleSelectChange("servico_id", "");
      handleSelectChange("produto", "");
      return;
    }

    // O formato esperado é "tipo:id", exemplo: "produto:1234-5678"
    const [tipo, id] = value.split(":");
    
    // Encontrar o item selecionado para obter o nome
    const itemSelecionado = produtosServicos.find(item => 
      item.tipo === tipo && item.id === id
    );
    
    if (tipo === "produto") {
      handleSelectChange("produto_id", id);
      handleSelectChange("servico_id", ""); // Limpar o outro campo
    } else if (tipo === "servico") {
      handleSelectChange("servico_id", id);
      handleSelectChange("produto_id", ""); // Limpar o outro campo
    }
    
    // Atualizar o campo legado "produto" com o nome do item selecionado
    if (itemSelecionado) {
      handleSelectChange("produto", itemSelecionado.nome);
    }
  };

  // Função para lidar com a seleção de favorecido
  const handleFavorecidoSelect = (value: string) => {
    if (!value || value === "_none_") {
      // Se o valor for vazio, limpar o campo
      handleSelectChange("favorecido_id", "");
      handleSelectChange("empresa", "");
      return;
    }

    // Encontrar o favorecido selecionado para obter o nome
    const favorecidoSelecionado = favorecidos.find(item => item.id === value);
    
    handleSelectChange("favorecido_id", value);
    
    // Atualizar o campo legado "empresa" com o nome do favorecido selecionado
    if (favorecidoSelecionado) {
      handleSelectChange("empresa", favorecidoSelecionado.nome);
    }
  };

  // Determinar o valor atual para o Select de produtos
  const getCurrentProductSelectValue = () => {
    if (formData.produto_id) {
      return `produto:${formData.produto_id}`;
    }
    if (formData.servico_id) {
      return `servico:${formData.servico_id}`;
    }
    return "_none_";
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nome</Label>
          <Input name="nome" value={formData.nome} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label>Empresa</Label>
          <Select
            value={formData.favorecido_id || "_none_"}
            onValueChange={handleFavorecidoSelect}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Selecione um favorecido" />
            </SelectTrigger>
            <SelectContent className="bg-white z-50">
              {isLoadingFavorecidos ? (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Carregando...</span>
                </div>
              ) : (
                <>
                  <SelectItem value="_none_">Nenhum</SelectItem>
                  {favorecidos.map((item) => (
                    <SelectItem 
                      key={item.id} 
                      value={item.id}
                    >
                      {item.nome}
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Produto/Serviço</Label>
        <Select
          value={getCurrentProductSelectValue()}
          onValueChange={handleItemSelect}
        >
          <SelectTrigger className="bg-white">
            <SelectValue placeholder="Selecione um produto ou serviço" />
          </SelectTrigger>
          <SelectContent className="bg-white z-50">
            {isLoadingProdutos ? (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span>Carregando...</span>
              </div>
            ) : (
              <>
                <SelectItem value="_none_">Nenhum</SelectItem>
                {produtosServicos.map((item) => (
                  <SelectItem 
                    key={`${item.tipo}-${item.id}`} 
                    value={`${item.tipo}:${item.id}`}
                  >
                    {item.nome} ({item.tipo === "produto" ? "Produto" : "Serviço"})
                  </SelectItem>
                ))}
              </>
            )}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Email</Label>
          <Input name="email" value={formData.email} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label>Telefone</Label>
          <Input name="telefone" value={formData.telefone} onChange={handleChange} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Etapa</Label>
          <Select
            value={formData.etapaId?.toString() || ""}
            onValueChange={(value) => handleSelectChange("etapaId", value)}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Selecione a etapa" />
            </SelectTrigger>
            <SelectContent className="bg-white z-50">
              {etapas.map((etapa: any) => (
                <SelectItem key={etapa.id} value={etapa.id.toString()}>
                  {etapa.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Origem</Label>
          <Select
            value={formData.origemId || ""}
            onValueChange={(value) => handleSelectChange("origemId", value)}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Selecione a origem" />
            </SelectTrigger>
            <SelectContent className="bg-white z-50">
              {origensAtivas.map((origem: any) => (
                <SelectItem key={origem.id} value={origem.id}>
                  {origem.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Responsável</Label>
          <Select
            value={formData.responsavelId || ""}
            onValueChange={(value) => handleSelectChange("responsavelId", value)}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Selecione o responsável" />
            </SelectTrigger>
            <SelectContent className="bg-white z-50">
              {vendedoresAtivos.map((u: any) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Valor Estimado</Label>
          <Input
            type="number"
            name="valor"
            value={formData.valor}
            onChange={handleChange}
          />
        </div>
      </div>
    </div>
  );
}
