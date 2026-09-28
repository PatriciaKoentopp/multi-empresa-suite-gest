import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import ContasAPagar from "@/pages/financeiro/contas-a-pagar";

export const Route = createFileRoute("/financeiro/contas-a-pagar")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <ContasAPagar />
      </MainLayout>
    </PrivateRoute>
  ),
});
