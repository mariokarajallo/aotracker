import { CustomerForm } from "@/features/customers/components/customer-form";
import { getCustomerByIdServer } from "@/lib/firestore/customers.server";
import { getOrdersByCustomerServer } from "@/lib/firestore/orders.server";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LinkButton } from "@/components/link-button";
import type { OrderStatus } from "@/types/order";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending_settlement: "Pendiente",
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
  searchParams: Promise<{ edit?: string }>;
}

export default async function CustomerDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { edit } = await searchParams;
  const [customer, orders] = await Promise.all([
    getCustomerByIdServer(id),
    getOrdersByCustomerServer(id),
  ]);

  if (!customer) notFound();

  if (edit === "true") {
    return (
      <main className="p-4 sm:p-6 flex justify-center">
        <CustomerForm customer={customer} />
      </main>
    );
  }

  const totalSold = orders.reduce((acc, o) => acc + o.totalSold, 0);
  const totalCollected = orders.reduce((acc, o) => acc + o.amountPaid, 0);
  const pendingBalance = orders.reduce((acc, o) => acc + o.balance, 0);

  return (
    <main className="p-4 sm:p-6 max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{customer.name}</h1>
          <Badge variant={customer.status === "active" ? "default" : "secondary"} className="mt-1">
            {customer.status === "active" ? "Activa" : "Inactiva"}
          </Badge>
        </div>
        <LinkButton href={`/customers/${id}?edit=true`} variant="outline" size="sm">
          Editar
        </LinkButton>
      </div>

      {/* Info */}
      <div className="space-y-1 text-sm text-muted-foreground">
        <p><span className="font-medium text-foreground">WhatsApp:</span> {customer.whatsapp}</p>
        {customer.nationalId && <p><span className="font-medium text-foreground">Cédula:</span> {customer.nationalId}</p>}
        {customer.address && <p><span className="font-medium text-foreground">Dirección:</span> {customer.address}</p>}
        {customer.notes && <p><span className="font-medium text-foreground">Notas:</span> {customer.notes}</p>}
      </div>

      <Separator />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 text-center text-sm">
        <div className="border rounded-md p-3">
          <p className="text-muted-foreground">Notas totales</p>
          <p className="text-2xl font-bold">{orders.length}</p>
        </div>
        <div className="border rounded-md p-3">
          <p className="text-muted-foreground">Prendas vendidas</p>
          <p className="text-2xl font-bold">{totalSold}</p>
        </div>
        <div className="border rounded-md p-3">
          <p className="text-muted-foreground">Total cobrado</p>
          <p className="text-2xl font-bold">{totalCollected.toLocaleString("es-PY")}</p>
        </div>
      </div>

      {pendingBalance > 0 && (
        <div className="border border-destructive rounded-md p-3 text-sm flex justify-between items-center">
          <span className="text-destructive font-medium">Saldo pendiente total</span>
          <span className="font-bold text-destructive">{pendingBalance.toLocaleString("es-PY")}</span>
        </div>
      )}

      {/* Order history */}
      <div className="space-y-3">
        <h2 className="font-semibold text-lg">Historial de notas</h2>

        {orders.length === 0 ? (
          <p className="text-muted-foreground text-sm">No hay notas registradas aún.</p>
        ) : (
          <>
            {/* Mobile */}
            <div className="sm:hidden space-y-3">
              {orders.map((order) => (
                <LinkButton key={order.id} href={`/orders/${order.id}`} variant="outline" className="w-full h-auto p-4 flex-col items-start gap-2">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm text-muted-foreground">
                      {order.createdAt?.toLocaleDateString("es-PY", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                    <Badge variant={STATUS_VARIANTS[order.status]}>
                      {STATUS_LABELS[order.status]}
                    </Badge>
                  </div>
                  <div className="flex gap-4 text-sm w-full">
                    <span className="text-muted-foreground">{order.totalDelivered} entregadas</span>
                    <span className="font-medium">{order.totalSold} vendidas</span>
                  </div>
                  <div className="flex justify-between w-full text-sm">
                    <span className="text-muted-foreground">Total: {order.grandTotal.toLocaleString("es-PY")}</span>
                    <span className="font-medium">Cobrado: {order.amountPaid.toLocaleString("es-PY")}</span>
                  </div>
                </LinkButton>
              ))}
            </div>

            {/* Desktop */}
            <div className="hidden sm:block">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-center">Entregado</TableHead>
                <TableHead className="text-center">Vendido</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Cobrado</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="text-sm">
                    {order.createdAt?.toLocaleDateString("es-PY", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-center">{order.totalDelivered}</TableCell>
                  <TableCell className="text-center font-medium">{order.totalSold}</TableCell>
                  <TableCell className="text-right">{order.grandTotal.toLocaleString("es-PY")}</TableCell>
                  <TableCell className="text-right">{order.amountPaid.toLocaleString("es-PY")}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANTS[order.status]}>
                      {STATUS_LABELS[order.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <LinkButton href={`/orders/${order.id}`} variant="ghost" size="sm">
                      Ver
                    </LinkButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
          </>
        )}
      </div>
    </main>
  );
}
