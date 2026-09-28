import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import Relatorios from "@/pages/relatorios";

export const Route = createFileRoute("/relatorios")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <Relatorios />
      </MainLayout>
    </PrivateRoute>
  ),
});
