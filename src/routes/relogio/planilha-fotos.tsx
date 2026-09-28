import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import PlanilhaFotosRelogioPage from "@/pages/relogio/planilha-fotos";

export const Route = createFileRoute("/relogio/planilha-fotos")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <PlanilhaFotosRelogioPage />
      </MainLayout>
    </PrivateRoute>
  ),
});
