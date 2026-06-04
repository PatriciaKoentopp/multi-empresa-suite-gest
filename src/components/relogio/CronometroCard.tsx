import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Square, Timer } from "lucide-react";
import { formatDate } from "@/lib/utils";
import {
  secondsToHHMMSS,
  timeToSeconds,
  nowTimeString,
} from "@/hooks/useApontamentosRelogio";
import type { RelogioApontamento } from "@/types/relogio";

interface Props {
  apontamento: RelogioApontamento;
  projetoLabel: string | null;
  tarefaLabel: string | null;
  onParar: () => void;
}

export function CronometroCard({
  apontamento,
  projetoLabel,
  tarefaLabel,
  onParar,
}: Props) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(i);
  }, []);

  void tick;
  const inicioSec = timeToSeconds(apontamento.hora_inicio);
  const agoraSec = timeToSeconds(nowTimeString());
  const tempoDecorrido = secondsToHHMMSS(Math.max(0, agoraSec - inicioSec));

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <Timer className="h-6 w-6 text-blue-600 animate-pulse" />
          <div>
            <div className="text-sm text-muted-foreground">
              Cronômetro em andamento
            </div>
            <div className="font-medium">
              {projetoLabel || "Projeto"}
              {tarefaLabel ? ` • ${tarefaLabel}` : ""}
            </div>
            <div className="text-xs text-muted-foreground">
              Iniciado às {apontamento.hora_inicio.slice(0, 8)} —{" "}
              {formatDate(apontamento.data)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-2xl font-mono font-bold text-blue-700">
            {tempoDecorrido}
          </div>
          <Button variant="destructive" onClick={onParar}>
            <Square className="mr-2 h-4 w-4" />
            Parar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
