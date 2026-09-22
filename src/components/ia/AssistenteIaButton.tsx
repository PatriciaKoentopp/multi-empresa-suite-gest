import { useState } from "react";
import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssistenteIaPanel } from "./AssistenteIaPanel";

export function AssistenteIaButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-blue-600 p-0 shadow-lg hover:bg-blue-700"
        title="Assistente de Análise"
      >
        <Bot className="h-6 w-6 text-white" />
      </Button>
      <AssistenteIaPanel open={open} onOpenChange={setOpen} />
    </>
  );
}
