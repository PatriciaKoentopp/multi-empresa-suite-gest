import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import PlanoContas from "@/pages/contabil/plano-contas";

export const Route = createFileRoute("/contabil/plano-contas")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <PlanoContas />
      </MainLayout>
    </PrivateRoute>
  ),
});
