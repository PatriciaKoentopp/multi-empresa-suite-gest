import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import MotivosPerdas from "@/pages/cadastros/motivos-perda";

export const Route = createFileRoute("/cadastros/motivos-perda")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <MotivosPerdas />
      </MainLayout>
    </PrivateRoute>
  ),
});
