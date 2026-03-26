import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

async function clearCollection(name: string) {
  const snap = await adminDb.collection(name).get();
  if (snap.empty) return;
  const refs = snap.docs.map((d) => d.ref);
  for (let i = 0; i < refs.length; i += 500) {
    const batch = adminDb.batch();
    refs.slice(i, i + 500).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
}

function calcMargin(cost: number, sale: number) {
  return ((sale - cost) / cost) * 100;
}

// ─── CUSTOMERS ───────────────────────────────────────────────────────────────

const CUSTOMERS = [
  { name: "María González",     whatsapp: "595981111001", nationalId: "1234567", address: "Av. España 1234, Asunción",         status: "active",   notes: "Clienta frecuente, paga siempre a tiempo" },
  { name: "Ana Ramírez",        whatsapp: "595982222002", nationalId: "2345678", address: "San Lorenzo, Barrio Obrero",        status: "active" },
  { name: "Laura Benítez",      whatsapp: "595983333003",                        address: "Fernando de la Mora",               status: "active",   notes: "Prefiere ropa talle grande" },
  { name: "Rosa Martínez",      whatsapp: "595984444004", nationalId: "4567890",                                               status: "active" },
  { name: "Carmen López",       whatsapp: "595985555005", nationalId: "5678901", address: "Luque, Centro",                    status: "inactive", notes: "Inactiva por deuda pendiente" },
  { name: "Sofía Aquino",       whatsapp: "595986666006", nationalId: "6789012", address: "Villa Elisa, Ruta 2 km 18",        status: "active" },
  { name: "Patricia Núñez",     whatsapp: "595987777007",                        address: "Capiatá, Barrio San Pedro",         status: "active",   notes: "Revende en su trabajo" },
  { name: "Verónica Giménez",   whatsapp: "595988888008", nationalId: "8901234",                                               status: "active" },
  { name: "Natalia Colmán",     whatsapp: "595989999009",                        address: "Lambaré, Calle Ytororó",            status: "active" },
  { name: "Claudia Fretes",     whatsapp: "595981010010", nationalId: "1011123", address: "Mariano Roque Alonso",             status: "active",   notes: "Prefiere jean y remeras" },
  { name: "Gabriela Villalba",  whatsapp: "595981111011",                                                                      status: "active" },
  { name: "Mónica Estigarribia",whatsapp: "595981212012", nationalId: "1213141", address: "Asunción, Villa Morra",            status: "active" },
  { name: "Sandra Duarte",      whatsapp: "595981313013",                        address: "Ñemby, Centro",                    status: "inactive" },
  { name: "Liliana Cáceres",    whatsapp: "595981414014", nationalId: "1415161", address: "Luque, Barrio San Juan",           status: "active" },
  { name: "Estela Paredes",     whatsapp: "595981515015",                                                                      status: "active",   notes: "Solo compra talles S y M" },
  { name: "Miriam Bobadilla",   whatsapp: "595981616016", nationalId: "1617181",                                               status: "active" },
  { name: "Andrea Centurión",   whatsapp: "595981717017",                        address: "San Antonio, Centro",              status: "active" },
  { name: "Diana Fleitas",      whatsapp: "595981818018", nationalId: "1819201", address: "Itauguá, Barrio Obrero",           status: "active" },
  { name: "Karina Sosa",        whatsapp: "595981919019",                                                                      status: "inactive", notes: "Devolvió mercadería sin avisar" },
  { name: "Celeste Morel",      whatsapp: "595982020020", nationalId: "2021221", address: "Caaguazú, Coronel Oviedo",         status: "active" },
  { name: "Vanesa Rojas",       whatsapp: "595982121021",                        address: "Encarnación, Centro",              status: "active" },
  { name: "Lorena Insfrán",     whatsapp: "595982222022", nationalId: "2223241", address: "Ciudad del Este, Barrio Santa Ana",status: "active" },
  { name: "Norma Valdez",       whatsapp: "595982323023",                                                                      status: "active" },
  { name: "Beatriz Ríos",       whatsapp: "595982424024", nationalId: "2425261", address: "Asunción, Barrio Jara",            status: "active",   notes: "Paga siempre en efectivo" },
  { name: "Elsa Cardozo",       whatsapp: "595982525025",                        address: "Coronel Oviedo, Centro",           status: "inactive" },
];

// ─── PRODUCTS ────────────────────────────────────────────────────────────────

const PRODUCTS = [
  // Blusas
  { code: "BLU-NK-S",  description: "Blusa deportiva manga corta",    brand: "Nike",     size: "S",  costPrice:  42000, salePrice:  80000 },
  { code: "BLU-NK-M",  description: "Blusa deportiva manga corta",    brand: "Nike",     size: "M",  costPrice:  42000, salePrice:  80000 },
  { code: "BLU-NK-L",  description: "Blusa deportiva manga corta",    brand: "Nike",     size: "L",  costPrice:  45000, salePrice:  85000 },
  { code: "BLU-ZR-S",  description: "Blusa lino estampada",           brand: "Zara",     size: "S",  costPrice:  55000, salePrice: 105000 },
  { code: "BLU-ZR-M",  description: "Blusa lino estampada",           brand: "Zara",     size: "M",  costPrice:  55000, salePrice: 105000 },
  // Remeras
  { code: "REM-AD-S",  description: "Remera algodón básica",          brand: "Adidas",   size: "S",  costPrice:  28000, salePrice:  55000 },
  { code: "REM-AD-M",  description: "Remera algodón básica",          brand: "Adidas",   size: "M",  costPrice:  28000, salePrice:  55000 },
  { code: "REM-AD-L",  description: "Remera algodón básica",          brand: "Adidas",   size: "L",  costPrice:  30000, salePrice:  58000 },
  { code: "REM-HM-XS", description: "Remera oversize print floral",   brand: "H&M",      size: "XS", costPrice:  32000, salePrice:  62000 },
  { code: "REM-HM-M",  description: "Remera oversize print floral",   brand: "H&M",      size: "M",  costPrice:  32000, salePrice:  62000 },
  // Pantalones
  { code: "PAN-KO-S",  description: "Pantalón jean skinny",           brand: "Kosiuko",  size: "S",  costPrice:  85000, salePrice: 160000 },
  { code: "PAN-KO-M",  description: "Pantalón jean skinny",           brand: "Kosiuko",  size: "M",  costPrice:  85000, salePrice: 160000 },
  { code: "PAN-KO-L",  description: "Pantalón jean skinny",           brand: "Kosiuko",  size: "L",  costPrice:  90000, salePrice: 170000 },
  { code: "PAN-ZR-S",  description: "Pantalón palazzo lino",          brand: "Zara",     size: "S",  costPrice:  75000, salePrice: 145000 },
  { code: "PAN-ZR-M",  description: "Pantalón palazzo lino",          brand: "Zara",     size: "M",  costPrice:  75000, salePrice: 145000 },
  // Vestidos
  { code: "VES-AK-S",  description: "Vestido casual verano floral",   brand: "Akiabara", size: "S",  costPrice:  65000, salePrice: 125000 },
  { code: "VES-AK-M",  description: "Vestido casual verano floral",   brand: "Akiabara", size: "M",  costPrice:  65000, salePrice: 125000 },
  { code: "VES-AK-L",  description: "Vestido casual verano floral",   brand: "Akiabara", size: "L",  costPrice:  68000, salePrice: 130000 },
  { code: "VES-ZR-M",  description: "Vestido midi satinado",          brand: "Zara",     size: "M",  costPrice:  95000, salePrice: 180000 },
  // Shorts
  { code: "SHO-NK-S",  description: "Short deportivo dri-fit",        brand: "Nike",     size: "S",  costPrice:  38000, salePrice:  72000 },
  { code: "SHO-NK-M",  description: "Short deportivo dri-fit",        brand: "Nike",     size: "M",  costPrice:  38000, salePrice:  72000 },
  // Calzado
  { code: "CAL-AD-36", description: "Zapatillas Ultraboost",          brand: "Adidas",   size: "36", costPrice: 180000, salePrice: 340000 },
  { code: "CAL-AD-38", description: "Zapatillas Ultraboost",          brand: "Adidas",   size: "38", costPrice: 180000, salePrice: 340000 },
  { code: "CAL-AD-40", description: "Zapatillas Ultraboost",          brand: "Adidas",   size: "40", costPrice: 185000, salePrice: 350000 },
  { code: "CAL-NK-37", description: "Zapatillas Air Max",             brand: "Nike",     size: "37", costPrice: 195000, salePrice: 370000 },
  { code: "CAL-NK-39", description: "Zapatillas Air Max",             brand: "Nike",     size: "39", costPrice: 195000, salePrice: 370000 },
  // Accesorios
  { code: "ACC-CAR-U", description: "Cartera cuero sintético",        brand: undefined,  size: undefined, costPrice: 45000, salePrice:  90000 },
  { code: "ACC-CIN-U", description: "Cinturón trenzado",              brand: undefined,  size: undefined, costPrice: 15000, salePrice:  32000 },
  { code: "ACC-ANT-U", description: "Anteojos de sol cat eye",        brand: undefined,  size: undefined, costPrice: 22000, salePrice:  48000 },
  { code: "ACC-VIN-U", description: "Vincha deportiva tela",          brand: "Nike",     size: undefined, costPrice:  8000, salePrice:  18000 },
];

// ─── SEED ────────────────────────────────────────────────────────────────────

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // 1. Clear existing data
  await Promise.all([
    clearCollection("customers"),
    clearCollection("products"),
    clearCollection("orders"),
  ]);

  const now = new Date();

  // 2. Insert customers — pre-generate refs so we can reference IDs later
  const customerRefs = CUSTOMERS.map(() => adminDb.collection("customers").doc());
  {
    const batch = adminDb.batch();
    CUSTOMERS.forEach((c, i) => {
      const { ...data } = c;
      batch.set(customerRefs[i], { ...data, createdAt: now });
    });
    await batch.commit();
  }

  // 3. Insert products — pre-generate refs
  const productRefs = PRODUCTS.map(() => adminDb.collection("products").doc());
  {
    const batch = adminDb.batch();
    PRODUCTS.forEach((p, i) => {
      const { brand, size, ...rest } = p;
      const data: Record<string, unknown> = {
        ...rest,
        margin: calcMargin(p.costPrice, p.salePrice),
        createdAt: now,
        updatedAt: now,
      };
      if (brand !== undefined) data.brand = brand;
      if (size !== undefined) data.size = size;
      batch.set(productRefs[i], data);
    });
    await batch.commit();
  }

  // Helper: pick a product snapshot by index
  function item(
    idx: number,
    deliveredQty: number,
    returnedQty: number
  ) {
    const p = PRODUCTS[idx];
    const soldQty = deliveredQty - returnedQty;
    const subtotal = soldQty * p.salePrice;
    return {
      id: productRefs[idx].id,
      productId: productRefs[idx].id,
      code: p.code,
      description: p.description,
      ...(p.size ? { size: p.size } : {}),
      salePrice: p.salePrice,
      deliveredQty,
      returnedQty,
      soldQty,
      subtotal,
    };
  }

  function buildPending(
    customerIdx: number,
    items: ReturnType<typeof item>[],
    createdDaysAgo: number,
    notes?: string
  ) {
    const totalDelivered = items.reduce((a, i) => a + i.deliveredQty, 0);
    const totalDue = items.reduce((a, i) => a + i.subtotal, 0);
    const createdAt = new Date(now);
    createdAt.setDate(createdAt.getDate() - createdDaysAgo);
    return {
      customerId: customerRefs[customerIdx].id,
      customerName: CUSTOMERS[customerIdx].name,
      status: "pending_settlement",
      items,
      totalDelivered,
      totalReturned: 0,
      totalSold: totalDelivered,
      totalDue,
      penalty: 0,
      grandTotal: totalDue,
      amountPaid: 0,
      balance: totalDue,
      ...(notes ? { notes } : {}),
      createdAt,
      settledAt: null,
    };
  }

  function buildSettled(
    customerIdx: number,
    items: ReturnType<typeof item>[],
    penalty: number,
    amountPaid: number,
    createdDaysAgo: number,
    settledDaysAgo: number,
    notes?: string
  ) {
    const totalDelivered = items.reduce((a, i) => a + i.deliveredQty, 0);
    const totalReturned = items.reduce((a, i) => a + i.returnedQty, 0);
    const totalSold = items.reduce((a, i) => a + i.soldQty, 0);
    const totalDue = items.reduce((a, i) => a + i.subtotal, 0);
    const grandTotal = totalDue + penalty;
    const balance = grandTotal - amountPaid;
    const status =
      balance === 0 ? "settled_zero_balance" : "settled_pending_balance";
    const createdAt = new Date(now);
    createdAt.setDate(createdAt.getDate() - createdDaysAgo);
    const settledAt = new Date(now);
    settledAt.setDate(settledAt.getDate() - settledDaysAgo);
    return {
      customerId: customerRefs[customerIdx].id,
      customerName: CUSTOMERS[customerIdx].name,
      status,
      items,
      totalDelivered,
      totalReturned,
      totalSold,
      totalDue,
      penalty,
      grandTotal,
      amountPaid,
      balance,
      ...(notes ? { notes } : {}),
      createdAt,
      settledAt,
    };
  }

  // 4. Build orders covering all statuses
  const orders = [
    // ── pending_settlement ─────────────────────────────────────────────────
    buildPending(0, [item(0, 3, 0), item(11, 2, 0), item(26, 1, 0)], 5),
    buildPending(1, [item(5, 4, 0), item(12, 1, 0)], 3, "Pidió que le reserve más talles"),
    buildPending(2, [item(16, 2, 0), item(17, 1, 0), item(27, 2, 0)], 7),
    buildPending(3, [item(21, 1, 0), item(22, 1, 0)], 2),
    buildPending(5, [item(3, 2, 0), item(8, 3, 0), item(28, 1, 0)], 10),
    buildPending(6, [item(6, 5, 0), item(18, 1, 0)], 1, "Primera nota de la clienta"),
    buildPending(7, [item(13, 2, 0), item(19, 2, 0)], 4),
    buildPending(9, [item(24, 1, 0), item(25, 1, 0), item(29, 3, 0)], 6),

    // ── settled_zero_balance ───────────────────────────────────────────────
    buildSettled(10, [item(0, 3, 1), item(5, 2, 0)], 0, 185000, 30, 25),
    buildSettled(11, [item(11, 2, 0), item(12, 1, 0), item(26, 1, 0)], 0, 490000, 45, 38),
    buildSettled(13, [item(16, 3, 1), item(27, 2, 1)], 0, 178000, 20, 15),
    buildSettled(14, [item(21, 2, 0), item(22, 1, 0), item(23, 1, 0)], 0, 1102000, 60, 55),
    buildSettled(15, [item(6, 4, 2), item(8, 2, 1)], 0, 148000, 25, 20),

    // ── settled_pending_balance ────────────────────────────────────────────
    buildSettled(16, [item(3, 3, 1), item(13, 1, 0)], 5000, 200000, 35, 28, "Quedó saldo por cobrar"),
    buildSettled(17, [item(18, 2, 0), item(19, 1, 0)], 0, 100000, 50, 44, "Pagó parte, prometió el resto"),
    buildSettled(19, [item(24, 2, 1), item(25, 1, 0)], 10000, 250000, 40, 33),
    buildSettled(20, [item(0, 5, 2), item(5, 3, 1)], 0, 150000, 55, 48),
    buildSettled(21, [item(11, 4, 1), item(16, 2, 0)], 15000, 300000, 28, 21, "Penalización por devolución tardía"),
  ];

  // 5. Insert orders (batch)
  const orderBatch = adminDb.batch();
  for (const order of orders) {
    const ref = adminDb.collection("orders").doc();
    orderBatch.set(ref, order);
  }
  await orderBatch.commit();

  return NextResponse.json({
    ok: true,
    cleared: ["customers", "products", "orders"],
    inserted: {
      customers: CUSTOMERS.length,
      products: PRODUCTS.length,
      orders: orders.length,
    },
  });
}
