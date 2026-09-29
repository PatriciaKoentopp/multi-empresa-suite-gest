import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import Page from "@/pages/agenda-pessoal/metas";

export const Route = createFileRoute("/agenda-pessoal/metas")({
  head: () => ({ meta: [{ title: "Papéis e Metas - Agenda Pessoal" }] }),
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <Page />
      </MainLayout>
    </PrivateRoute>
  ),
});
