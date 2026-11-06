import { createFileRoute } from "@tanstack/react-router";
import { PrivateRoute } from "@/components/auth/private-route";
import { MainLayout } from "@/components/layout/main-layout";
import ImplantacaoSaldos from "@/pages/contabil/implantacao-saldos";

export const Route = createFileRoute("/contabil/implantacao-saldos")({
  head: () => ({
    meta: [
      { title: "Implantação de Saldos DRE" },
      { name: "description", content: "Lançamento dos totais mensais por categoria para compor o DRE." },
      { property: "og:title", content: "Implantação de Saldos DRE" },
      { property: "og:description", content: "Lançamento dos totais mensais por categoria para compor o DRE." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <PrivateRoute>
      <MainLayout>
        <ImplantacaoSaldos />
      </MainLayout>
    </PrivateRoute>
  ),
});
