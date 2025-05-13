
import * as z from "zod";

export const formSchema = z.object({
  tipo: z.enum(["fisica", "juridica", "publico", "funcionario"], {
    required_error: "Tipo de favorecido é obrigatório",
  }),
  tipo_documento: z.enum(["cpf", "cnpj"], {
    required_error: "Tipo de documento é obrigatório",
  }),
  documento: z.string().min(1, { message: "Documento é obrigatório" }),
  grupo_id: z.string().optional(),
  profissao_id: z.string().optional().or(z.literal("")),
  nome: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres" }),
  nome_fantasia: z.string().optional(),
  email: z.string().email({ message: "Email inválido" }).optional().or(z.literal("")),
  telefone: z.string().optional(),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  pais: z.string().optional(),
  data_aniversario: z.date().optional(),
  status: z.enum(["ativo", "inativo"], {
    required_error: "Status é obrigatório",
  }),
});

export type FormValues = z.infer<typeof formSchema>;
