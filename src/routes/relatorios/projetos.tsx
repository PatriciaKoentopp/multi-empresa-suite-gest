import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import RelatorioProjetosPage from "@/pages/relatorios/projetos";

export const Route = createFileRoute("/relatorios/projetos")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <RelatorioProjetosPage />
      </MainLayout>
    </PrivateRoute>
  ),
});
