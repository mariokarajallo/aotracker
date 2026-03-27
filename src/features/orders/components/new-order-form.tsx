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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, ScanBarcode, Pencil } from "lucide-react";
import { createOrderAction } from "@/lib/actions/orders";
import { quickAddProductAction } from "@/lib/actions/products";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { formatMoneyInput, parseMoney } from "@/lib/utils";
import type { Customer } from "@/types/customer";
import type { Product } from "@/types/product";
import type { OrderItem } from "@/types/order";

interface NewOrderFormProps {
  initialCustomers: Customer[];
  initialProducts: Product[];
  initialCustomerId?: string;
}

export function NewOrderForm({ initialCustomers, initialProducts, initialCustomerId }: NewOrderFormProps) {
  const router = useRouter();
  const scanInputRef = useRef<HTMLInputElement>(null);

  const [customers] = useState<Customer[]>(initialCustomers);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    () => initialCustomerId ? (initialCustomers.find((c) => c.id === initialCustomerId) ?? null) : null
  );
  const [customerSearch, setCustomerSearch] = useState("");
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [scanCode, setScanCode] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Quick-add product dialog
  const [unknownCode, setUnknownCode] = useState<string | null>(null);
  const [quickDesc, setQuickDesc] = useState("");
  const [quickSize, setQuickSize] = useState("");
  const [quickPriceInput, setQuickPriceInput] = useState("");
  const [quickSaving, setQuickSaving] = useState(false);
  const [quickErrors, setQuickErrors] = useState<{ description?: string; salePrice?: string }>({});

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

  function addProductToItems(product: Product) {
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
      return [...prev, {
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
      }];
    });
  }

  const handleScan = useCallback(async (code: string) => {
    if (!code.trim()) return;
    setScanning(true);
    try {
      const product = products.find((p) => p.code === code.trim()) ?? null;
      if (!product) {
        setUnknownCode(code.trim());
        setQuickDesc("");
        setQuickSize("");
        setQuickPriceInput("");
        setQuickErrors({});
        setScanCode("");
        return;
      }

      addProductToItems(product);
      toast.success(`${product.description} agregado`);
      setScanCode("");
    } catch {
      toast.error("Error al buscar el producto");
    } finally {
      setScanning(false);
      scanInputRef.current?.focus();
    }
  }, [products]);

  async function handleQuickAdd() {
    const errors: typeof quickErrors = {};
    if (!quickDesc.trim()) errors.description = "La descripción es requerida";
    const price = parseMoney(quickPriceInput);
    if (!price || price <= 0) errors.salePrice = "El precio de venta es requerido";
    if (Object.keys(errors).length > 0) { setQuickErrors(errors); return; }

    setQuickSaving(true);
    try {
      const newProduct = await quickAddProductAction({
        code: unknownCode!,
        description: quickDesc.trim(),
        salePrice: price,
        ...(quickSize.trim() ? { size: quickSize.trim() } : {}),
      });
      setProducts((prev) => [...prev, newProduct]);
      addProductToItems(newProduct);
      setUnknownCode(null);
      toast.success(`${newProduct.description} creado y agregado a la nota`);
    } catch {
      toast.error("Error al crear el producto");
    } finally {
      setQuickSaving(false);
    }
  }

  function handleScanKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleScan(scanCode);
    }
  }

  function updateQty(id: string, qty: number) {
    if (!Number.isFinite(qty) || qty < 1) return;
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
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setCameraOpen(true)}
                title="Escanear con cámara"
              >
                <ScanBarcode className="size-4" />
              </Button>
            </div>

            {cameraOpen && (
              <BarcodeScanner
                onScan={(code) => {
                  handleScan(code);
                  // Scanner queda abierto para seguir escaneando
                }}
                onClose={() => setCameraOpen(false)}
              />
            )}

            {/* Quick-add product dialog */}
            <Dialog open={!!unknownCode} onOpenChange={(open) => { if (!open) setUnknownCode(null); }}>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Producto no encontrado</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
                  El código <span className="font-mono font-semibold text-foreground">{unknownCode}</span> no está en el catálogo. Completá los datos para agregarlo.
                </p>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label>Código</Label>
                    <Input value={unknownCode ?? ""} disabled />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="quick-desc">Descripción *</Label>
                    <Input
                      id="quick-desc"
                      value={quickDesc}
                      onChange={(e) => { setQuickDesc(e.target.value); setQuickErrors((p) => ({ ...p, description: undefined })); }}
                      placeholder="Nombre del producto"
                      autoFocus
                    />
                    {quickErrors.description && <p className="text-xs text-destructive">{quickErrors.description}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="quick-size">Talle</Label>
                    <Input
                      id="quick-size"
                      value={quickSize}
                      onChange={(e) => setQuickSize(e.target.value)}
                      placeholder="S, M, L, 38..."
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="quick-price">Precio de venta *</Label>
                    <Input
                      id="quick-price"
                      type="text"
                      inputMode="numeric"
                      value={quickPriceInput}
                      onChange={(e) => { setQuickPriceInput(formatMoneyInput(e.target.value)); setQuickErrors((p) => ({ ...p, salePrice: undefined })); }}
                      placeholder="0"
                    />
                    {quickErrors.salePrice && <p className="text-xs text-destructive">{quickErrors.salePrice}</p>}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">El costo y otros datos se pueden completar después desde el catálogo.</p>
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setUnknownCode(null)} disabled={quickSaving}>
                    Cancelar
                  </Button>
                  <Button onClick={handleQuickAdd} disabled={quickSaving}>
                    {quickSaving ? "Guardando..." : "Agregar producto"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

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
                      <span className="text-muted-foreground">{item.salePrice.toLocaleString("es-PY")} ×</span>
                      <div className="flex items-center gap-1">
                        {editingItemId === item.id ? (
                          <Input
                            type="number"
                            min={1}
                            defaultValue={item.deliveredQty}
                            autoFocus
                            className="w-16 text-center"
                            onBlur={(e) => {
                              const v = parseInt(e.target.value);
                              if (Number.isFinite(v) && v >= 1) updateQty(item.id, v);
                              setEditingItemId(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                            }}
                          />
                        ) : (
                          <>
                            <span className="w-8 text-center font-semibold">{item.deliveredQty}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              onClick={() => setEditingItemId(item.id)}
                            >
                              <Pencil className="size-3" />
                            </Button>
                          </>
                        )}
                      </div>
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
                          <div className="flex items-center justify-center gap-1">
                            {editingItemId === item.id ? (
                              <Input
                                type="number"
                                min={1}
                                defaultValue={item.deliveredQty}
                                autoFocus
                                className="w-16 text-center"
                                onBlur={(e) => {
                                  const v = parseInt(e.target.value);
                                  if (Number.isFinite(v) && v >= 1) updateQty(item.id, v);
                                  setEditingItemId(null);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                                }}
                              />
                            ) : (
                              <>
                                <span className="font-semibold">{item.deliveredQty}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="size-7"
                                  onClick={() => setEditingItemId(item.id)}
                                >
                                  <Pencil className="size-3" />
                                </Button>
                              </>
                            )}
                          </div>
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
