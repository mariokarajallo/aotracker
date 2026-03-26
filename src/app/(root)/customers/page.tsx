import { LinkButton } from "@/components/link-button";
import { CustomerList } from "@/features/customers/components/customer-list";
import { getCustomersServer } from "@/lib/firestore/customers.server";

export default async function CustomersPage() {
  const customers = await getCustomersServer();
  return (
    <main className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clientas</h1>
        <LinkButton href="/customers/new">Nueva clienta</LinkButton>
      </div>
      <CustomerList initialData={customers} />
    </main>
  );
}
