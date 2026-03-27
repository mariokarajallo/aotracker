"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LinkButton } from "@/components/link-button";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScanBarcode, AlertCircle, Loader2 } from "lucide-react";
import { productSchema, type ProductFormValues } from "../schemas/product.schema";
import { createProductAction, updateProductAction } from "@/lib/actions/products";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { getProductByCode } from "@/lib/firestore/products";
import type { Product } from "@/types/product";

interface ProductFormProps {
  product?: Product;
  brands?: string[];
}

function calcMargin(cost: number, sale: number): number {
  if (cost <= 0 || sale <= cost) return 0;
  return ((sale - cost) / cost) * 100;
}

function calcSaleFromMargin(cost: number, margin: number): number {
  if (cost <= 0) return 0;
  return cost * (1 + margin / 100);
}

export function ProductForm({ product, brands = [] }: ProductFormProps) {
  const router = useRouter();
  const isEditing = !!product;

  const [values, setValues] = useState<ProductFormValues>({
    code: product?.code ?? "",
    description: product?.description ?? "",
    brand: product?.brand ?? "",
    size: product?.size ?? "",
    costPrice: product?.costPrice ?? 0,
    salePrice: product?.salePrice ?? 0,
  });
  const [marginInput, setMarginInput] = useState<string>(
    product ? calcMargin(product.costPrice, product.salePrice).toFixed(1) : ""
  );
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormValues, string>>>({});
  const [saving, setSaving] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  // Duplicate code check
  const [codeChecking, setCodeChecking] = useState(false);
  const [duplicateProduct, setDuplicateProduct] = useState<Product | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const code = values.code.trim();

    // Reset
    setDuplicateProduct(null);

    // Skip if empty, too short, or editing the same product
    if (!code || code.length < 3) return;
    if (isEditing && code === product.code) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setCodeChecking(true);
      try {
        const existing = await getProductByCode(code);
        // If editing, ignore if it's the same product
        if (existing && existing.id !== product?.id) {
          setDuplicateProduct(existing);
        }
      } finally {
        setCodeChecking(false);
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [values.code, isEditing, product?.id, product?.code]);

  function handleChange(field: keyof ProductFormValues, value: string | number) {
    setValues((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "salePrice" && prev.costPrice > 0) {
        const m = calcMargin(prev.costPrice, Number(value));
        setMarginInput(m > 0 ? m.toFixed(1) : "");
      }
      if (field === "costPrice" && prev.salePrice > 0) {
        const m = calcMargin(Number(value), prev.salePrice);
        setMarginInput(m > 0 ? m.toFixed(1) : "");
      }
      return next;
    });
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleMarginChange(raw: string) {
    setMarginInput(raw);
    const pct = parseFloat(raw);
    if (!Number.isFinite(pct) || values.costPrice <= 0) return;
    const sale = calcSaleFromMargin(values.costPrice, pct);
    setValues((prev) => ({ ...prev, salePrice: Math.round(sale) }));
    if (errors.salePrice) setErrors((prev) => ({ ...prev, salePrice: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (duplicateProduct) return;

    const result = productSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: typeof errors = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof ProductFormValues;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSaving(true);
    try {
      if (isEditing) {
        await updateProductAction(product.id, result.data);
        toast.success("Producto actualizado correctamente");
      } else {
        await createProductAction(result.data);
        toast.success("Producto creado correctamente");
      }
      router.push("/catalog");
    } catch {
      toast.error("Ocurrió un error. Intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="max-w-lg w-full">
      <CardHeader>
        <CardTitle>{isEditing ? "Editar Producto" : "Nuevo Producto"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="code">Código de barras *</Label>
            <div className="flex gap-2">
              <Input
                id="code"
                value={values.code}
                onChange={(e) => handleChange("code", e.target.value)}
                placeholder="Ej: RD00278 — escaneá o escribí manualmente"
                autoFocus={!isEditing}
                className={`flex-1 ${duplicateProduct ? "border-destructive focus-visible:ring-destructive" : ""}`}
              />
              {codeChecking ? (
                <Button type="button" variant="outline" size="icon" disabled>
                  <Loader2 className="size-4 animate-spin" />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setScannerOpen(true)}
                  title="Escanear con cámara"
                >
                  <ScanBarcode className="size-4" />
                </Button>
              )}
            </div>

            {duplicateProduct && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 space-y-2">
                <div className="flex items-start gap-2 text-sm text-destructive">
                  <AlertCircle className="size-4 mt-0.5 shrink-0" />
                  <span>Este código ya está registrado.</span>
                </div>
                <Link
                  href={`/catalog/${duplicateProduct.id}`}
                  className="flex items-center justify-between w-full rounded-md border border-destructive/30 bg-background px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-semibold">
                      {duplicateProduct.description}
                      {duplicateProduct.size ? ` (${duplicateProduct.size})` : ""}
                    </p>
                    {duplicateProduct.brand && (
                      <p className="text-xs text-muted-foreground">{duplicateProduct.brand}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground ml-3 shrink-0">Ver producto →</span>
                </Link>
              </div>
            )}

            {errors.code && !duplicateProduct && (
              <p className="text-sm text-destructive">{errors.code}</p>
            )}
          </div>

          {scannerOpen && (
            <BarcodeScanner
              onScan={(code) => {
                handleChange("code", code);
                setScannerOpen(false);
              }}
              onClose={() => setScannerOpen(false)}
            />
          )}

          <div className="space-y-1">
            <Label htmlFor="description">Descripción *</Label>
            <Input
              id="description"
              value={values.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Nombre del producto"
            />
            {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="brand">Marca</Label>
              <Input
                id="brand"
                value={values.brand}
                onChange={(e) => handleChange("brand", e.target.value)}
                placeholder="Nike, Adidas..."
                list="brand-options"
                autoComplete="off"
              />
              {brands.length > 0 && (
                <datalist id="brand-options">
                  {brands.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="size">Talle</Label>
              <Input
                id="size"
                value={values.size}
                onChange={(e) => handleChange("size", e.target.value)}
                placeholder="S, M, L, 38..."
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="costPrice">Costo *</Label>
              <Input
                id="costPrice"
                type="number"
                min={0}
                value={values.costPrice || ""}
                onChange={(e) => handleChange("costPrice", parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
              {errors.costPrice && <p className="text-sm text-destructive">{errors.costPrice}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="salePrice">Venta *</Label>
              <Input
                id="salePrice"
                type="number"
                min={0}
                value={values.salePrice || ""}
                onChange={(e) => handleChange("salePrice", parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
              {errors.salePrice && <p className="text-sm text-destructive">{errors.salePrice}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="margin">Ganancia %</Label>
              <Input
                id="margin"
                type="number"
                min={0}
                value={marginInput}
                onChange={(e) => handleMarginChange(e.target.value)}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">Auto o manual</p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={saving || !!duplicateProduct || codeChecking}>
              {saving ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear producto"}
            </Button>
            <LinkButton variant="outline" href="/catalog">Cancelar</LinkButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
