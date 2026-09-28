import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import RelatorioAntecipacoes from "@/pages/relatorios/antecipacoes";

export const Route = createFileRoute("/relatorios/antecipacoes")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <RelatorioAntecipacoes />
      </MainLayout>
    </PrivateRoute>
  ),
});
