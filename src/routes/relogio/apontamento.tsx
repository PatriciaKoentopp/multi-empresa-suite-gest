import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import ApontamentoRelogioPage from "@/pages/relogio/apontamento";

export const Route = createFileRoute("/relogio/apontamento")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <ApontamentoRelogioPage />
      </MainLayout>
    </PrivateRoute>
  ),
});
