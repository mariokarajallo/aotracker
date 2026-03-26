"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
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
import { deleteProductAction } from "@/lib/actions/products";
import { useProducts } from "../hooks/use-products";
import type { Product } from "@/types/product";

export function ProductList({ initialData }: { initialData?: Product[] }) {
  const router = useRouter();
  const { products, setProducts, loading, error } = useProducts(initialData);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    try {
      await deleteProductAction(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setConfirmId(null);
      toast.success("Producto eliminado");
    } catch {
      toast.error("No se pudo eliminar el producto");
    }
  }

  if (loading) return <p className="text-muted-foreground">Cargando catálogo...</p>;
  if (error) return <p className="text-destructive">{error}</p>;
  if (products.length === 0) return (
    <p className="text-muted-foreground">No hay productos en el catálogo aún.</p>
  );

  return (
    <>
      {/* Mobile */}
      <div className="sm:hidden space-y-3">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/catalog/${product.id}?edit=true`}
            className="block border rounded-xl p-4 space-y-2 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{product.description}</p>
                <p className="font-mono text-xs text-muted-foreground">{product.code}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              {product.size && <span className="text-muted-foreground">Talle {product.size}</span>}
              <span className="font-medium">{product.salePrice.toLocaleString("es-PY")}</span>
              <span className="text-muted-foreground">{product.margin.toFixed(1)}% margen</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Desktop */}
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Talle</TableHead>
              <TableHead className="text-right">Precio venta</TableHead>
              <TableHead className="text-right">Margen</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-mono text-sm">{product.code}</TableCell>
                <TableCell className="font-medium">{product.description}</TableCell>
                <TableCell>{product.size ?? "—"}</TableCell>
                <TableCell className="text-right">
                  {product.salePrice.toLocaleString("es-PY")}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {product.margin.toFixed(1)}%
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex size-8 items-center justify-center rounded-lg hover:bg-muted touch-manipulation">
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/catalog/${product.id}?edit=true`)}>
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => setConfirmId(product.id)}>
                        Eliminar
                      </DropdownMenuItem>
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
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El producto se eliminará del catálogo permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmId && handleDelete(confirmId)}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
