import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import RelatorioFinanceiro from "@/pages/relatorios/financeiro";

export const Route = createFileRoute("/relatorios/financeiro")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <RelatorioFinanceiro />
      </MainLayout>
    </PrivateRoute>
  ),
});
