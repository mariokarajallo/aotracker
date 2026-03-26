"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useState, useMemo } from "react";
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
import { MoreHorizontal, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { deleteProductAction } from "@/lib/actions/products";
import { useProducts } from "../hooks/use-products";
import type { Product } from "@/types/product";

const PAGE_SIZE = 25;

export function ProductList({ initialData }: { initialData?: Product[] }) {
  const router = useRouter();
  const { products, setProducts, loading, error } = useProducts(initialData);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [sizeFilter, setSizeFilter] = useState("");
  const [page, setPage] = useState(1);

  const brands = useMemo(() => {
    const set = new Set(products.map((p) => p.brand).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [products]);

  const sizes = useMemo(() => {
    const set = new Set(products.map((p) => p.size).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((p) => {
      const matchSearch =
        !q ||
        p.code.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.brand ?? "").toLowerCase().includes(q);
      const matchBrand = !brandFilter || p.brand === brandFilter;
      const matchSize = !sizeFilter || p.size === sizeFilter;
      return matchSearch && matchBrand && matchSize;
    });
  }, [products, search, brandFilter, sizeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function resetFilters() {
    setSearch("");
    setBrandFilter("");
    setSizeFilter("");
    setPage(1);
  }

  function handleFilterChange(fn: () => void) {
    fn();
    setPage(1);
  }

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

  const hasActiveFilters = search || brandFilter || sizeFilter;

  return (
    <>
      {/* Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => handleFilterChange(() => setSearch(e.target.value))}
            placeholder="Buscar por código, descripción o marca..."
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {brands.length > 0 && (
            <select
              value={brandFilter}
              onChange={(e) => handleFilterChange(() => setBrandFilter(e.target.value))}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              <option value="">Todas las marcas</option>
              {brands.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          )}
          {sizes.length > 0 && (
            <select
              value={sizeFilter}
              onChange={(e) => handleFilterChange(() => setSizeFilter(e.target.value))}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              <option value="">Todos los talles</option>
              {sizes.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-9 gap-1">
              <X className="size-3" /> Limpiar
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "producto" : "productos"}
          {hasActiveFilters ? " encontrados" : " en total"}
        </p>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground">No se encontraron productos.</p>
      ) : (
        <>
          {/* Mobile */}
          <div className="sm:hidden space-y-3">
            {paginated.map((product) => (
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
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  {product.brand && <span className="text-muted-foreground">{product.brand}</span>}
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
                  <TableHead>Marca</TableHead>
                  <TableHead>Talle</TableHead>
                  <TableHead className="text-right">Precio venta</TableHead>
                  <TableHead className="text-right">Margen</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-mono text-sm">{product.code}</TableCell>
                    <TableCell className="font-medium">{product.description}</TableCell>
                    <TableCell className="text-muted-foreground">{product.brand ?? "—"}</TableCell>
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
