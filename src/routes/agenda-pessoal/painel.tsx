import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import Page from "@/pages/agenda-pessoal/painel";

export const Route = createFileRoute("/agenda-pessoal/painel")({
  head: () => ({ meta: [
    { title: "Painel da Tríade | Agenda Pessoal" },
    { name: "description", content: "Acompanhe as horas planejadas, papéis, tarefas e metas da sua Agenda Pessoal." },
    { property: "og:title", content: "Painel da Tríade | Agenda Pessoal" },
    { property: "og:description", content: "Acompanhe as horas planejadas, papéis, tarefas e metas da sua Agenda Pessoal." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <Page />
      </MainLayout>
    </PrivateRoute>
  ),
});
