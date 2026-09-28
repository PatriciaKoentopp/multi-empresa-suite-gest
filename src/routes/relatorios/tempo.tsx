import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import RelatorioTempoPage from "@/pages/relatorios/tempo";

export const Route = createFileRoute("/relatorios/tempo")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <RelatorioTempoPage />
      </MainLayout>
    </PrivateRoute>
  ),
});
