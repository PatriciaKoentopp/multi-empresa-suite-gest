import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { OrcamentoFluxoCaixa } from "@/types/orcamento";
import { LancamentoContabil } from "@/types/lancamentos-contabeis";
import { Parcela } from "@/types/orcamento";
import { toast } from "sonner";
import { RecebimentoFormSchema, RecebimentoFormValues } from "./RecebimentoForm.schema";
import { useCompany } from "@/contexts/company-context";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { ParcelasForm } from "./parcelas-form";

interface RecebimentoFormProps {
  orcamentos: OrcamentoFluxoCaixa[];
  lancamentoContabil?: LancamentoContabil;
  onClose: () => void;
  onSuccess: () => void;
}

export function RecebimentoForm({ orcamentos, lancamentoContabil, onClose, onSuccess }: RecebimentoFormProps) {
  const { currentCompany } = useCompany();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parcelas, setParcelas] = useState<Parcela[]>([]);

  const form = useForm<RecebimentoFormValues>({
    resolver: zodResolver(RecebimentoFormSchema),
    defaultValues: {
      data_pagamento: new Date(),
      valor_total: 0,
      conta_corrente_id: "",
      orcamento_id: "",
      observacoes: "",
    },
  });

  useEffect(() => {
    if (lancamentoContabil) {
      form.reset({
        data_pagamento: new Date(lancamentoContabil.data),
        valor_total: lancamentoContabil.valor,
        conta_corrente_id: lancamentoContabil.conta_corrente_id,
        orcamento_id: lancamentoContabil.orcamento_id || "",
        observacoes: lancamentoContabil.observacoes || "",
      });
    }
  }, [lancamentoContabil, form]);

  const onSubmit = async (values: RecebimentoFormValues) => {
    if (!currentCompany?.id) {
      toast.error("Empresa não selecionada");
      return;
    }

    setIsSubmitting(true);

    try {
      const lancamentoContabilData = {
        empresa_id: currentCompany.id,
        tipo: "receita",
        categoria: "recebimento",
        data: values.data_pagamento.toISOString().split('T')[0],
        valor: values.valor_total,
        conta_corrente_id: values.conta_corrente_id,
        orcamento_id: values.orcamento_id || null,
        observacoes: values.observacoes || null,
      };

      // TODO: Implementar a lógica de salvar no banco de dados
      console.log("Dados do lançamento contábil:", lancamentoContabilData);

      toast.success("Recebimento cadastrado com sucesso!");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar recebimento:", error);
      toast.error("Erro ao salvar recebimento");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOrcamentoChange = (orcamentoId: string) => {
    const orcamentoSelecionado = orcamentos.find((orcamento) => orcamento.id === orcamentoId);
    if (orcamentoSelecionado) {
      // TODO: Buscar o valor total do orçamento no banco de dados
      form.setValue("valor_total", 1000);
    } else {
      form.setValue("valor_total", 0);
    }
  };

  const handleParcelasSubmit = () => {
    // Add the missing functions
    const handleValorChange = (valor: number) => {
      // Implementation for valor change
      console.log("Valor changed:", valor);
    };

    const handleDataChange = (data: Date) => {
      // Implementation for data change
      console.log("Data changed:", data);
    };

    return (
      <ParcelasForm 
        parcelas={parcelas}
        onValorChange={handleValorChange}
        onDataChange={handleDataChange}
      />
    );
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FormItem>
                <FormLabel>Data de Pagamento</FormLabel>
                <FormControl>
                  <DatePicker
                    mode="single"
                    selected={form.watch("data_pagamento")}
                    onSelect={(date) => form.setValue("data_pagamento", date || new Date())}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </div>

            <div>
              <FormItem>
                <FormLabel>Valor Total</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    {...form.register("valor_total", { valueAsNumber: true })}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <FormItem>
                <FormLabel>Conta Corrente</FormLabel>
                <Select
                  onValueChange={form.setValue}
                  defaultValue={form.watch("conta_corrente_id")}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a conta" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="conta1">Conta 1</SelectItem>
                    <SelectItem value="conta2">Conta 2</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            </div>

            <div>
              <FormItem>
                <FormLabel>Orçamento</FormLabel>
                <Select
                  onValueChange={(value) => {
                    form.setValue("orcamento_id", value);
                    handleOrcamentoChange(value);
                  }}
                  defaultValue={form.watch("orcamento_id")}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o orçamento" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {orcamentos.map((orcamento) => (
                      <SelectItem key={orcamento.id} value={orcamento.id}>
                        {orcamento.codigo} - {orcamento.numero_nota_fiscal}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            </div>
          </div>

          <div>
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea placeholder="Observações" {...form.register("observacoes")} />
              </FormControl>
              <FormMessage />
            </FormItem>
          </div>

          {handleParcelasSubmit()}
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="blue"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Salvando..." : "Cadastrar"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
