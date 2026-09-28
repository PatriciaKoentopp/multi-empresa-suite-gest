import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import Parametros from "@/pages/admin/parametros";

export const Route = createFileRoute("/admin/parametros")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <Parametros />
      </MainLayout>
    </PrivateRoute>
  ),
});
