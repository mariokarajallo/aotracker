"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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
import { MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { deactivateCustomerAction } from "@/lib/actions/customers";
import { useCustomers } from "../hooks/use-customers";
import type { Customer } from "@/types/customer";

export function CustomerList({ initialData }: { initialData?: Customer[] }) {
  const router = useRouter();
  const { customers, setCustomers, loading, error } = useCustomers(initialData);
  const [confirmId, setConfirmId] = useState<string | null>(null);

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
  if (customers.length === 0) return (
    <p className="text-muted-foreground">No hay clientas registradas aún.</p>
  );

  return (
    <>
      {/* Mobile */}
      <div className="sm:hidden space-y-3">
        {customers.map((customer) => (
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
            {customers.map((customer) => (
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
