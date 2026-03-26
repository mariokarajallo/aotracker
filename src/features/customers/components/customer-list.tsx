"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreHorizontal, Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";
import { deactivateCustomerAction } from "@/lib/actions/customers";
import { useCustomers } from "../hooks/use-customers";
import type { Customer } from "@/types/customer";

const PAGE_SIZE = 20;

export function CustomerList({ initialData }: { initialData?: Customer[] }) {
  const router = useRouter();
  const { customers, setCustomers, loading, error } = useCustomers(initialData);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.whatsapp.includes(q) ||
        (c.nationalId ?? "").toLowerCase().includes(q)
    );
  }, [customers, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  async function handleDeactivate(id: string) {
    try {
      await deactivateCustomerAction(id);
      setCustomers((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: "inactive" } : c))
      );
      setConfirmId(null);
      toast.success("Clienta desactivada");
    } catch {
      toast.error("No se pudo desactivar la clienta");
    }
  }

  if (loading) return <p className="text-muted-foreground">Cargando clientas...</p>;
  if (error) return <p className="text-destructive">{error}</p>;

  return (
    <>
      {/* Search */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar por nombre, WhatsApp o cédula..."
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
          {filtered.length} {filtered.length === 1 ? "clienta" : "clientas"}
          {search ? " encontradas" : " en total"}
        </p>
      </div>

      {customers.length === 0 ? (
        <p className="text-muted-foreground">No hay clientas registradas aún.</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground">No se encontraron clientas.</p>
      ) : (
        <>
      {/* Mobile */}
      <div className="sm:hidden space-y-3">
        {paginated.map((customer) => (
          <Link
            key={customer.id}
            href={`/customers/${customer.id}`}
            className="block border rounded-xl p-4 space-y-2 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{customer.name}</p>
                <p className="text-sm text-muted-foreground">{customer.whatsapp}</p>
              </div>
              <Badge variant={customer.status === "active" ? "default" : "secondary"}>
                {customer.status === "active" ? "Activa" : "Inactiva"}
              </Badge>
            </div>
            {customer.nationalId && (
              <p className="text-xs text-muted-foreground">CI: {customer.nationalId}</p>
            )}
          </Link>
        ))}
      </div>

      {/* Desktop */}
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>Cédula</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">{customer.name}</TableCell>
                <TableCell>{customer.whatsapp}</TableCell>
                <TableCell>{customer.nationalId ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={customer.status === "active" ? "default" : "secondary"}>
                    {customer.status === "active" ? "Activa" : "Inactiva"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex size-8 items-center justify-center rounded-lg hover:bg-muted touch-manipulation">
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/customers/${customer.id}`)}>
                        Ver detalle
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/customers/${customer.id}?edit=true`)}>
                        Editar
                      </DropdownMenuItem>
                      {customer.status === "active" && (
                        <DropdownMenuItem className="text-destructive" onClick={() => setConfirmId(customer.id)}>
                          Desactivar
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
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

      <AlertDialog open={!!confirmId} onOpenChange={() => setConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desactivar clienta?</AlertDialogTitle>
            <AlertDialogDescription>
              La clienta no aparecerá en nuevas notas. Sus registros históricos se conservan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmId && handleDeactivate(confirmId)}>
              Desactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
