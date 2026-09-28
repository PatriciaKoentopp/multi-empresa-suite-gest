import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import Empresas from "@/pages/empresas";

export const Route = createFileRoute("/admin/empresas")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <Empresas />
      </MainLayout>
    </PrivateRoute>
  ),
});
