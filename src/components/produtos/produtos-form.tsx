
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useCompany } from "@/contexts/company-context";
import { toast } from "sonner";
import { GrupoProduto } from "@/types/grupo-produtos";

interface ProdutosFormProps {
  initialData?: {
    id?: string;
    nome: string;
    descricao?: string;
    grupo_id?: string;
    unidade: string;
    conta_receita_id?: string;
    status: "ativo" | "inativo";
  };
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export function ProdutosForm({ initialData, onSubmit, onCancel }: ProdutosFormProps) {
  const { currentCompany } = useCompany();
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    grupo_id: "nenhum",
    unidade: "UN",
    status: "ativo",
    conta_receita_id: "",
    ...initialData,
  });

  // Buscar grupos de produtos
  const { data: grupoProdutos = [] } = useQuery({
    queryKey: ["grupos-produtos", currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany?.id) return [];

      const { data, error } = await supabase
        .from("grupo_produtos")
        .select("*")
        .eq("empresa_id", currentCompany.id)
        .eq("status", "ativo")
        .order("nome");

      if (error) {
        toast.error("Erro ao carregar grupos de produtos");
        throw error;
      }

      return data as GrupoProduto[];
    },
    enabled: !!currentCompany?.id,
  });

  // Buscar contas contábeis do tipo receita
  const { data: contasReceita = [] } = useQuery({
    queryKey: ["contas-receita", currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany?.id) return [];

      const { data, error } = await supabase
        .from("plano_contas")
        .select("*")
        .eq("empresa_id", currentCompany.id)
        .eq("tipo", "receita")
        .eq("categoria", "movimentação")
        .order("codigo");

      if (error) {
        toast.error("Erro ao carregar contas de receita");
        throw error;
      }

      return data;
    },
    enabled: !!currentCompany?.id,
  });

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const unidadesMedida = [
    { value: "UN", label: "Unidade (UN)" },
    { value: "KG", label: "Quilograma (KG)" },
    { value: "L", label: "Litro (L)" },
    { value: "M", label: "Metro (M)" },
    { value: "M2", label: "Metro Quadrado (M²)" },
    { value: "M3", label: "Metro Cúbico (M³)" },
    { value: "CX", label: "Caixa (CX)" },
    { value: "PC", label: "Peça (PC)" },
    { value: "PR", label: "Par (PR)" },
    { value: "PCT", label: "Pacote (PCT)" },
    { value: "DZ", label: "Dúzia (DZ)" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="nome">Nome do Produto *</Label>
          <Input
            id="nome"
            placeholder="Digite o nome do produto"
            value={form.nome}
            onChange={(e) => handleChange("nome", e.target.value)}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="grupo_id">Grupo de Produtos</Label>
          <Select
            value={form.grupo_id || "nenhum"}
            onValueChange={(value) => handleChange("grupo_id", value)}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Selecione um grupo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nenhum">Nenhum</SelectItem>
              {grupoProdutos.map((grupo) => (
                <SelectItem key={grupo.id} value={grupo.id}>
                  {grupo.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="descricao">Descrição</Label>
          <Textarea
            id="descricao"
            placeholder="Digite a descrição do produto"
            value={form.descricao || ""}
            onChange={(e) => handleChange("descricao", e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="unidade">Unidade de Medida *</Label>
          <Select
            value={form.unidade}
            onValueChange={(value) => handleChange("unidade", value)}
            required
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Selecione a unidade" />
            </SelectTrigger>
            <SelectContent>
              {unidadesMedida.map((unidade) => (
                <SelectItem key={unidade.value} value={unidade.value}>
                  {unidade.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="conta_receita">Conta de Receita *</Label>
          <Select
            value={form.conta_receita_id || "sem_contas"}
            onValueChange={(value) => handleChange("conta_receita_id", value)}
            required
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Selecione a conta de receita" />
            </SelectTrigger>
            <SelectContent>
              {contasReceita.length > 0 ? (
                contasReceita.map((conta) => (
                  <SelectItem key={conta.id} value={conta.id}>
                    {conta.codigo} - {conta.descricao}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="sem_contas">Nenhuma conta disponível</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label>Status</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={form.status === "ativo" ? "blue" : "outline"}
              onClick={() => handleChange("status", "ativo")}
            >
              Ativo
            </Button>
            <Button
              type="button"
              variant={form.status === "inativo" ? "blue" : "outline"}
              onClick={() => handleChange("status", "inativo")}
            >
              Inativo
            </Button>
          </div>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="submit" variant="blue">
          {initialData ? "Salvar Alterações" : "Salvar"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
