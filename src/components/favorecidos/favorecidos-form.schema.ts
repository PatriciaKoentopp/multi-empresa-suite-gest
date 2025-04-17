
import * as z from "zod";

export const formSchema = z.object({
  tipo: z.enum(["cliente", "fornecedor", "publico", "funcionario"], {
    required_error: "Tipo de favorecido é obrigatório",
  }),
  tipoDocumento: z.enum(["cpf", "cnpj"], {
    required_error: "Tipo de documento é obrigatório",
  }),
  documento: z.string().min(1, { message: "Documento é obrigatório" }),
  grupoId: z.string().optional(),
  nome: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres" }),
  nomeFantasia: z.string().optional(),
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
  dataAniversario: z.date().optional(),
  status: z.enum(["ativo", "inativo"], {
    required_error: "Status é obrigatório",
  }),
});

export type FormValues = z.infer<typeof formSchema>;
