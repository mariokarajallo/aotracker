"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LinkButton } from "@/components/link-button";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { customerSchema, type CustomerFormValues } from "../schemas/customer.schema";
import { createCustomerAction, updateCustomerAction } from "@/lib/actions/customers";
import type { Customer } from "@/types/customer";

interface CustomerFormProps {
  customer?: Customer;
}

export function CustomerForm({ customer }: CustomerFormProps) {
  const router = useRouter();
  const isEditing = !!customer;

  const [values, setValues] = useState<CustomerFormValues>({
    name: customer?.name ?? "",
    whatsapp: customer?.whatsapp ?? "",
    nationalId: customer?.nationalId ?? "",
    address: customer?.address ?? "",
    notes: customer?.notes ?? "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerFormValues, string>>>({});
  const [saving, setSaving] = useState(false);

  function handleChange(field: keyof CustomerFormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = customerSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: typeof errors = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof CustomerFormValues;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSaving(true);
    try {
      if (isEditing) {
        await updateCustomerAction(customer.id, result.data);
        toast.success("Clienta actualizada correctamente");
      } else {
        await createCustomerAction(result.data);
        toast.success("Clienta creada correctamente");
      }
      router.refresh();
      router.push("/customers");
    } catch (error) {
      console.error("Error saving customer:", error);
      toast.error("Ocurrió un error. Intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="max-w-lg w-full">
      <CardHeader>
        <CardTitle>{isEditing ? "Editar Clienta" : "Nueva Clienta"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">Nombre completo *</Label>
            <Input
              id="name"
              value={values.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Nombre y apellido"
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="whatsapp">WhatsApp *</Label>
            <Input
              id="whatsapp"
              value={values.whatsapp}
              onChange={(e) => handleChange("whatsapp", e.target.value)}
              placeholder="+595 981 000000"
            />
            {errors.whatsapp && <p className="text-sm text-destructive">{errors.whatsapp}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="nationalId">Cédula de identidad</Label>
            <Input
              id="nationalId"
              value={values.nationalId}
              onChange={(e) => handleChange("nationalId", e.target.value)}
              placeholder="1.234.567"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              value={values.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="Calle, número, barrio"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={values.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Observaciones adicionales..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear clienta"}
            </Button>
            <LinkButton variant="outline" href="/customers">Cancelar</LinkButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
