import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import ImpostosRetidos from "@/pages/cadastros/impostos-retidos";

export const Route = createFileRoute("/cadastros/impostos-retidos")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <ImpostosRetidos />
      </MainLayout>
    </PrivateRoute>
  ),
});
