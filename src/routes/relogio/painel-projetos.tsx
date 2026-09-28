import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import PainelProjetosRelogioPage from "@/pages/relogio/painel-projetos";

export const Route = createFileRoute("/relogio/painel-projetos")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <PainelProjetosRelogioPage />
      </MainLayout>
    </PrivateRoute>
  ),
});
