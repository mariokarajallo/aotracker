"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { useScanningStore } from "../store/scanning.store";
import type { Order } from "@/types/order";
import type { OrderItem } from "@/types/order";

interface SettlementScannerProps {
  order: Order;
  onContinue: () => void;
}

const columnHelper = createColumnHelper<OrderItem>();

export function SettlementScanner({ order, onContinue }: SettlementScannerProps) {
  const scanInputRef = useRef<HTMLInputElement>(null);
  const [scanCode, setScanCode] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [scanning, setScanning] = useState(false);

  const { items, initializeFromOrder, addReturn, updateReturnQty, totalDue } = useScanningStore();

  useEffect(() => {
    initializeFromOrder(order.items);
    return () => {};
  }, [order.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const suggestions = scanCode.length > 1
    ? items.filter((i) =>
        i.returnedQty < i.deliveredQty &&
        (i.code.toLowerCase().includes(scanCode.toLowerCase()) ||
          i.description.toLowerCase().includes(scanCode.toLowerCase()))
      ).slice(0, 8)
    : [];

  const totalDelivered = items.reduce((acc, i) => acc + i.deliveredQty, 0);
  const totalReturned = items.reduce((acc, i) => acc + i.returnedQty, 0);
  const totalSold = items.reduce((acc, i) => acc + i.soldQty, 0);

  const handleScan = useCallback((code: string) => {
    if (!code.trim()) return;
    setScanning(true);
    try {
      const item = items.find((i) => i.code === code.trim());
      if (!item) {
        toast.error(`Producto no encontrado: ${code}`);
        setScanCode("");
        return;
      }

      if (item.returnedQty >= item.deliveredQty) {
        toast.warning(`${item.description} ya fue devuelto en su totalidad`);
        setScanCode("");
        return;
      }

      addReturn(item.productId);
      toast.success(`Devolución: ${item.description}`);
      setScanCode("");
    } finally {
      setScanning(false);
      scanInputRef.current?.focus();
    }
  }, [items, addReturn]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleScan(scanCode);
    }
  }

  const columns = [
    columnHelper.accessor("code", {
      header: "Código",
      cell: (info) => <span className="font-mono text-sm">{info.getValue()}</span>,
    }),
    columnHelper.accessor("description", {
      header: "Descripción",
    }),
    columnHelper.accessor("size", {
      header: "Talle",
      cell: (info) => info.getValue() ?? "—",
    }),
    columnHelper.accessor("salePrice", {
      header: () => <span className="text-right block">Precio</span>,
      cell: (info) => (
        <span className="text-right block">{info.getValue().toLocaleString("es-PY")}</span>
      ),
    }),
    columnHelper.accessor("deliveredQty", {
      header: () => <span className="text-center block">Entregado</span>,
      cell: (info) => <span className="text-center block">{info.getValue()}</span>,
    }),
    columnHelper.accessor("returnedQty", {
      header: () => <span className="text-center block">Devuelto</span>,
      cell: (info) => (
        <div className="flex justify-center">
          <Input
            type="number"
            min={0}
            max={info.row.original.deliveredQty}
            value={info.getValue()}
            onChange={(e) =>
              updateReturnQty(info.row.original.productId, parseInt(e.target.value) || 0)
            }
            className="w-16 text-center"
          />
        </div>
      ),
    }),
    columnHelper.accessor("soldQty", {
      header: () => <span className="text-center block">Vendido</span>,
      cell: (info) => (
        <span className="text-center block font-medium">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor("subtotal", {
      header: () => <span className="text-right block">Subtotal</span>,
      cell: (info) => (
        <span className="text-right block font-medium">
          {info.getValue().toLocaleString("es-PY")}
        </span>
      ),
    }),
  ];

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-6">
      {/* Scanner input */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            ref={scanInputRef}
            value={scanCode}
            onChange={(e) => { setScanCode(e.target.value); setShowSuggestions(true); }}
            onKeyDown={handleKeyDown}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Escaneá o escribí el código / descripción"
            disabled={scanning}
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 top-full mt-1 w-full border rounded-md bg-background shadow-md divide-y">
              {suggestions.map((item) => (
                <button
                  key={item.productId}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                  onMouseDown={() => {
                    handleScan(item.code);
                    setShowSuggestions(false);
                  }}
                >
                  <span className="font-mono text-xs text-muted-foreground mr-2">{item.code}</span>
                  {item.description}
                  {item.size && <span className="text-muted-foreground ml-1">· {item.size}</span>}
                  <span className="float-right text-muted-foreground">
                    {item.returnedQty}/{item.deliveredQty} devuelto
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleScan(scanCode)}
          disabled={scanning || !scanCode.trim()}
        >
          Registrar
        </Button>
      </div>

      {/* Mobile items */}
      <div className="sm:hidden space-y-2">
        {items.map((item) => (
          <div key={item.productId} className="border rounded-lg p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{item.description}</p>
                <p className="font-mono text-xs text-muted-foreground">{item.code}{item.size ? ` · ${item.size}` : ""}</p>
              </div>
              <span className="text-sm font-medium shrink-0">{item.subtotal.toLocaleString("es-PY")}</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">Entregado: <strong>{item.deliveredQty}</strong></span>
              <span className="text-muted-foreground">Vendido: <strong className="text-primary">{item.soldQty}</strong></span>
              <div className="flex items-center gap-1 ml-auto">
                <span className="text-muted-foreground text-xs">Dev:</span>
                <Input
                  type="number"
                  min={0}
                  max={item.deliveredQty}
                  value={item.returnedQty}
                  onChange={(e) => updateReturnQty(item.productId, parseInt(e.target.value) || 0)}
                  className="w-14 text-center h-8 text-sm"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop items */}
      <div className="hidden sm:block border rounded-md overflow-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Separator />

      {/* Totals */}
      <div className="grid grid-cols-3 gap-4 text-center text-sm">
        <div>
          <p className="text-muted-foreground">Entregado</p>
          <p className="text-xl font-bold">{totalDelivered}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Devuelto</p>
          <p className="text-xl font-bold">{totalReturned}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Vendido</p>
          <p className="text-xl font-bold text-primary">{totalSold}</p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Total a cobrar:{" "}
          <Badge variant="secondary" className="text-base font-bold">
            {totalDue().toLocaleString("es-PY")}
          </Badge>
        </div>
        <Button onClick={onContinue}>
          {totalSold === 0 ? "Cerrar arreglo (devolvió todo)" : "Continuar al cobro →"}
        </Button>
      </div>
    </div>
  );
}
