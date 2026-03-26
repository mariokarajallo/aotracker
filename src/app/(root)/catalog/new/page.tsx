import { ProductForm } from "@/features/catalog/components/product-form";
import { getProductBrandsServer } from "@/lib/firestore/products.server";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const brands = await getProductBrandsServer();
  return (
    <main className="p-6 flex justify-center">
      <ProductForm brands={brands} />
    </main>
  );
}
