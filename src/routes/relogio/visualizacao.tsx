import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import VisualizacaoRelogioPage from "@/pages/relogio/visualizacao";

export const Route = createFileRoute("/relogio/visualizacao")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <VisualizacaoRelogioPage />
      </MainLayout>
    </PrivateRoute>
  ),
});
