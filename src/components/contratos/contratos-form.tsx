import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFavorecidos } from "@/hooks/useFavorecidos";
import { Switch } from "@/components/ui/switch";
import { DateInput } from "@/components/movimentacao/DateInput";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";

const formSchema = z.object({
  codigo: z.string().min(1, "Código é obrigatório"),
  favorecido_id: z.string().min(1, "Favorecido é obrigatório"),
  servico_id: z.string().min(1, "Serviço é obrigatório"),
  descricao: z.string().optional(),
  valor_mensal: z.number().min(0, "Valor deve ser maior que 0"),
  data_inicio: z.date({ required_error: "Data de início é obrigatória" }),
  data_fim: z.date({ required_error: "Data de fim é obrigatória" }),
  data_primeiro_vencimento: z.date({ required_error: "Data do primeiro vencimento é obrigatória" }),
  periodicidade: z.enum(["mensal", "trimestral", "semestral", "anual"]),
  forma_pagamento: z.string().min(1, "Forma de pagamento é obrigatória"),
  observacoes: z.string().optional(),
  gerar_automatico: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface ContratosFormProps {
  onSubmit: (data: FormValues) => void;
  onCancel: () => void;
  initialData?: Partial<FormValues>;
  isLoading?: boolean;
}

export function ContratosForm({ onSubmit, onCancel, initialData, isLoading = false }: ContratosFormProps) {
  const { currentCompany } = useCompany();
  const { favorecidos, isLoading: loadingFavorecidos } = useFavorecidos();

  // Buscar serviços ativos
  const { data: servicos = [], isLoading: loadingServicos } = useQuery({
    queryKey: ["servicos", currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany?.id) return [];
      
      const { data, error } = await supabase
        .from("servicos")
        .select("id, nome")
        .eq("empresa_id", currentCompany.id)
        .eq("status", "ativo")
        .order("nome");
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentCompany?.id,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      codigo: "",
      favorecido_id: "",
      servico_id: "",
      descricao: "",
      valor_mensal: 0,
      periodicidade: "mensal",
      forma_pagamento: "boleto",
      observacoes: "",
      gerar_automatico: true,
      ...initialData,
    },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="codigo">Código do Contrato *</Label>
          <Input
            id="codigo"
            {...form.register("codigo")}
            placeholder="Ex: CONT-2025-001"
          />
          {form.formState.errors.codigo && (
            <p className="text-sm text-red-500">{form.formState.errors.codigo.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="favorecido_id">Favorecido *</Label>
          <Select 
            value={form.watch("favorecido_id")} 
            onValueChange={(value) => form.setValue("favorecido_id", value)}
            disabled={loadingFavorecidos}
          >
            <SelectTrigger>
              <SelectValue placeholder={loadingFavorecidos ? "Carregando..." : "Selecione um favorecido"} />
            </SelectTrigger>
            <SelectContent>
              {favorecidos.map((favorecido) => (
                <SelectItem key={favorecido.id} value={favorecido.id}>
                  {favorecido.nome} - {favorecido.documento}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.favorecido_id && (
            <p className="text-sm text-red-500">{form.formState.errors.favorecido_id.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="servico_id">Serviço *</Label>
          <Select 
            value={form.watch("servico_id")} 
            onValueChange={(value) => form.setValue("servico_id", value)}
            disabled={loadingServicos}
          >
            <SelectTrigger>
              <SelectValue placeholder={loadingServicos ? "Carregando..." : "Selecione um serviço"} />
            </SelectTrigger>
            <SelectContent>
              {servicos.map((servico) => (
                <SelectItem key={servico.id} value={servico.id}>
                  {servico.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.servico_id && (
            <p className="text-sm text-red-500">{form.formState.errors.servico_id.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="valor_mensal">Valor Mensal *</Label>
          <Input
            id="valor_mensal"
            type="number"
            step="0.01"
            {...form.register("valor_mensal", { valueAsNumber: true })}
            placeholder="0,00"
          />
          {form.formState.errors.valor_mensal && (
            <p className="text-sm text-red-500">{form.formState.errors.valor_mensal.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <DateInput
            label="Data de Início *"
            value={form.watch("data_inicio")}
            onChange={(date) => form.setValue("data_inicio", date as Date)}
            placeholder="DD/MM/AAAA"
          />
          {form.formState.errors.data_inicio && (
            <p className="text-sm text-red-500">{form.formState.errors.data_inicio.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <DateInput
            label="Data de Fim *"
            value={form.watch("data_fim")}
            onChange={(date) => form.setValue("data_fim", date as Date)}
            placeholder="DD/MM/AAAA"
          />
          {form.formState.errors.data_fim && (
            <p className="text-sm text-red-500">{form.formState.errors.data_fim.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <DateInput
            label="Data do Primeiro Vencimento *"
            value={form.watch("data_primeiro_vencimento")}
            onChange={(date) => form.setValue("data_primeiro_vencimento", date as Date)}
            placeholder="DD/MM/AAAA"
          />
          {form.formState.errors.data_primeiro_vencimento && (
            <p className="text-sm text-red-500">{form.formState.errors.data_primeiro_vencimento.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="periodicidade">Periodicidade *</Label>
          <Select 
            value={form.watch("periodicidade")} 
            onValueChange={(value) => form.setValue("periodicidade", value as "mensal" | "trimestral" | "semestral" | "anual")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mensal">Mensal</SelectItem>
              <SelectItem value="trimestral">Trimestral</SelectItem>
              <SelectItem value="semestral">Semestral</SelectItem>
              <SelectItem value="anual">Anual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="forma_pagamento">Forma de Pagamento *</Label>
          <Select 
            value={form.watch("forma_pagamento")} 
            onValueChange={(value) => form.setValue("forma_pagamento", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="boleto">Boleto</SelectItem>
              <SelectItem value="pix">PIX</SelectItem>
              <SelectItem value="transferencia">Transferência</SelectItem>
              <SelectItem value="dinheiro">Dinheiro</SelectItem>
              <SelectItem value="cartao">Cartão</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          {...form.register("descricao")}
          placeholder="Descrição detalhada do contrato"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          {...form.register("observacoes")}
          placeholder="Observações adicionais"
          rows={2}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="gerar_automatico"
          checked={form.watch("gerar_automatico")}
          onCheckedChange={(checked) => form.setValue("gerar_automatico", checked)}
        />
        <Label htmlFor="gerar_automatico">Gerar parcelas automaticamente</Label>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isLoading} variant="blue">
          {isLoading ? "Salvando..." : "Salvar"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
