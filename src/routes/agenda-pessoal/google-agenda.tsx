import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import Page from "@/pages/agenda-pessoal/google-agenda";

export const Route = createFileRoute("/agenda-pessoal/google-agenda")({
  head: () => ({
    meta: [
      { title: "Implantação Google Agenda | Agenda Pessoal" },
      { name: "description", content: "Conecte sua conta Google à Agenda Pessoal." },
      { property: "og:title", content: "Implantação Google Agenda | Agenda Pessoal" },
      { property: "og:description", content: "Conecte sua conta Google à Agenda Pessoal." },
    ],
  }),
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <Page />
      </MainLayout>
    </PrivateRoute>
  ),
});
