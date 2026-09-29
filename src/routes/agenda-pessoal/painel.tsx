import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import Page from "@/pages/agenda-pessoal/painel";

export const Route = createFileRoute("/agenda-pessoal/painel")({
  head: () => ({ meta: [{ title: "Painel da Tríade - Agenda Pessoal" }] }),
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <Page />
      </MainLayout>
    </PrivateRoute>
  ),
});
