import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import GrupoFavorecidos from "@/pages/cadastros/grupo-favorecidos";

export const Route = createFileRoute("/cadastros/grupo-favorecidos")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <GrupoFavorecidos />
      </MainLayout>
    </PrivateRoute>
  ),
});
