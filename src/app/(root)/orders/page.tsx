import { LinkButton } from "@/components/link-button";
import { OrderList } from "@/features/orders/components/order-list";
import { getOrdersServer } from "@/lib/firestore/orders.server";

export default async function OrdersPage() {
  const orders = await getOrdersServer();
  return (
    <main className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notas</h1>
        <LinkButton href="/orders/new">Nueva nota</LinkButton>
      </div>
      <OrderList initialData={orders} />
    </main>
  );
}
