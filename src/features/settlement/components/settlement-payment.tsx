"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useScanningStore } from "../store/scanning.store";
import { updateOrderStatusAction } from "@/lib/actions/orders";
import type { Order, OrderStatus } from "@/types/order";

interface SettlementPaymentProps {
  order: Order;
  onBack: () => void;
}

export function SettlementPayment({ order, onBack }: SettlementPaymentProps) {
  const router = useRouter();
  const { items, penalty, amountPaid, setPenalty, setAmountPaid, totalDue, grandTotal, balance, reset } =
    useScanningStore();
  const [saving, setSaving] = useState(false);

  const currentGrandTotal = grandTotal();
  const isZeroSale = currentGrandTotal === 0;
  const currentBalance = balance();
  const isFullPayment = amountPaid >= currentGrandTotal && currentGrandTotal > 0;

  async function handleSettle() {
    if (!isZeroSale && amountPaid <= 0) {
      toast.error("Ingresá el monto recibido");
      return;
    }

    setSaving(true);
    try {
      const status: OrderStatus = isZeroSale || isFullPayment
        ? "settled_zero_balance"
        : "settled_pending_balance";

      await updateOrderStatusAction(order.id, status, {
        items,
        penalty,
        amountPaid: isZeroSale ? 0 : amountPaid,
      });
      reset();
      toast.success(
        isZeroSale
          ? "Arreglo cerrado — devolvió todo"
          : isFullPayment
          ? "Arreglo cerrado — saldo cero"
          : "Arreglo registrado — saldo pendiente"
      );
      router.push(`/orders/${order.id}/receipt`);
    } catch (err) {
      console.error("Error al registrar el arreglo:", err);
      toast.error("Error al registrar el arreglo");
    } finally {
      setSaving(false);
    }
  }

  if (isZeroSale) {
    return (
      <div className="space-y-6 max-w-md">
        <div className="border rounded-md p-4 space-y-2 text-sm">
          <p className="font-semibold text-base">Devolvió toda la mercadería</p>
          <p className="text-muted-foreground">No hay monto a cobrar. El arreglo se cerrará con saldo cero.</p>
          <Separator />
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>0</span>
          </div>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleSettle} disabled={saving}>
            {saving ? "Cerrando..." : "Cerrar arreglo"}
          </Button>
          <Button variant="outline" onClick={onBack}>
            ← Volver al escaneo
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-md">
      {/* Summary */}
      <div className="space-y-2 text-sm border rounded-md p-4">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Mercadería vendida</span>
          <span>{totalDue().toLocaleString("es-PY")}</span>
        </div>

        <div className="flex justify-between items-center">
          <Label htmlFor="penalty">Multa / Recargo</Label>
          <Input
            id="penalty"
            type="number"
            min={0}
            value={penalty || ""}
            onChange={(e) => setPenalty(parseFloat(e.target.value) || 0)}
            placeholder="0"
            className="w-36 text-right"
          />
        </div>

        <Separator />

        <div className="flex justify-between font-bold text-base">
          <span>Total final</span>
          <span>{currentGrandTotal.toLocaleString("es-PY")}</span>
        </div>
      </div>

      {/* Payment */}
      <div className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="amountPaid">Monto recibido</Label>
          <Input
            id="amountPaid"
            type="number"
            min={0}
            value={amountPaid || ""}
            onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
            placeholder="0"
            autoFocus
          />
        </div>

        {amountPaid > 0 && (
          <div className="text-sm border rounded-md p-3 space-y-1">
            {isFullPayment ? (
              <p className="font-semibold text-green-600">Pago total — saldo cero ✓</p>
            ) : (
              <>
                <p className="font-semibold text-destructive">Pago parcial</p>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Saldo pendiente</span>
                  <span className="font-bold text-destructive">
                    {currentBalance.toLocaleString("es-PY")}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">El pagaré se retiene hasta saldar la deuda.</p>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button onClick={handleSettle} disabled={saving || amountPaid <= 0}>
          {saving ? "Registrando..." : "Concluir arreglo"}
        </Button>
        <Button variant="outline" onClick={onBack}>
          ← Volver al escaneo
        </Button>
      </div>
    </div>
  );
}
