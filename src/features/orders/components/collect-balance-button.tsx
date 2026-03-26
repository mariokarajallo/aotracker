"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { recordPaymentAction } from "@/lib/actions/orders";

interface Props {
  orderId: string;
  balance: number;
  grandTotal: number;
}

export function CollectBalanceButton({ orderId, balance, grandTotal }: Props) {
  const router = useRouter();
  const [amount, setAmount] = useState<string>(String(balance));
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    setSaving(true);
    try {
      await recordPaymentAction(orderId, parsed);
      const newBalance = Math.max(0, balance - parsed);
      toast.success(
        newBalance === 0 ? "Saldo cobrado. Nota cerrada." : "Pago parcial registrado."
      );
      router.refresh();
    } catch {
      toast.error("No se pudo registrar el pago.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border border-destructive/30 rounded-xl p-4 sm:p-5 space-y-4 bg-destructive/5">
      <div>
        <p className="font-semibold text-sm">Cobrar saldo pendiente</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Registrá el pago total o parcial del saldo restante.
        </p>
      </div>

      <Separator />

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Saldo por cobrar</span>
        <span className="font-bold text-destructive text-base tabular-nums">
          Gs. {balance.toLocaleString("es-PY")}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="collect-amount">Monto a cobrar</Label>
          <Input
            id="collect-amount"
            type="number"
            min={1}
            max={grandTotal}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
          />
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAmount(String(balance))}
          >
            Cobrar todo
          </Button>
          <Button type="submit" disabled={saving} variant="destructive" size="sm">
            {saving ? "Guardando..." : "Registrar pago"}
          </Button>
        </div>
      </form>
    </div>
  );
}
