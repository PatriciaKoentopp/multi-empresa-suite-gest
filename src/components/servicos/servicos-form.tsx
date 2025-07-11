
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useCompany } from "@/contexts/company-context";
import { toast } from "sonner";

interface ServicosFormProps {
  initialData?: {
    id?: string;
    nome: string;
    descricao?: string;
    status: "ativo" | "inativo";
    conta_receita_id?: string;
  };
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export function ServicosForm({ initialData, onSubmit, onCancel }: ServicosFormProps) {
  const { currentCompany } = useCompany();
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    status: "ativo",
    conta_receita_id: "",
    ...initialData,
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="nome">Nome do Serviço *</Label>
          <Input
            id="nome"
            placeholder="Digite o nome do serviço"
            value={form.nome}
            onChange={(e) => handleChange("nome", e.target.value)}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="descricao">Descrição</Label>
          <Textarea
            id="descricao"
            placeholder="Digite a descrição do serviço"
            value={form.descricao}
            onChange={(e) => handleChange("descricao", e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="conta_receita">Conta de Receita *</Label>
          <Select
            value={form.conta_receita_id}
            onValueChange={(value) => handleChange("conta_receita_id", value)}
            required
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Selecione a conta de receita" />
            </SelectTrigger>
            <SelectContent>
              {contasReceita.map((conta) => (
                <SelectItem key={conta.id} value={conta.id}>
                  {conta.codigo} - {conta.descricao}
                </SelectItem>
              ))}
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
