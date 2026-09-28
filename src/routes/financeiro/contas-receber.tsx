import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import ContasAReceber from "@/pages/financeiro/contas-a-receber";

export const Route = createFileRoute("/financeiro/contas-receber")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <ContasAReceber />
      </MainLayout>
    </PrivateRoute>
  ),
});
