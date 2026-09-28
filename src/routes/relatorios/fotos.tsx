import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import RelatorioFotosPage from "@/pages/relatorios/fotos";

export const Route = createFileRoute("/relatorios/fotos")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <RelatorioFotosPage />
      </MainLayout>
    </PrivateRoute>
  ),
});
