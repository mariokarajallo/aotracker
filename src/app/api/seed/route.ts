import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const customers = [
  {
    name: "María González",
    whatsapp: "595981111001",
    nationalId: "1234567",
    address: "Av. España 1234, Asunción",
    status: "active",
    notes: "Clienta frecuente, paga siempre a tiempo",
  },
  {
    name: "Ana Ramírez",
    whatsapp: "595982222002",
    nationalId: "2345678",
    address: "San Lorenzo, Barrio Obrero",
    status: "active",
  },
  {
    name: "Laura Benítez",
    whatsapp: "595983333003",
    address: "Fernando de la Mora",
    status: "active",
    notes: "Prefiere ropa talle grande",
  },
  {
    name: "Rosa Martínez",
    whatsapp: "595984444004",
    nationalId: "4567890",
    status: "active",
  },
  {
    name: "Carmen López",
    whatsapp: "595985555005",
    nationalId: "5678901",
    address: "Luque, Centro",
    status: "inactive",
    notes: "Inactiva por deuda pendiente",
  },
];

function margin(cost: number, sale: number) {
  return ((sale - cost) / cost) * 100;
}

const products = [
  { code: "BLU-001-S", description: "Blusa floral manga corta", size: "S", costPrice: 35000, salePrice: 65000 },
  { code: "BLU-001-M", description: "Blusa floral manga corta", size: "M", costPrice: 35000, salePrice: 65000 },
  { code: "BLU-001-L", description: "Blusa floral manga corta", size: "L", costPrice: 38000, salePrice: 70000 },
  { code: "PAN-002-S", description: "Pantalón jean skinny", size: "S", costPrice: 80000, salePrice: 150000 },
  { code: "PAN-002-M", description: "Pantalón jean skinny", size: "M", costPrice: 80000, salePrice: 150000 },
  { code: "PAN-002-L", description: "Pantalón jean skinny", size: "L", costPrice: 85000, salePrice: 160000 },
  { code: "VES-003-S", description: "Vestido casual verano", size: "S", costPrice: 60000, salePrice: 115000 },
  { code: "VES-003-M", description: "Vestido casual verano", size: "M", costPrice: 60000, salePrice: 115000 },
  { code: "CAR-004-U", description: "Cartera de cuero sintético", size: undefined, costPrice: 45000, salePrice: 90000 },
  { code: "CIN-005-U", description: "Cinturón tejido", size: undefined, costPrice: 15000, salePrice: 35000 },
];

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const batch = adminDb.batch();
  const now = FieldValue.serverTimestamp();

  for (const customer of customers) {
    const ref = adminDb.collection("customers").doc();
    batch.set(ref, { ...customer, createdAt: now });
  }

  for (const { size, ...product } of products) {
    const ref = adminDb.collection("products").doc();
    const data: Record<string, unknown> = {
      ...product,
      margin: margin(product.costPrice, product.salePrice),
      createdAt: now,
      updatedAt: now,
    };
    if (size !== undefined) data.size = size;
    batch.set(ref, data);
  }

  await batch.commit();

  return NextResponse.json({
    ok: true,
    inserted: { customers: customers.length, products: products.length },
  });
}
