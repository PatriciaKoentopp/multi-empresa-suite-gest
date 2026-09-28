import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import Lancamentos from "@/pages/contabil/lancamentos";

export const Route = createFileRoute("/contabil/lancamentos")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <Lancamentos />
      </MainLayout>
    </PrivateRoute>
  ),
});
