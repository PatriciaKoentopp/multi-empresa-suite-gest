import { createFileRoute } from "@tanstack/react-router";

// Rota temporária de diagnóstico: consulta a Meta para descobrir a conta do
// Instagram ligada à página do Facebook, usando o token salvo no servidor.
export const Route = createFileRoute("/api/public/meta/ig-lookup")({
  server: {
    handlers: {
      GET: async () => {
        const token = process.env["META_PAGE_TOKEN"];
        if (!token) return Response.json({ error: "token ausente" }, { status: 500 });
        const res = await fetch(
          "https://graph.facebook.com/v21.0/2145329802406998?fields=id,name,instagram_business_account{id,username}&access_token=" +
            encodeURIComponent(token),
        );
        const data = await res.json();
        return Response.json(data, { status: res.status });
      },
    },
  },
});
