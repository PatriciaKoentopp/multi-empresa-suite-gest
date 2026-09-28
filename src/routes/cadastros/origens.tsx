import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import Origens from "@/pages/cadastros/origens";

export const Route = createFileRoute("/cadastros/origens")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <Origens />
      </MainLayout>
    </PrivateRoute>
  ),
});
