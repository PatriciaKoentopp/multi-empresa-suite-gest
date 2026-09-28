import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import PainelTempoRelogioPage from "@/pages/relogio/painel-tempo";

export const Route = createFileRoute("/relogio/painel-tempo")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <PainelTempoRelogioPage />
      </MainLayout>
    </PrivateRoute>
  ),
});
