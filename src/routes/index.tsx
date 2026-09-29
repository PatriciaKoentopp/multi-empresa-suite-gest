import { createFileRoute } from "@tanstack/react-router";
import Index from "@/pages/Index";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Início | Gestão Multiempresa" },
    { name: "description", content: "Acesse a gestão de empresas, finanças, vendas e agenda pessoal." },
    { property: "og:title", content: "Início | Gestão Multiempresa" },
    { property: "og:description", content: "Acesse a gestão de empresas, finanças, vendas e agenda pessoal." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Index,
});
