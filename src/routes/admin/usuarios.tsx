import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import Usuarios from "@/pages/admin/usuarios";

export const Route = createFileRoute("/admin/usuarios")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <Usuarios />
      </MainLayout>
    </PrivateRoute>
  ),
});
