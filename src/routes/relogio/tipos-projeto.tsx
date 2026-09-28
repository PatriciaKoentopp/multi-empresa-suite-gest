import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import TiposProjetoRelogioPage from "@/pages/relogio/tipos-projeto";

export const Route = createFileRoute("/relogio/tipos-projeto")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <TiposProjetoRelogioPage />
      </MainLayout>
    </PrivateRoute>
  ),
});
