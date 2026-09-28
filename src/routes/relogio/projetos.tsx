import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import ProjetosRelogioPage from "@/pages/relogio/projetos";

export const Route = createFileRoute("/relogio/projetos")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <ProjetosRelogioPage />
      </MainLayout>
    </PrivateRoute>
  ),
});
