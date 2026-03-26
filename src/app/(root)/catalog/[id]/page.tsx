import { ProductForm } from "@/features/catalog/components/product-form";
import { getProductByIdServer } from "@/lib/firestore/products.server";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}

export default async function ProductDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { edit } = await searchParams;
  const product = await getProductByIdServer(id);

  if (!product) notFound();

  if (edit === "true") {
    return (
      <main className="p-6 flex justify-center">
        <ProductForm product={product} />
      </main>
    );
  }

  return (
    <main className="p-6 max-w-lg space-y-4">
      <h1 className="text-2xl font-bold">{product.description}</h1>
      <div className="space-y-2 text-sm text-muted-foreground">
        <p><span className="font-medium text-foreground">Código:</span> {product.code}</p>
        {product.size && <p><span className="font-medium text-foreground">Talle:</span> {product.size}</p>}
        <p><span className="font-medium text-foreground">Precio de costo:</span> {product.costPrice.toLocaleString("es-PY")}</p>
        <p><span className="font-medium text-foreground">Precio de venta:</span> {product.salePrice.toLocaleString("es-PY")}</p>
        <p><span className="font-medium text-foreground">Margen:</span> {product.margin.toFixed(1)}%</p>
      </div>
    </main>
  );
}
