import { getOrderByIdServer } from "@/lib/firestore/orders.server";
import { notFound, redirect } from "next/navigation";
import { SettlementFlow } from "@/features/settlement/components/settlement-flow";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SettlementPage({ params }: Props) {
  const { id } = await params;
  const order = await getOrderByIdServer(id);

  if (!order) notFound();
  if (order.status !== "pending_settlement") redirect(`/orders/${id}`);

  return (
    <main className="p-4 sm:p-6 flex justify-center">
      <SettlementFlow order={order} />
    </main>
  );
}
