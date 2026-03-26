"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { recordPaymentAction } from "@/lib/actions/orders";

interface Props {
  orderId: string;
  balance: number;
  grandTotal: number;
}

export function CollectBalanceButton({ orderId, balance, grandTotal }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
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
      toast.success(newBalance === 0 ? "Saldo cobrado. Nota cerrada." : "Pago parcial registrado.");
      router.refresh();
    } catch {
      toast.error("No se pudo registrar el pago.");
    } finally {
      setSaving(false);
      setOpen(false);
    }
  }

  if (!open) {
    return (
      <Button variant="destructive" onClick={() => setOpen(true)}>
        Cobrar saldo (Gs. {balance.toLocaleString("es-PY")})
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3 border rounded-xl p-4 bg-muted/40">
      <div className="space-y-1">
        <Label htmlFor="collect-amount">Monto a cobrar</Label>
        <Input
          id="collect-amount"
          type="number"
          min={1}
          max={grandTotal}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-44"
          autoFocus
        />
        <p className="text-xs text-muted-foreground">Saldo pendiente: Gs. {balance.toLocaleString("es-PY")}</p>
      </div>
      <Button type="submit" disabled={saving} variant="destructive">
        {saving ? "Guardando..." : "Registrar pago"}
      </Button>
      <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
        Cancelar
      </Button>
    </form>
  );
}
