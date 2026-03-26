"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FileText, MessageCircle } from "lucide-react";
import { LinkButton } from "@/components/link-button";
import { cn } from "@/lib/utils";
import type { Order } from "@/types/order";

interface ReceiptActionsProps {
  order: Order;
}

export function ReceiptActions({ order }: ReceiptActionsProps) {
  const [generatingPdf, setGeneratingPdf] = useState(false);

  function buildWhatsAppText(): string {
    const date = order.settledAt?.toLocaleDateString("es-PY") ?? "";
    const lines = [
      `*Arreglo - ${date}*`,
      "",
      ...order.items
        .filter((i) => i.soldQty > 0)
        .map((i) => `• ${i.description}${i.size ? ` (${i.size})` : ""} x${i.soldQty} = ${i.subtotal.toLocaleString("es-PY")}`),
      "",
      `*Mercadería vendida:* ${order.totalDue.toLocaleString("es-PY")}`,
    ];

    if (order.penalty > 0) {
      lines.push(`*Multa:* ${order.penalty.toLocaleString("es-PY")}`);
    }

    lines.push(`*Total:* ${order.grandTotal.toLocaleString("es-PY")}`);
    lines.push(`*Recibido:* ${order.amountPaid.toLocaleString("es-PY")}`);

    if (order.balance > 0) {
      lines.push(`*Saldo pendiente:* ${order.balance.toLocaleString("es-PY")} ⚠️`);
    } else {
      lines.push("*Saldo: Cero ✅*");
    }

    return lines.join("\n");
  }

  const whatsappUrl = useMemo(() => {
    const text = encodeURIComponent(buildWhatsAppText());
    return `https://wa.me/?text=${text}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.id]);

  function handlePDF(e: React.MouseEvent<HTMLButtonElement>) {
    e.currentTarget.blur();
    setGeneratingPdf(true);
    // setTimeout(0) ensures the click handler returns synchronously so the
    // browser completes the touch event cycle (clears :active) before the
    // async PDF generation starts. On desktop the behavior is identical.
    setTimeout(async () => {
    try {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    const date = order.settledAt?.toLocaleDateString("es-PY", {
      day: "2-digit", month: "long", year: "numeric",
    }) ?? "";

    // ── Header bar ──────────────────────────────────────────
    doc.setFillColor(24, 24, 27); // zinc-900
    doc.rect(0, 0, pageW, 28, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("COMPROBANTE DE ARREGLO", 14, 12);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("aotracker", pageW - 14, 12, { align: "right" });

    // ── Customer + date block ────────────────────────────────
    doc.setTextColor(24, 24, 27);
    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.text(order.customerName, 14, 42);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(113, 113, 122); // zinc-500
    doc.text(`Fecha de arreglo: ${date}`, 14, 50);

    // Status badge (right side)
    const statusText = order.balance > 0 ? "SALDO PENDIENTE" : "SALDO CERO";
    const [sr, sg, sb] = order.balance > 0 ? [220, 38, 38] : [22, 163, 74];
    doc.setFillColor(sr, sg, sb);
    doc.roundedRect(pageW - 56, 36, 42, 10, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text(statusText, pageW - 35, 42.5, { align: "center" });

    // ── Divider ──────────────────────────────────────────────
    doc.setDrawColor(228, 228, 231); // zinc-200
    doc.line(14, 56, pageW - 14, 56);

    // ── Sold items table ─────────────────────────────────────
    const soldItems = order.items.filter((i) => i.soldQty > 0);

    doc.setTextColor(24, 24, 27);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("PRENDAS VENDIDAS", 14, 63);

    autoTable(doc, {
      startY: 67,
      margin: { left: 14, right: 14 },
      head: [["Descripción", "Talle", "Cant.", "Precio unit.", "Subtotal"]],
      body: soldItems.length > 0
        ? soldItems.map((i) => [
            i.description,
            i.size ?? "—",
            i.soldQty,
            i.salePrice.toLocaleString("es-PY"),
            i.subtotal.toLocaleString("es-PY"),
          ])
        : [["No se vendió ninguna prenda", "", "", "", ""]],
      headStyles: {
        fillColor: [24, 24, 27],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
      },
      bodyStyles: { fontSize: 9, textColor: [39, 39, 42] },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { cellWidth: 18, halign: "center" },
        2: { cellWidth: 16, halign: "center" },
        3: { cellWidth: 32, halign: "right" },
        4: { cellWidth: 32, halign: "right" },
      },
    });

    type DocWithAutoTable = InstanceType<typeof jsPDF> & { lastAutoTable: { finalY: number } };
    let y = (doc as DocWithAutoTable).lastAutoTable.finalY + 8;

    // ── Returned items (if any) ──────────────────────────────
    const returnedItems = order.items.filter((i) => i.returnedQty > 0);
    if (returnedItems.length > 0) {
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(113, 113, 122);
      doc.text("PRENDAS DEVUELTAS", 14, y);

      autoTable(doc, {
        startY: y + 4,
        margin: { left: 14, right: 14 },
        head: [["Descripción", "Talle", "Devuelto"]],
        body: returnedItems.map((i) => [
          i.description,
          i.size ?? "—",
          i.returnedQty,
        ]),
        headStyles: {
          fillColor: [113, 113, 122],
          textColor: [255, 255, 255],
          fontSize: 8,
        },
        bodyStyles: { fontSize: 9, textColor: [113, 113, 122] },
        columnStyles: {
          2: { halign: "center" },
        },
      });

      y = (doc as DocWithAutoTable).lastAutoTable.finalY + 8;
    }

    // ── Totals box ───────────────────────────────────────────
    const boxX = pageW - 14 - 80;
    const lineH = 7;
    let boxY = y;

    doc.setDrawColor(228, 228, 231);
    doc.setFillColor(250, 250, 250);

    // Rows
    const totals: Array<{ label: string; value: string; bold?: boolean; color?: [number, number, number] }> = [
      { label: "Mercadería vendida", value: order.totalDue.toLocaleString("es-PY") },
      ...(order.penalty > 0 ? [{ label: "Multa / Recargo", value: order.penalty.toLocaleString("es-PY") }] : []),
      { label: "Total", value: order.grandTotal.toLocaleString("es-PY"), bold: true },
      { label: "Monto recibido", value: order.amountPaid.toLocaleString("es-PY") },
      {
        label: order.balance > 0 ? "Saldo pendiente" : "Saldo",
        value: order.balance > 0 ? order.balance.toLocaleString("es-PY") : "Cero",
        bold: true,
        color: order.balance > 0 ? [220, 38, 38] : [22, 163, 74],
      },
    ];

    const boxH = totals.length * lineH + 8;
    doc.roundedRect(boxX, boxY, 80, boxH, 2, 2, "FD");

    boxY += 6;
    for (const row of totals) {
      doc.setFontSize(row.bold ? 10 : 8.5);
      doc.setFont("helvetica", row.bold ? "bold" : "normal");
      const [tr, tg, tb] = row.color ?? (row.bold ? [24, 24, 27] : [113, 113, 122]);
      doc.setTextColor(tr, tg, tb);
      doc.text(row.label, boxX + 4, boxY);
      doc.text(row.value, boxX + 76, boxY, { align: "right" });
      boxY += lineH;
    }

    // ── Footer ───────────────────────────────────────────────
    const footerY = doc.internal.pageSize.getHeight() - 10;
    doc.setDrawColor(228, 228, 231);
    doc.line(14, footerY - 4, pageW - 14, footerY - 4);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(161, 161, 170);
    doc.text("Generado con aotracker", 14, footerY);
    doc.text(new Date().toLocaleString("es-PY"), pageW - 14, footerY, { align: "right" });

    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    const filename = `arreglo-${order.customerName}-${date}.pdf`;
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      toast.error("No se pudo generar el PDF");
    } finally {
      setGeneratingPdf(false);
    }
    }, 0);
  }

  return (
    <div className="space-y-4 pt-2">
      <div className="flex gap-3">
        <Button onClick={handlePDF} variant="outline" disabled={generatingPdf}>
          <FileText className="h-4 w-4 mr-2" />
          {generatingPdf ? "Generando..." : "Descargar PDF"}
        </Button>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: "default" }))}
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Enviar por WhatsApp
        </a>
      </div>

      <Separator />

      <div className="flex gap-3">
        <LinkButton variant="outline" href={`/customers/${order.customerId}`}>
          Ver perfil de clienta
        </LinkButton>
        <LinkButton variant="ghost" href="/orders">
          Volver a notas
        </LinkButton>
      </div>
    </div>
  );
}
