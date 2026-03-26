import { getOrderByIdServer } from "@/lib/firestore/orders.server";
import { notFound } from "next/navigation";
import { ReceiptActions } from "@/features/settlement/components/receipt-actions";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { OrderStatus } from "@/types/order";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending_settlement: "Aguardando acerto",
  settled_zero_balance: "Saldo cero",
  settled_pending_balance: "Saldo pendiente",
};

const STATUS_VARIANTS: Record<OrderStatus, "default" | "secondary" | "destructive"> = {
  pending_settlement: "default",
  settled_zero_balance: "secondary",
  settled_pending_balance: "destructive",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ReceiptPage({ params }: Props) {
  const { id } = await params;
  const order = await getOrderByIdServer(id);
  if (!order) notFound();

  const soldItems = order.items.filter((i) => i.soldQty > 0);
  const returnedItems = order.items.filter((i) => i.returnedQty > 0);

  return (
    <main className="p-4 sm:p-6 max-w-2xl">
      {/* Receipt card */}
      <div className="border rounded-xl overflow-hidden">

        {/* Header */}
        <div className="bg-muted/50 px-6 py-5 flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Comprobante de arreglo</p>
            <h1 className="text-xl font-bold">{order.customerName}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {order.settledAt?.toLocaleDateString("es-PY", {
                day: "2-digit", month: "long", year: "numeric",
              })}
            </p>
          </div>
          <Badge variant={STATUS_VARIANTS[order.status]} className="mt-1">
            {STATUS_LABELS[order.status]}
          </Badge>
        </div>

        <Separator />

        {/* Sold items */}
        <div className="px-6 py-4 space-y-3">
          {soldItems.length > 0 ? (
            <>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Prendas vendidas</p>
              <div className="space-y-2">
                {soldItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium">{item.description}</span>
                      {item.size && (
                        <span className="text-muted-foreground ml-1.5">· Talle {item.size}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <span className="text-muted-foreground text-xs">x{item.soldQty}</span>
                      <span className="font-medium w-24 text-right tabular-nums">
                        {item.subtotal.toLocaleString("es-PY")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground py-2">No se vendió ninguna prenda.</p>
          )}
        </div>

        {/* Returned items (if any) */}
        {returnedItems.length > 0 && (
          <>
            <Separator />
            <div className="px-6 py-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Prendas devueltas</p>
              <div className="space-y-1.5">
                {returnedItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm text-muted-foreground">
                    <div>
                      <span>{item.description}</span>
                      {item.size && <span className="ml-1.5">· Talle {item.size}</span>}
                    </div>
                    <span className="text-xs">x{item.returnedQty} devuelto</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* Totals */}
        <div className="px-6 py-4 space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Mercadería vendida</span>
            <span className="tabular-nums">{order.totalDue.toLocaleString("es-PY")}</span>
          </div>
          {order.penalty > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Multa / Recargo</span>
              <span className="tabular-nums">{order.penalty.toLocaleString("es-PY")}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between font-bold text-base">
            <span>Total</span>
            <span className="tabular-nums">{order.grandTotal.toLocaleString("es-PY")}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Monto recibido</span>
            <span className="tabular-nums">{order.amountPaid.toLocaleString("es-PY")}</span>
          </div>

          {order.balance > 0 ? (
            <div className="flex justify-between font-semibold text-destructive pt-1">
              <span>Saldo pendiente</span>
              <span className="tabular-nums">{order.balance.toLocaleString("es-PY")}</span>
            </div>
          ) : (
            <div className="flex justify-between font-semibold text-green-600 pt-1">
              <span>Saldo</span>
              <span>Cero ✓</span>
            </div>
          )}
        </div>

      </div>

      {/* Actions */}
      <div className="mt-6">
        <ReceiptActions order={order} />
      </div>
    </main>
  );
}
