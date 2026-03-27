import { NewOrderForm } from "@/features/orders/components/new-order-form";
import { getCustomersServer } from "@/lib/firestore/customers.server";
import { getProductsServer } from "@/lib/firestore/products.server";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ customerId?: string }>;
}

export default async function NewOrderPage({ searchParams }: Props) {
  const { customerId } = await searchParams;
  const [allCustomers, products] = await Promise.all([
    getCustomersServer(),
    getProductsServer(),
  ]);
  const customers = allCustomers.filter((c) => c.status === "active");
  return (
    <main className="p-4 sm:p-6 flex justify-center">
      <NewOrderForm initialCustomers={customers} initialProducts={products} initialCustomerId={customerId} />
    </main>
  );
}
