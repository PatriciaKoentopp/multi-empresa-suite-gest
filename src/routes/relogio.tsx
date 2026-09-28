import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import RelogioPage from "@/pages/relogio";

export const Route = createFileRoute("/relogio")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <RelogioPage />
      </MainLayout>
    </PrivateRoute>
  ),
});
