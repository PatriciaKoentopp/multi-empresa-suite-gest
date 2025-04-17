
import { MovimentacaoForm } from "@/components/movimentacao/movimentacao-form";

export default function IncluirMovimentacaoPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Incluir Movimentação</h1>
        </div>
      </div>
      <MovimentacaoForm />
    </div>
  );
}
