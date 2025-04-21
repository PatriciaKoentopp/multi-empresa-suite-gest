
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { MotivoPerda } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const formSchema = z.object({
  nome: z.string().min(3, {
    message: "Nome deve ter pelo menos 3 caracteres.",
  }),
  status: z.enum(["ativo", "inativo"], {
    required_error: "Você deve selecionar um status.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface MotivoPerdaFormProps {
  motivoPerda?: MotivoPerda;
  onSubmit: (data: FormValues) => void;
  onCancel: () => void;
}

export function MotivosPerdaForm({
  motivoPerda,
  onSubmit,
  onCancel,
}: MotivoPerdaFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: motivoPerda?.nome || "",
      status: motivoPerda?.status || "ativo",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Nome do motivo de perda" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Status</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ativo" id="ativo" className="text-blue-500 border-blue-500 focus:ring-blue-500" />
                    <FormLabel htmlFor="ativo" className="cursor-pointer text-blue-600">
                      Ativo
                    </FormLabel>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="inativo" id="inativo" className="text-red-500 border-red-500 focus:ring-red-500" />
                    <FormLabel htmlFor="inativo" className="cursor-pointer text-red-600">
                      Inativo
                    </FormLabel>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" variant="blue">
            Salvar
          </Button>
        </div>
      </form>
    </Form>
  );
}
