import { getDashboardData } from "@/lib/firestore/dashboard.server";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LinkButton } from "@/components/link-button";
import { DashboardIncomeCards } from "@/components/dashboard-income-cards";

export const dynamic = "force-dynamic";

function fmt(n: number) {
  return n.toLocaleString("es-PY");
}

function daysSince(date: Date | null): string {
  if (!date) return "";
  const diff = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "hoy";
  if (diff === 1) return "ayer";
  return `hace ${diff} días`;
}

export default async function DashboardPage() {
  const { today, week, month, pendingBalances, inTheStreet, topProducts } =
    await getDashboardData();

  const now = new Date();
  const greeting = now.getHours() < 12 ? "Buenos días" : now.getHours() < 19 ? "Buenas tardes" : "Buenas noches";
  const dateLabel = now.toLocaleDateString("es-PY", {
    weekday: "long", day: "numeric", month: "long",
  });

  const totalPendingBalance = pendingBalances.reduce((acc, p) => acc + p.balance, 0);
  const totalInStreet = inTheStreet.reduce((acc, o) => acc + o.totalDue, 0);

  return (
    <main className="p-4 sm:p-6 space-y-8 max-w-4xl">

      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold">{greeting}</h1>
        <p className="text-muted-foreground capitalize">{dateLabel}</p>
      </div>

      {/* Income cards */}
      <DashboardIncomeCards today={today} week={week} month={month} />

      {/* Alerts row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Pending balances */}
        <div className="border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-semibold">Saldos pendientes</p>
            {pendingBalances.length > 0 && (
              <Badge variant="destructive">{pendingBalances.length}</Badge>
            )}
          </div>

          {pendingBalances.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin saldos pendientes.</p>
          ) : (
            <>
              <div className="space-y-2">
                {pendingBalances.slice(0, 4).map((p) => (
                  <div key={p.orderId} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{p.customerName}</p>
                      <p className="text-xs text-muted-foreground">{daysSince(p.settledAt)}</p>
                    </div>
                    <span className="font-semibold text-destructive tabular-nums">
                      Gs. {fmt(p.balance)}
                    </span>
                  </div>
                ))}
              </div>
              {pendingBalances.length > 4 && (
                <p className="text-xs text-muted-foreground">
                  +{pendingBalances.length - 4} más
                </p>
              )}
              <Separator />
              <div className="flex justify-between text-sm font-bold">
                <span>Total pendiente</span>
                <span className="text-destructive tabular-nums">Gs. {fmt(totalPendingBalance)}</span>
              </div>
              <LinkButton href="/orders" variant="outline" size="sm">
                Ver notas
              </LinkButton>
            </>
          )}
        </div>

        {/* In the street */}
        <div className="border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-semibold">Consignaciones activas</p>
            {inTheStreet.length > 0 && (
              <Badge>{inTheStreet.length}</Badge>
            )}
          </div>

          {inTheStreet.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin notas pendientes de arreglo.</p>
          ) : (
            <>
              <div className="space-y-2">
                {inTheStreet.slice(0, 4).map((o) => (
                  <div key={o.orderId} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{o.customerName}</p>
                      <p className="text-xs text-muted-foreground">
                        {o.totalDelivered} prendas · {daysSince(o.createdAt)}
                      </p>
                    </div>
                    <span className="font-semibold tabular-nums text-muted-foreground">
                      Gs. {fmt(o.totalDue)}
                    </span>
                  </div>
                ))}
              </div>
              {inTheStreet.length > 4 && (
                <p className="text-xs text-muted-foreground">
                  +{inTheStreet.length - 4} más
                </p>
              )}
              <Separator />
              <div className="flex justify-between text-sm font-bold">
                <span>Total en consignación</span>
                <span className="tabular-nums">Gs. {fmt(totalInStreet)}</span>
              </div>
              <LinkButton href="/orders" variant="outline" size="sm">
                Ver notas
              </LinkButton>
            </>
          )}
        </div>

      </div>

      {/* Top products */}
      {topProducts.length > 0 && (
        <div className="border rounded-xl p-4 space-y-3">
          <p className="font-semibold">Top productos este mes</p>
          <div className="space-y-2">
            {topProducts.map((p, i) => (
              <div key={p.code} className="flex items-center gap-3 text-sm">
                <span className="text-muted-foreground w-4 text-right">{i + 1}.</span>
                <div className="flex-1">
                  <span className="font-medium">{p.description}</span>
                  {p.size && <span className="text-muted-foreground ml-1.5">· {p.size}</span>}
                  <span className="text-muted-foreground ml-1.5 font-mono text-xs">({p.code})</span>
                </div>
                <span className="font-semibold">{p.totalSold} vendidas</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </main>
  );
}
