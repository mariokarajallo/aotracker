import { LinkButton } from "@/components/link-button";
import { Badge } from "@/components/ui/badge";
import { getOrderByIdServer } from "@/lib/firestore/orders.server";
import { notFound } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;
  const order = await getOrderByIdServer(id);
  if (!order) notFound();

  return (
    <main className="p-4 sm:p-6 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{order.customerName}</h1>
          <p className="text-sm text-muted-foreground">
            {order.createdAt?.toLocaleDateString("es-PY", {
              day: "2-digit", month: "long", year: "numeric"
            })}
          </p>
        </div>
        <Badge variant={STATUS_VARIANTS[order.status]}>
          {STATUS_LABELS[order.status]}
        </Badge>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Talle</TableHead>
            <TableHead className="text-center">Entregado</TableHead>
            <TableHead className="text-center">Devuelto</TableHead>
            <TableHead className="text-center">Vendido</TableHead>
            <TableHead className="text-right">Subtotal</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {order.items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-mono text-sm">{item.code}</TableCell>
              <TableCell>{item.description}</TableCell>
              <TableCell>{item.size ?? "—"}</TableCell>
              <TableCell className="text-center">{item.deliveredQty}</TableCell>
              <TableCell className="text-center">{item.returnedQty}</TableCell>
              <TableCell className="text-center font-medium">{item.soldQty}</TableCell>
              <TableCell className="text-right">{item.subtotal.toLocaleString("es-PY")}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="space-y-1 text-sm border-t pt-4">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total a cobrar</span>
          <span>{order.totalDue.toLocaleString("es-PY")}</span>
        </div>
        {order.penalty > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Multa</span>
            <span>{order.penalty.toLocaleString("es-PY")}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-base pt-1">
          <span>Total final</span>
          <span>{order.grandTotal.toLocaleString("es-PY")}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Pagado</span>
          <span>{order.amountPaid.toLocaleString("es-PY")}</span>
        </div>
        {order.balance > 0 && (
          <div className="flex justify-between font-semibold text-destructive">
            <span>Saldo pendiente</span>
            <span>{order.balance.toLocaleString("es-PY")}</span>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        {order.status === "pending_settlement" && (
          <LinkButton href={`/orders/${order.id}/settlement`}>
            Hacer arreglo
          </LinkButton>
        )}
        {order.status !== "pending_settlement" && (
          <LinkButton href={`/orders/${order.id}/receipt`} variant="outline">
            Ver comprobante / PDF / WhatsApp
          </LinkButton>
        )}
      </div>
    </main>
  );
}
