"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LinkButton } from "@/components/link-button";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { productSchema, type ProductFormValues } from "../schemas/product.schema";
import { createProductAction, updateProductAction } from "@/lib/actions/products";
import type { Product } from "@/types/product";

interface ProductFormProps {
  product?: Product;
}

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const isEditing = !!product;

  const [values, setValues] = useState<ProductFormValues>({
    code: product?.code ?? "",
    description: product?.description ?? "",
    size: product?.size ?? "",
    costPrice: product?.costPrice ?? 0,
    salePrice: product?.salePrice ?? 0,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormValues, string>>>({});
  const [saving, setSaving] = useState(false);

  const margin =
    values.costPrice > 0 && values.salePrice > values.costPrice
      ? (((values.salePrice - values.costPrice) / values.costPrice) * 100).toFixed(1)
      : null;

  function handleChange(field: keyof ProductFormValues, value: string | number) {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
            <Input
              id="code"
              value={values.code}
              onChange={(e) => handleChange("code", e.target.value)}
              placeholder="Ej: RD00278 — escaneá o escribí manualmente"
              autoFocus={!isEditing}
            />
            {errors.code && <p className="text-sm text-destructive">{errors.code}</p>}
          </div>

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

          <div className="space-y-1">
            <Label htmlFor="size">Talle</Label>
            <Input
              id="size"
              value={values.size}
              onChange={(e) => handleChange("size", e.target.value)}
              placeholder="S, M, L, XL, 38, 40..."
            />
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="costPrice">Precio de costo *</Label>
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
              <Label htmlFor="salePrice">Precio de venta *</Label>
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
          </div>

          {margin && (
            <p className="text-sm text-muted-foreground">
              Ganancia: <span className="font-semibold text-foreground">{margin}%</span>
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear producto"}
            </Button>
            <LinkButton variant="outline" href="/catalog">Cancelar</LinkButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
