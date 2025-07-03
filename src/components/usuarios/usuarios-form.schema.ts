
import { z } from "zod";

export const formSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  tipo: z.enum(["Administrador", "Usuário"]),
  vendedor: z.boolean(),
  status: z.boolean(),
});

export type FormValues = z.infer<typeof formSchema>;
