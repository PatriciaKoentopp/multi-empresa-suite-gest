import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import BackupPage from "@/pages/backup";

export const Route = createFileRoute("/backup")({
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <BackupPage />
      </MainLayout>
    </PrivateRoute>
  ),
});
