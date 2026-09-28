import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import RelatorioContasPagar from "@/pages/relatorios/contas-a-pagar";

export const Route = createFileRoute("/relatorios/contas-a-pagar")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <RelatorioContasPagar />
      </MainLayout>
    </PrivateRoute>
  ),
});
