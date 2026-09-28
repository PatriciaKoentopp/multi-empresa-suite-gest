import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import Movimentacao from "@/pages/financeiro/movimentacao";

export const Route = createFileRoute("/financeiro/movimentacao")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <Movimentacao />
      </MainLayout>
    </PrivateRoute>
  ),
});
