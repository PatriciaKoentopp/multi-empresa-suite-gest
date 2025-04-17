
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Favorecido, GrupoFavorecido, Profissao } from "@/types";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useEffect } from "react";
import { FavorecidoTipoRadio } from "./favorecido-tipo-radio";
import { FavorecidoDocumento } from "./favorecido-documento";
import { FavorecidoDadosBasicos } from "./favorecido-dados-basicos";
import { FavorecidoEndereco } from "./favorecido-endereco";
import { FavorecidoAniversarioStatus } from "./favorecido-aniversario-status";
import { formSchema, FormValues } from "./favorecidos-form.schema";

interface FavorecidosFormProps {
  favorecido?: Favorecido;
  grupos: GrupoFavorecido[];
  profissoes: Profissao[];
  onSubmit: (data: Partial<Favorecido>) => void;
  onCancel: () => void;
  readOnly?: boolean;
}

export function FavorecidosForm({
  favorecido,
  grupos,
  profissoes,
  onSubmit,
  onCancel,
  readOnly = false,
}: FavorecidosFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: favorecido ? {
      tipo: favorecido.tipo,
      tipoDocumento: favorecido.tipoDocumento,
      documento: favorecido.documento,
      grupoId: favorecido.grupoId,
      profissaoId: favorecido.profissaoId,
      nome: favorecido.nome,
      nomeFantasia: favorecido.nomeFantasia || "",
      email: favorecido.email || "",
      telefone: favorecido.telefone || "",
      cep: favorecido.endereco?.cep || "",
      logradouro: favorecido.endereco?.logradouro || "",
      numero: favorecido.endereco?.numero || "",
      complemento: favorecido.endereco?.complemento || "",
      bairro: favorecido.endereco?.bairro || "",
      cidade: favorecido.endereco?.cidade || "",
      estado: favorecido.endereco?.estado || "",
      pais: favorecido.endereco?.pais || "",
      dataAniversario: favorecido.dataAniversario,
      status: favorecido.status,
    } : {
      tipo: "cliente",
      tipoDocumento: "cpf",
      documento: "",
      nome: "",
      nomeFantasia: "",
      email: "",
      telefone: "",
      cep: "",
      logradouro: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      estado: "",
      pais: "Brasil",
      status: "ativo",
    },
  });

  // Atualizar tipo de documento baseado no tipo de favorecido
  useEffect(() => {
    const tipoFavorecido = form.watch("tipo");
    const tipoDocumentoAtual = form.watch("tipoDocumento");
    
    if (tipoFavorecido === "cliente" && tipoDocumentoAtual !== "cpf") {
      form.setValue("tipoDocumento", "cpf");
    }
    else if (
      (tipoFavorecido === "fornecedor" || 
       tipoFavorecido === "publico" || 
       tipoFavorecido === "funcionario") && 
      tipoDocumentoAtual !== "cnpj"
    ) {
      form.setValue("tipoDocumento", "cnpj");
    }
  }, [form.watch("tipo")]);

  const handleSubmit = (data: FormValues) => {
    const formattedData: Partial<Favorecido> = {
      ...data,
      endereco: {
        cep: data.cep || "",
        logradouro: data.logradouro || "",
        numero: data.numero || "",
        complemento: data.complemento,
        bairro: data.bairro || "",
        cidade: data.cidade || "",
        estado: data.estado || "",
        pais: data.pais || "",
      }
    };

    delete (formattedData as any).cep;
    delete (formattedData as any).logradouro;
    delete (formattedData as any).numero;
    delete (formattedData as any).complemento;
    delete (formattedData as any).bairro;
    delete (formattedData as any).cidade;
    delete (formattedData as any).estado;
    delete (formattedData as any).pais;
    
    onSubmit(formattedData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <FavorecidoTipoRadio form={form} readOnly={readOnly} />
              <FavorecidoDocumento form={form} readOnly={readOnly} />
            </div>
            <FavorecidoDadosBasicos form={form} grupos={grupos} profissoes={profissoes} readOnly={readOnly} />
          </div>

          <div className="space-y-6">
            <FavorecidoEndereco form={form} readOnly={readOnly} />
            <FavorecidoAniversarioStatus form={form} readOnly={readOnly} />
          </div>
        </div>

        {!readOnly ? (
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" variant="blue">
              Salvar
            </Button>
          </div>
        ) : (
          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Fechar
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
