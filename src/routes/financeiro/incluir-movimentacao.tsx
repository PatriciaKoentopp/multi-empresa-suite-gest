import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import IncluirMovimentacao from "@/pages/financeiro/incluir-movimentacao";

export const Route = createFileRoute("/financeiro/incluir-movimentacao")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <IncluirMovimentacao />
      </MainLayout>
    </PrivateRoute>
  ),
});
