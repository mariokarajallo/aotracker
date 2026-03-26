import { LinkButton } from "@/components/link-button";
import { ProductList } from "@/features/catalog/components/product-list";
import { getProductsServer } from "@/lib/firestore/products.server";

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const products = await getProductsServer();
  return (
    <main className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Catálogo</h1>
        <LinkButton href="/catalog/new">Nuevo producto</LinkButton>
      </div>
      <ProductList initialData={products} />
    </main>
  );
}
