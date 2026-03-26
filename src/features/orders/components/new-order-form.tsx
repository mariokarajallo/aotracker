"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/link-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Trash2 } from "lucide-react";
import { createOrderAction } from "@/lib/actions/orders";
import type { Customer } from "@/types/customer";
import type { Product } from "@/types/product";
import type { OrderItem } from "@/types/order";

interface NewOrderFormProps {
  initialCustomers: Customer[];
  initialProducts: Product[];
}

export function NewOrderForm({ initialCustomers, initialProducts }: NewOrderFormProps) {
  const router = useRouter();
  const scanInputRef = useRef<HTMLInputElement>(null);

  const [customers] = useState<Customer[]>(initialCustomers);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [products] = useState<Product[]>(initialProducts);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [scanCode, setScanCode] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);

  const suggestions = scanCode.length > 1
    ? products.filter((p) =>
        p.code.toLowerCase().includes(scanCode.toLowerCase()) ||
        p.description.toLowerCase().includes(scanCode.toLowerCase())
      ).slice(0, 8)
    : [];

  const filteredCustomers = customerSearch.length > 1
    ? customers.filter((c) =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase())
      )
    : [];

  const totalDelivered = items.reduce((acc, i) => acc + i.deliveredQty, 0);
  const totalDue = items.reduce((acc, i) => acc + i.subtotal, 0);

  const handleScan = useCallback(async (code: string) => {
    if (!code.trim()) return;
    setScanning(true);
    try {
      const product = products.find((p) => p.code === code.trim()) ?? null;
      if (!product) {
        toast.error(`Producto no encontrado: ${code}`);
        setScanCode("");
        return;
      }

      setItems((prev) => {
        const existing = prev.find((i) => i.productId === product.id);
        if (existing) {
          return prev.map((i) =>
            i.productId === product.id
              ? {
                  ...i,
                  deliveredQty: i.deliveredQty + 1,
                  soldQty: i.deliveredQty + 1,
                  subtotal: (i.deliveredQty + 1) * i.salePrice,
                }
              : i
          );
        }
        const newItem: OrderItem = {
          id: crypto.randomUUID(),
          productId: product.id,
          code: product.code,
          description: product.description,
          ...(product.size !== undefined && { size: product.size }),
          salePrice: product.salePrice,
          deliveredQty: 1,
          returnedQty: 0,
          soldQty: 1,
          subtotal: product.salePrice,
        };
        return [...prev, newItem];
      });

      toast.success(`${product.description} agregado`);
      setScanCode("");
    } catch {
      toast.error("Error al buscar el producto");
    } finally {
      setScanning(false);
      scanInputRef.current?.focus();
    }
  }, [products]);

  function handleScanKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleScan(scanCode);
    }
  }

  function updateQty(id: string, qty: number) {
    if (qty < 1) return;
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, deliveredQty: qty, soldQty: qty, subtotal: qty * i.salePrice }
          : i
      )
    );
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  async function handleSubmit() {
    if (!selectedCustomer) {
      toast.error("Seleccioná una clienta");
      return;
    }
    if (items.length === 0) {
      toast.error("Agregá al menos una prenda");
      return;
    }

    setSaving(true);
    try {
      const orderId = await createOrderAction({
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        items,
      });
      toast.success("Nota creada correctamente");
      router.push(`/orders/${orderId}`);
    } catch (err) {
      console.error("Error al crear la nota:", err);
      toast.error("Error al crear la nota");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl w-full">
      {/* Step 1: Select customer */}
      <Card>
        <CardHeader>
          <CardTitle>1. Seleccionar clienta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {selectedCustomer ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{selectedCustomer.name}</p>
                <p className="text-sm text-muted-foreground">{selectedCustomer.whatsapp}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setSelectedCustomer(null)}>
                Cambiar
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Buscar clienta</Label>
              <Input
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Escribí el nombre..."
              />
              {filteredCustomers.length > 0 && (
                <div className="border rounded-md divide-y">
                  {filteredCustomers.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                      onClick={() => {
                        setSelectedCustomer(c);
                        setCustomerSearch("");
                      }}
                    >
                      {c.name}
                      <span className="text-muted-foreground ml-2">{c.whatsapp}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Scan items */}
      <Card>
        <CardHeader>
          <CardTitle>2. Escanear prendas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <div className="flex gap-2">
              <Input
                ref={scanInputRef}
                value={scanCode}
                onChange={(e) => { setScanCode(e.target.value); setShowSuggestions(true); }}
                onKeyDown={handleScanKeyDown}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Escaneá o escribí el código / descripción"
                disabled={scanning}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => handleScan(scanCode)}
                disabled={scanning || !scanCode.trim()}
              >
                Agregar
              </Button>
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <div className="border rounded-md divide-y">
                {suggestions.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                    onMouseDown={() => {
                      handleScan(p.code);
                      setShowSuggestions(false);
                    }}
                  >
                    <span className="font-mono text-xs text-muted-foreground mr-2">{p.code}</span>
                    {p.description}
                    {p.size && <span className="text-muted-foreground ml-1">· {p.size}</span>}
                    <span className="float-right text-muted-foreground">{p.salePrice.toLocaleString("es-PY")}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {items.length > 0 && (
            <>
              <Separator />
              {/* Mobile items */}
              <div className="sm:hidden space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{item.description}</p>
                        <p className="font-mono text-xs text-muted-foreground">{item.code}{item.size ? ` · ${item.size}` : ""}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-muted-foreground">{item.salePrice.toLocaleString("es-PY")} × </span>
                      <Input
                        type="number"
                        min={1}
                        value={item.deliveredQty}
                        onChange={(e) => updateQty(item.id, parseInt(e.target.value))}
                        className="w-16 text-center"
                      />
                      <span className="font-medium ml-auto">{item.subtotal.toLocaleString("es-PY")}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop items */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Talle</TableHead>
                      <TableHead className="text-right">Precio</TableHead>
                      <TableHead className="text-center">Cant.</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                      <TableHead className="w-8" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-sm">{item.code}</TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.size ?? "—"}</TableCell>
                        <TableCell className="text-right">
                          {item.salePrice.toLocaleString("es-PY")}
                        </TableCell>
                        <TableCell className="text-center">
                          <Input
                            type="number"
                            min={1}
                            value={item.deliveredQty}
                            onChange={(e) => updateQty(item.id, parseInt(e.target.value))}
                            className="w-16 text-center mx-auto"
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {item.subtotal.toLocaleString("es-PY")}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Separator />
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">
                  Total prendas: <Badge variant="secondary">{totalDelivered}</Badge>
                </span>
                <span className="font-bold text-base">
                  Total: {totalDue.toLocaleString("es-PY")}
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={handleSubmit} disabled={saving || !selectedCustomer || items.length === 0}>
          {saving ? "Creando nota..." : "Crear nota y generar pagaré"}
        </Button>
        <LinkButton variant="outline" href="/orders">Cancelar</LinkButton>
      </div>
    </div>
  );
}
