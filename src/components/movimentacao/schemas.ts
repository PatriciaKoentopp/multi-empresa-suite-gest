
import { z } from "zod";

export const RecebimentoFormSchema = z.object({
  tipo_titulo_id: z.string().min(1, "Tipo de título é obrigatório"),
  favorecido_id: z.string().min(1, "Favorecido é obrigatório"),
  conta_corrente_id: z.string().min(1, "Conta corrente é obrigatória"),
  plano_conta_id: z.string().min(1, "Plano de contas é obrigatório"),
  data_emissao: z.date(),
  primeiro_vencimento: z.date(),
  numero_parcelas: z.number().min(1),
  valor: z.number().min(0),
  juros: z.number().min(0).default(0),
  multa: z.number().min(0).default(0),
  desconto: z.number().min(0).default(0),
  observacoes: z.string().optional(),
});

export type RecebimentoFormSchema = z.infer<typeof RecebimentoFormSchema>;
