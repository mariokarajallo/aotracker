"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface CardData {
  total: number;
  count: number;
}

interface Props {
  today: CardData;
  week: CardData;
  month: CardData;
}

function fmt(n: number) {
  return n.toLocaleString("es-PY");
}

const HIDDEN = "••••••••";

export function DashboardIncomeCards({ today, week, month }: Props) {
  const [visible, setVisible] = useState(false);

  const cards = [
    { label: "Hoy", data: today },
    { label: "Esta semana", data: week },
    { label: "Este mes", data: month },
  ];

  function formatAmount(total: number) {
    if (!visible) return HIDDEN;
    return total === 0 ? "—" : `Gs. ${fmt(total)}`;
  }

  function formatCount(count: number) {
    if (!visible) return HIDDEN;
    return count === 0
      ? "Sin cobros"
      : `${count} ${count === 1 ? "cobro" : "cobros"}`;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground font-medium">Cobros</p>
        <button
          onClick={() => setVisible((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          aria-label={visible ? "Ocultar montos" : "Mostrar montos"}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          {visible ? "Ocultar" : "Mostrar"}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {cards.map(({ label, data }, index) => (
          <div
            key={label}
            className={`border rounded-xl p-4 space-y-1${index === 2 ? " col-span-2 sm:col-span-1" : ""}`}
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              {label}
            </p>
            <p className="text-2xl font-bold tabular-nums">
              {formatAmount(data.total)}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatCount(data.count)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
