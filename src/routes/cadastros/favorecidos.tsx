import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import Favorecidos from "@/pages/cadastros/favorecidos";

export const Route = createFileRoute("/cadastros/favorecidos")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <Favorecidos />
      </MainLayout>
    </PrivateRoute>
  ),
});
