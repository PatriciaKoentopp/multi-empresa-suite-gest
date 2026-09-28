import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import AnaliseDrePage from "@/pages/relatorios/analise-dre";

export const Route = createFileRoute("/relatorios/analise-dre")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <AnaliseDrePage />
      </MainLayout>
    </PrivateRoute>
  ),
});
