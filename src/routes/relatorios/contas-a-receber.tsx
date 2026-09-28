import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import RelatorioContasReceber from "@/pages/relatorios/contas-a-receber";

export const Route = createFileRoute("/relatorios/contas-a-receber")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <RelatorioContasReceber />
      </MainLayout>
    </PrivateRoute>
  ),
});
