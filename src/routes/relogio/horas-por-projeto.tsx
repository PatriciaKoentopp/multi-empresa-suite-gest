import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import HorasPorProjetoPage from "@/pages/relogio/horas-por-projeto";

export const Route = createFileRoute("/relogio/horas-por-projeto")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <HorasPorProjetoPage />
      </MainLayout>
    </PrivateRoute>
  ),
});
