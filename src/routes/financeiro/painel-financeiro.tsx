import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import PainelFinanceiroPage from "@/pages/financeiro/painel-financeiro";

export const Route = createFileRoute("/financeiro/painel-financeiro")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <PainelFinanceiroPage />
      </MainLayout>
    </PrivateRoute>
  ),
});
