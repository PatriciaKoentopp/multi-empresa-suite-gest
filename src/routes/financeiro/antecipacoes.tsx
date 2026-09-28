import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import AntecipacoesPage from "@/pages/financeiro/antecipacoes";

export const Route = createFileRoute("/financeiro/antecipacoes")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <AntecipacoesPage />
      </MainLayout>
    </PrivateRoute>
  ),
});
