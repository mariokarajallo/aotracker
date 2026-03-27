"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";
import { useOrders } from "../hooks/use-orders";
import type { Order, OrderStatus } from "@/types/order";

const PAGE_SIZE = 20;

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

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  return (typeof d === "string" ? new Date(d) : d).toLocaleDateString("es-PY");
}

function fmtNum(n: number): string {
  return `#${String(n).padStart(3, "0")}`;
}

const STATUS_FILTER_OPTIONS: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "pending_settlement", label: "Aguardando acerto" },
  { value: "settled_pending_balance", label: "Saldo pendiente" },
  { value: "settled_zero_balance", label: "Saldo cero" },
];

export function OrderList({ initialData }: { initialData?: Order[] }) {
  const router = useRouter();
  const { orders, loading, error } = useOrders(initialData);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let result = orders;
    if (statusFilter !== "all") {
      result = result.filter((o) => o.status === statusFilter);
    }
    const q = search.toLowerCase().replace(/^#/, "");
    if (!q) return result;
    return result.filter(
      (o) =>
        o.customerName.toLowerCase().includes(q) ||
        String(o.orderNumber ?? "").includes(q)
    );
  }, [orders, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleStatusFilter(value: OrderStatus | "all") {
    setStatusFilter(value);
    setPage(1);
  }

  if (loading) return <p className="text-muted-foreground">Cargando notas...</p>;
  if (error) return <p className="text-destructive">{error}</p>;

  return (
    <>
      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleStatusFilter(opt.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              statusFilter === opt.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-input hover:bg-muted"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="space-y-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar por clienta o número (#001)..."
            className="pl-9"
          />
          {search && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "nota" : "notas"}
          {search ? " encontradas" : " en total"}
        </p>
      </div>

      {orders.length === 0 ? (
        <p className="text-muted-foreground">No hay notas registradas aún.</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground">No se encontraron notas.</p>
      ) : (
        <>
          {/* Mobile */}
          <div className="sm:hidden space-y-3">
            {paginated.map((order) => (
              <Link
                key={order.id}
                href={order.status === "pending_settlement" ? `/orders/${order.id}/settlement` : `/orders/${order.id}`}
                className="block border rounded-xl p-4 space-y-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{order.customerName}</p>
                      {order.orderNumber && (
                        <span className="text-xs font-mono text-muted-foreground">
                          {fmtNum(order.orderNumber)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{fmtDate(order.createdAt)}</p>
                  </div>
                  <Badge variant={STATUS_VARIANTS[order.status]}>
                    {STATUS_LABELS[order.status]}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-medium">{order.grandTotal.toLocaleString("es-PY")}</span>
                </div>
                {order.balance > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Saldo pendiente</span>
                    <span className="font-semibold text-destructive">{order.balance.toLocaleString("es-PY")}</span>
                  </div>
                )}
                <div className={`w-full text-center text-sm font-medium py-1.5 px-3 rounded-md border ${order.status === "pending_settlement" ? "bg-primary text-primary-foreground border-primary" : "border-input bg-background"}`}>
                  {order.status === "pending_settlement" ? "Hacer arreglo" : "Ver detalle"}
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Nro.</TableHead>
                  <TableHead>Clienta</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {order.orderNumber ? fmtNum(order.orderNumber) : "—"}
                    </TableCell>
                    <TableCell className="font-medium">{order.customerName}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {fmtDate(order.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[order.status]}>
                        {STATUS_LABELS[order.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {order.grandTotal.toLocaleString("es-PY")}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {order.balance > 0 ? (
                        <span className="text-destructive">{order.balance.toLocaleString("es-PY")}</span>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {order.status === "pending_settlement" ? (
                        <Button size="sm" onClick={() => router.push(`/orders/${order.id}/settlement`)}>
                          Hacer arreglo
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => router.push(`/orders/${order.id}`)}>
                          Ver detalle
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Página {currentPage} de {totalPages}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
