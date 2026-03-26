"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SettlementScanner } from "./settlement-scanner";
import { SettlementPayment } from "./settlement-payment";
import type { Order } from "@/types/order";

type Step = "scanning" | "payment";

interface SettlementFlowProps {
  order: Order;
}

export function SettlementFlow({ order }: SettlementFlowProps) {
  const [step, setStep] = useState<Step>("scanning");

  const stepLabel = step === "scanning" ? "Escaneo de devoluciones" : "Cobro";
  const stepTitle = step === "scanning" ? "Escaneá las prendas que devuelve" : "Registrar cobro";

  return (
    <div className="space-y-6 max-w-4xl w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Arreglo — {order.customerName}</h1>
          <p className="text-sm text-muted-foreground">
            Nota del {order.createdAt?.toLocaleDateString("es-PY")}
          </p>
        </div>
        <Badge variant={step === "scanning" ? "default" : "secondary"}>
          {stepLabel}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{stepTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          {step === "scanning" ? (
            <SettlementScanner
              order={order}
              onContinue={() => setStep("payment")}
            />
          ) : (
            <SettlementPayment
              order={order}
              onBack={() => setStep("scanning")}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
