# PDR — Product Design Requirements
## aotracker — Sistema de Liquidación de Mercaderías

**Versión:** 1.0.0
**Fecha:** 25 de marzo de 2026
**Estado:** Borrador inicial

---

## Índice

1. [Visión del Producto](#1-visión-del-producto)
2. [Usuarios y Roles](#2-usuarios-y-roles)
3. [Flujos Principales](#3-flujos-principales)
4. [Funcionalidades Requeridas](#4-funcionalidades-requeridas)
5. [Requisitos No Funcionales](#5-requisitos-no-funcionales)
6. [Stack Tecnológico](#6-stack-tecnológico)
7. [Restricciones y Supuestos](#7-restricciones-y-supuestos)
8. [Métricas de Éxito](#8-métricas-de-éxito)

---

## 1. Visión del Producto

### 1.1 Descripción General

**aotracker** es una Progressive Web App (PWA) diseñada para modernizar y automatizar el proceso de liquidación de mercaderías en negocios de reventa. Reemplaza las planillas manuales en papel o Excel por un sistema digital ágil optimizado para tablets, con integración de escaneo de códigos de barras para registrar devoluciones en tiempo real.

### 1.2 Problema que Resuelve

El proceso actual de liquidación entre una administradora y sus revendedoras es:

- **Lento y propenso a errores**: Se realiza manualmente con planillas, calculadoras y anotaciones a mano.
- **Ineficiente en el cálculo**: Los precios unitarios, ganancias y totales se calculan uno por uno, generando errores humanos.
- **Sin trazabilidad**: No existe registro digital de las devoluciones ni historial de liquidaciones por revendedora.
- **Difícil de compartir**: Los comprobantes finales se generan a mano o no se generan, dificultando el cierre formal de cada liquidación.

### 1.3 Propuesta de Valor

aotracker convierte una reunión de liquidación en un flujo guiado y digital:

1. La administradora abre la app en la tablet.
2. Escanea cada producto devuelto con la cámara.
3. El sistema calcula al instante precios, ganancias y total a cobrar.
4. Al cerrar, genera un comprobante PDF listo para compartir por WhatsApp.

**Resultado**: liquidaciones más rápidas, sin errores, con comprobante formal y registro histórico completo.

### 1.4 Usuarios Objetivo

| Usuario | Descripción |
|---|---|
| **Administradora** | Dueña o gestora del negocio de reventa. Opera la app durante las reuniones de liquidación con sus revendedoras. |
| **Revendedoras** | Clientes que venden productos y deben rendir cuentas periódicamente. No operan la app directamente. |

### 1.5 Plataformas Soportadas

| Plataforma | Prioridad | Notas |
|---|---|---|
| **Tablet (Android / iPad)** | Primaria | Experiencia optimizada, instalable como PWA, escaneo por cámara trasera |
| **Web (desktop)** | Primaria | Accesible desde navegador sin instalación, misma funcionalidad completa |
| **Móvil (Android / iOS)** | Secundaria | Soporte para administradora únicamente. UX adaptada, cámara del teléfono funcional para escanear. No es el foco de diseño. |

---

## 2. Usuarios y Roles

### 2.1 Roles del Sistema

Por el alcance actual del MVP, el sistema tiene un único rol activo en la aplicación:

#### Rol: Administradora

Es el único usuario con acceso a la plataforma. Gestiona la totalidad del sistema.

**Capacidades:**

| Capacidad | Descripción |
|---|---|
| Autenticación segura | Inicia sesión con Clerk (email/contraseña o social login) |
| Gestión de revendedoras | Crear, editar, desactivar revendedoras |
| Gestión de productos | Registrar productos con código de barras, nombre, precio de costo y precio de venta |
| Iniciar liquidación | Crear una nueva sesión de liquidación para una revendedora |
| Escanear devoluciones | Usar la cámara de la tablet para escanear códigos de barras |
| Edición manual de ítems | Ajustar cantidades o agregar ítems sin escáner |
| Calcular totales | Ver en tiempo real el resumen de la liquidación |
| Cerrar liquidación | Finalizar y bloquear una liquidación para edición |
| Generar comprobante | Exportar PDF de la liquidación y compartir por WhatsApp |
| Historial | Consultar liquidaciones pasadas por revendedora |

### 2.2 Revendedoras (Entidad, no usuario)

Las revendedoras no tienen acceso a la aplicación. Son **entidades del sistema** sobre las cuales se crean liquidaciones. Reciben el comprobante vía WhatsApp como resultado del proceso.

**Datos de una revendedora:**

| Campo | Tipo | Requerido |
|---|---|---|
| Nombre completo | Texto | Sí |
| Número de WhatsApp | Teléfono | Sí |
| Cédula de identidad | Texto | No |
| Dirección | Texto | No |
| Estado (activa/inactiva) | Booleano | Sí |
| Fecha de alta | Fecha | Sí (auto) |
| Notas adicionales | Texto libre | No |

---

## 3. Flujos Principales

### 3.1 Flujo 1: Autenticación

```
[Pantalla de login] → Ingresa credenciales (Clerk)
    ↓
[Verificación] → Éxito → [Dashboard principal]
    ↓
Error → Mensaje de error → Reintentar
```

**Consideraciones:**
- Clerk maneja la autenticación completa incluyendo recupero de contraseña.
- Sesión persistente en el dispositivo (no debe loguearse en cada visita).
- Soporte para biometría si el navegador/dispositivo lo permite.
- Ninguna pantalla es accesible sin sesión activa.

---

### 3.2 Flujo 2: Gestión de Catálogo (Productos)

```
[Dashboard] → "Catálogo" → "Nuevo Producto"
    ↓
[Opción A] Escanear código de barras → Cámara activa → Código capturado
[Opción B] Ingresar código manualmente (ej. RD00278)
    ↓
[Formulario]
    → Código de producto
    → Descripción / nombre
    → Talle (opcional)
    → Precio de costo (solo visible para la administradora)
    → Precio de venta (el que ve/paga la revendedora)
    ↓
[Sistema calcula y guarda internamente]
    → ganancia_unitaria = precio_venta - precio_costo
    → margen (%) = (ganancia_unitaria / precio_costo) × 100
    ↓
[Guardar] → Producto disponible para escanear en notas
```

**Reglas de visibilidad de precios:**
- El precio de costo y el margen de ganancia son **exclusivos de la administradora**.
- La revendedora solo ve el **precio de venta** en los comprobantes y comunicaciones.

---

### 3.3 Flujo 3: Salida de Mercadería (Entrega a Revendedora)

Este flujo registra la mercadería que una revendedora se lleva para vender.

```
[Dashboard] → "Nueva Nota de Salida"
    ↓
[Paso 1: Seleccionar clienta]
    → Buscar por nombre → Seleccionar → Confirmar
    ↓
[Paso 2: Escaneo de prendas que lleva]
    → Activar cámara / escáner BT
    → Escanear código de barras de cada prenda
    → Sistema busca producto en catálogo
        ├─ Encontrado → Agrega ítem con cantidad 1
        │               Si ya existe → incrementa cantidad
        └─ No encontrado → Alerta: "Producto no registrado"
                           Opción: registrar en el momento
    → Repetir para cada prenda
    ↓
[Paso 3: Revisión de tabla de salida]
    → Lista de productos: código, descripción, talle, cantidad, precio de venta, subtotal
    → Editar cantidades / eliminar ítems si es necesario
    ↓
[Paso 4: Resumen de salida]
    → Total de prendas
    → Valor total a precio de venta (base para el pagaré)
    → Confirmar nota
    ↓
[Paso 5: Generación de pagaré]
    → El sistema genera un documento con el detalle de lo que lleva
    → La clienta firma el pagaré (documento físico o digital)
    → La nota queda guardada con estado: "Aguardando acerto"
```

---

### 3.4 Flujo 4: Retorno y Arreglo (El "Acerto" Quincenal)

Cada ~15 días la revendedora vuelve, devuelve lo que no vendió y paga lo que vendió.

```
[Dashboard] → "Arreglos pendientes" → Buscar nota "Aguardando acerto" de la clienta
    ↓
[Paso 1: Apertura del arreglo]
    → Se carga la nota original con todas las prendas entregadas
    ↓
[Paso 2: Escaneo de devoluciones]
    → Escanear cada prenda que devuelve la clienta
    → La tabla (Zustand + TanStack Table) actualiza en tiempo real:
        - Resta del stock llevado las prendas devueltas
        - Calcula prendas vendidas = llevadas - devueltas
        - Calcula total a pagar = prendas vendidas × precio de venta
    ↓
[Paso 3: Revisión en tiempo real]
    → Tabla muestra: llevadas / devueltas / vendidas / precio unit. / subtotal
    → Edición manual de cantidades si es necesario
```

---

### 3.5 Flujo 5: Cobro, Saldos y Multas

```
[Continuación del Flujo 4]
    ↓
[Pantalla de cobro]
    → Resumen: total mercadería vendida
    → Campo manual: "Multa / Recargo" (ingreso libre en número)
        → La multa suma al total sin lógica automática de fechas
        → Solo la administradora decide si aplica y cuánto
    → Total final = mercadería vendida + multa aplicada
    → Campo: "Monto recibido" → ingresar cuánto entrega la clienta
    ↓
[Sistema evalúa]
    ├─ Escenario A — Pago total
    │   → Monto recibido >= Total final
    │   → Nota se cierra: estado "Acerto efetuado - Saldo cero"
    │   → Se devuelve el pagaré a la clienta
    │
    └─ Escenario B — Pago parcial
        → Monto recibido < Total final
        → Saldo pendiente = Total final - Monto recibido
        → Nota cambia a estado "Acerto efetuado - Saldo pendiente"
        → Se retiene el pagaré hasta que salde la deuda
        → El saldo queda registrado y visible en el perfil de la clienta
```

---

### 3.6 Flujo 6: Cierre y Comunicación (WhatsApp)

```
[Pantalla de cobro] → "Concluir arreglo"
    ↓
[Sistema genera resumen del acerto]
    → Prendas entregadas originalmente
    → Prendas devueltas
    → Prendas vendidas
    → Total mercadería vendida (precio de venta, sin costos)
    → Multa aplicada (si corresponde)
    → Total final
    → Monto recibido
    → Saldo pendiente (si corresponde)
    ↓
[Opciones de exportación]
    ├─ Generar PDF → Comprobante completo descargable
    └─ Enviar por WhatsApp → Abre enlace wa.me con texto preformateado
        (el texto incluye el resumen completo listo para pegar)
```

**Nota de privacidad:** El comprobante enviado a la revendedora **nunca incluye** precio de costo ni margen de ganancia. Solo muestra precios de venta y totales.

---

### 3.7 Flujo 7: Consulta de Historial y Estado de Cuenta

```
[Dashboard] → "Clientas" → Seleccionar clienta
    ↓
[Perfil de clienta]
    → Datos personales
    → Saldo pendiente actual (si tiene deuda)
    → Historial de notas: fecha, estado, total, saldo
    ↓
[Seleccionar nota] → Ver detalle completo + opción de re-generar comprobante
    ↓
[Enviar estado de cuenta por WhatsApp]
    → Resumen de deuda actual + historial reciente
    → Texto preformateado listo para enviar
```

---

## 4. Funcionalidades Requeridas

### 4.1 MVP — Must Have (Lanzamiento inicial)

Estas funcionalidades son innegociables para que el producto cumpla su propósito mínimo.

| # | Funcionalidad | Descripción |
|---|---|---|
| M1 | Autenticación con Clerk | Login seguro para la administradora |
| M2 | CRUD de clientas | Gestión completa con nombre, WhatsApp, cédula, dirección y notas |
| M3 | CRUD de catálogo | Productos con código, descripción, talle, precio costo, precio venta y margen interno |
| M4 | Escaneo por cámara | Tablet, móvil y webcam desktop. Códigos QR y 1D (EAN-13, Code128) |
| M5 | Nota de salida | Seleccionar clienta + escanear prendas que se lleva |
| M6 | Generación de pagaré PDF | Documento con el detalle de lo entregado para firma de la clienta |
| M7 | Estado "Aguardando acerto" | Notas abiertas visibles y gestionables desde el dashboard |
| M8 | Arreglo quincenal | Abrir nota pendiente y escanear devoluciones con cálculo en tiempo real |
| M9 | Cálculo en tiempo real | Llevadas / devueltas / vendidas / total a pagar actualizado en cada escaneo |
| M10 | Pantalla de cobro con multa manual | Campo libre para ingresar recargo/multa que suma al total |
| M11 | Pago total | Cierre de nota, saldo cero, devolución de pagaré |
| M12 | Pago parcial | Saldo pendiente registrado, nota "Acerto efetuado", pagaré retenido |
| M13 | Comprobante PDF de cierre | Sin exponer precio de costo ni margen de ganancia |
| M14 | Envío por WhatsApp | Texto preformateado con resumen del arreglo listo para enviar |
| M15 | Perfil de clienta con saldo | Vista del saldo pendiente actual de cada clienta |
| M16 | Soporte offline durante escaneo | El flujo de escaneo funciona sin conexión activa |
| M17 | Instalable como PWA | Instalable en tablet y móvil desde el navegador |

### 4.2 Importante — Should Have (Post-MVP inmediato)

| # | Funcionalidad | Descripción |
|---|---|---|
| S1 | Historial de notas por clienta | Listado filtrable por fecha y estado |
| S2 | Re-generación de PDF | Volver a generar comprobante desde el historial |
| S3 | Dashboard con métricas | Deuda total, notas pendientes, ganancia del mes |
| S4 | Búsqueda en catálogo | Por nombre o código sin necesidad de escanear |
| S5 | Alta rápida durante escaneo | Registrar producto nuevo sin salir del flujo activo |
| S6 | Indicador de sincronización | Estado visible de offline → online y progreso de sync |
| S7 | Estado de cuenta por WhatsApp | Resumen completo de deuda enviable a la clienta |
| S8 | Notas internas por arreglo | Campo de texto libre para observaciones del acerto |
| S9 | Soporte para escáner Bluetooth | Compatibilidad con lectores BT que simulan teclado |

### 4.3 Futuro — Nice to Have (Roadmap)

| # | Funcionalidad | Descripción |
|---|---|---|
| F1 | Múltiples administradoras | Soporte multi-usuario con roles diferenciados |
| F2 | Portal de revendedora | Vista de solo lectura para que la clienta vea su historial |
| F3 | Reportes y estadísticas | Ganancia por período, por clienta, por producto |
| F4 | Gestión de stock e inventario | Control de prendas disponibles con alertas de stock bajo |
| F5 | Historial de precios por producto | Trazabilidad de cambios de costo y venta |
| F6 | Notificaciones push | Recordatorios de arreglos pendientes próximos a vencer |
| F7 | Exportación a Excel | Alternativa al PDF para integración con otras herramientas |
| F8 | Multi-idioma | Soporte i18n para expansión regional |

---

## 5. Requisitos No Funcionales

### 5.1 Rendimiento

| Requisito | Especificación |
|---|---|
| Tiempo de respuesta al escanear | El producto debe aparecer en la tabla en **< 300ms** tras la lectura del código |
| Carga inicial de la app | **< 3 segundos** en red 4G, **< 5 segundos** en 3G |
| Renderizado de tabla de ítems | Soportar hasta **500 ítems** en una liquidación sin degradación visible |
| Cálculo de totales | Instantáneo, sincrónico, sin debounce — se recalcula en cada cambio |

### 5.2 Disponibilidad y Offline

| Requisito | Especificación |
|---|---|
| Modo offline funcional | El flujo de escaneo debe funcionar completamente sin conexión a internet |
| Caché de catálogo | El catálogo de productos debe estar disponible offline mediante Service Worker |
| Persistencia local | Las liquidaciones en curso se guardan en IndexedDB/localStorage para sobrevivir cierres accidentales |
| Sincronización automática | Al recuperar conexión, los datos se sincronizan con Firebase automáticamente |
| Tiempo de sincronización | La sync debe completarse en **< 10 segundos** para datasets típicos |

### 5.3 Diseño y Usabilidad

| Requisito | Especificación |
|---|---|
| Tablet-first | La interfaz está diseñada primordialmente para tablets (1024px+). Funciona en móvil pero no es el foco principal |
| Touch-friendly | Todos los elementos interactivos tienen mínimo **48x48px** de área táctil |
| Legibilidad durante escaneo | La tabla de ítems debe ser legible con luz natural (contraste WCAG AA mínimo) |
| Flujo de una mano | Las acciones principales del escaneo accesibles con una sola mano en landscape |
| Modo landscape | La vista de escaneo está optimizada para orientación horizontal |
| Feedback inmediato | Cada escaneo exitoso debe tener confirmación visual **y** sonora/vibratoria |

### 5.4 Seguridad

| Requisito | Especificación |
|---|---|
| Autenticación obligatoria | No existe ninguna pantalla accesible sin autenticación previa |
| Gestión de sesión manual | La administradora inicia sesión cuando abre la app y puede cerrarla cuando quiera. La sesión persiste mientras no la cierre. Sin sesión activa, ninguna vista es accesible. |
| Reglas de Firestore | Las reglas de seguridad de Firebase garantizan que solo la administradora autenticada puede leer/escribir sus datos |
| Datos en tránsito | Toda comunicación con Firebase mediante HTTPS/TLS |
| Sin datos sensibles en localStorage | Tokens y credenciales nunca se almacenan en storage local inseguro |
| Aislamiento de datos | Los datos de una cuenta no son accesibles desde otra (multi-tenant ready) |

### 5.5 Instalabilidad (PWA)

| Requisito | Especificación |
|---|---|
| Instalable desde Chrome/Safari | Cumple con criterios de instalabilidad PWA (manifest, SW, HTTPS) |
| Ícono en pantalla de inicio | Ícono de alta resolución (512x512 mínimo) para pantalla de inicio de la tablet |
| Splash screen | Pantalla de carga nativa al abrir desde ícono |
| Sin barra de navegación del browser | Modo `standalone` para experiencia de app nativa |
| Actualizaciones silenciosas | El Service Worker actualiza la app en segundo plano sin interrumpir al usuario |

### 5.6 Compatibilidad

| Requisito | Especificación |
|---|---|
| Navegadores soportados | Chrome 90+, Safari 15+, Firefox 90+ (foco en Chrome para Android/iPad) |
| Dispositivos objetivo | Tablets Android (10"+) y iPad (10.2"+) |
| Cámara requerida | Acceso a cámara trasera para escaneo de códigos de barras |
| Resolución mínima | 1024 x 768px |

---

## 6. Stack Tecnológico

### 6.1 Frontend Core

| Tecnología | Versión | Justificación |
|---|---|---|
| **Next.js** | 14+ (App Router) | Framework React con SSR/SSG, routing nativo, optimización de imágenes y soporte PWA simplificado. Estándar de la industria con excelente DX. |
| **React** | 18+ | Base del frontend. Hooks, Suspense y concurrent features necesarios para UX fluida. |
| **TypeScript** | 5+ | Tipado estático para reducir bugs en lógica de negocio crítica (cálculos de precios, estados de liquidación). |
| **Tailwind CSS** | 3+ | Utility-first CSS. Permite prototipado rápido, diseño consistente y bundle pequeño. Ideal para interfaces tablet-first sin diseño system propio. |

### 6.2 Estado y Datos

| Tecnología | Versión | Justificación |
|---|---|---|
| **Zustand** | 4+ | State management liviano para el estado de la sesión de escaneo activa. Sin boilerplate de Redux, ideal para estado local transaccional de alta frecuencia (cada escaneo). |
| **Firebase Firestore** | 10+ (modular) | Base de datos NoSQL con soporte offline nativo, sincronización en tiempo real y reglas de seguridad declarativas. Elimina la necesidad de un backend propio para el MVP. |
| **Firebase Storage** | — | Para almacenamiento de assets si se requiere (logos, futura galería de productos). |

### 6.3 Autenticación

| Tecnología | Justificación |
|---|---|
| **Clerk** | Solución de autenticación completa con UI preconstruida, soporte para social login, MFA, y gestión de sesiones. Elimina la implementación manual de auth y sus riesgos de seguridad. Se integra nativamente con Next.js. |

### 6.4 PWA

| Tecnología | Justificación |
|---|---|
| **next-pwa** | Plugin de Workbox para Next.js. Genera automáticamente el Service Worker para cachear assets y habilitar modo offline. Configuración mínima para máximo resultado. |
| **Web App Manifest** | Configurado vía `next-pwa` para instalabilidad, ícono, splash y modo standalone. |

### 6.5 UI Especializada

| Tecnología | Justificación |
|---|---|
| **TanStack Table** (v8) | Headless table library para renderizar la grilla de ítems de liquidación. Soporta sorting, filtering y virtualización para 500+ ítems sin degradación de rendimiento. |
| **html5-qrcode** o **@zxing/library** | Biblioteca para acceder a la cámara y decodificar códigos de barras (QR y formatos 1D como EAN-13, Code128). Alternativa: `quagga2` para mejor soporte de formatos 1D. |

### 6.6 Generación de Documentos

| Tecnología | Justificación |
|---|---|
| **jsPDF** | Generación de PDF completamente en el cliente (sin servidor). Permite crear comprobantes con tablas, totales y formato personalizado. Se combina con `jspdf-autotable` para renderizado de tablas. |
| **Web Share API** | API nativa del browser para compartir el PDF generado directamente a WhatsApp u otras apps instaladas en la tablet. |

### 6.7 Infraestructura y Deploy

| Tecnología | Justificación |
|---|---|
| **Firebase App Hosting** | Soporte nativo para Next.js App Router con SSR. Integración perfecta con Firestore, Auth y Storage al estar en el mismo ecosistema Firebase. Deploy simple, HTTPS automático, CDN global y pricing predecible. Elimina dependencia de Vercel. |
| **Firebase** (BaaS) | Backend as a Service completo: Firestore + Storage + reglas de seguridad. Sin servidor propio que mantener. |

### 6.8 Resumen del Stack

```
┌─────────────────────────────────────────────┐
│         DISPOSITIVOS (PWA)                  │
│  Tablet / Desktop / Móvil                   │
│  Chrome / Safari — Modo Standalone          │
├─────────────────────────────────────────────┤
│         FRONTEND (Firebase App Hosting)     │
│  Next.js 14 + React 18 + TypeScript        │
│  Tailwind CSS                               │
│  Zustand (estado escaneo)                   │
│  TanStack Table (grilla de ítems)           │
│  html5-qrcode (escáner cámara)              │
│  jsPDF + autotable (comprobante PDF)        │
│  next-pwa + Workbox (offline/Service Worker)│
├─────────────────────────────────────────────┤
│         AUTH (SaaS)                         │
│  Clerk                                      │
├─────────────────────────────────────────────┤
│         BACKEND (Firebase BaaS)             │
│  Firebase Firestore (base de datos)         │
│  Firebase Storage (assets)                  │
│  Firebase App Hosting (deploy + SSR)        │
│  Firestore Security Rules (autorización)    │
└─────────────────────────────────────────────┘
```

---

## 7. Restricciones y Supuestos

### 7.1 Restricciones de Plataforma

| Restricción | Descripción | Impacto |
|---|---|---|
| **Multiplataforma** | La app corre en tablet (primario), desktop y móvil (secundario). | El diseño es tablet-first pero adaptable. En desktop se asume mouse + teclado. |
| **Navegador requerido: Chrome o Safari** | El escaneo por cámara y la instalación PWA requieren navegadores modernos. | Se debe usar Chrome en Android/desktop y Safari en iPad/iPhone. |
| **HTTPS obligatorio** | El acceso a la cámara del dispositivo requiere contexto seguro (HTTPS). | Firebase App Hosting garantiza HTTPS automáticamente. |
| **Una sola administradora (MVP)** | El sistema está diseñado para un único usuario administrador. | Si el negocio crece, se deberá implementar soporte multi-cuenta en el futuro. |

### 7.2 Restricciones de Conectividad

| Restricción | Descripción | Impacto |
|---|---|---|
| **Offline funcional post-login** | La app debe funcionar sin internet una vez que la administradora tiene sesión activa. El catálogo se cachea localmente en IndexedDB vía Service Worker. | Huella de datos local mínima: < 1MB para < 1.000 productos. |
| **Login inicial requiere internet** | Clerk necesita conexión para autenticar por primera vez. A partir de ahí, el JWT persiste localmente y permite operar offline. | Restricción operativa: la administradora debe loguearse al menos una vez con conexión antes de ir a zonas sin internet. |
| **Sincronización automática** | Al recuperar conexión, Firestore sincroniza los datos locales automáticamente. | Firestore offline persistence maneja esto de forma nativa. |

### 7.3 Restricciones de Hardware

| Restricción | Descripción | Impacto |
|---|---|---|
| **Múltiples métodos de escaneo** | El sistema soporta: (1) cámara trasera de tablet/móvil, (2) webcam en desktop, (3) lector de código de barras USB/BT conectado al dispositivo. | Los lectores USB/BT simulan entrada de teclado — compatible nativamente sin librería especial. |
| **Productos sin código de barras** | La mayoría de los productos tienen código, pero debe existir un fallback de ingreso manual. | El formulario de escaneo debe tener siempre un campo de entrada manual como alternativa. |
| **Calidad de cámara mínima** | Resolución mínima de 5MP recomendada para leer códigos 1D correctamente. | Cámaras de baja calidad pueden tener dificultades con códigos pequeños o dañados. |

### 7.4 Supuestos del Negocio

| Supuesto | Descripción |
|---|---|
| **Catálogo acotado** | Menos de 1.000 productos en el MVP. Manejable con caché local sin impacto de rendimiento. |
| **Precios variables por producto** | Los precios pueden cambiar al incorporar nuevos productos. No hay historial de precios en el MVP — se edita el producto directamente. |
| **Una nota activa por clienta** | Cada clienta puede tener como máximo una nota en estado "Aguardando acerto" a la vez. |
| **Productos con código de barras** | La mayoría de los productos tienen código. Los que no, se ingresan manualmente por descripción o código interno. |
| **WhatsApp disponible** | El dispositivo tiene acceso a WhatsApp (app instalada o WhatsApp Web) para el envío de comprobantes. |
| **Volumen por nota** | Una nota típica no supera los 100 ítems por clienta. |

---

## 8. Métricas de Éxito

### 8.1 Utilización Real

El objetivo de estas métricas es confirmar que la app reemplazó por completo al Excel y al papel en la rutina diaria.

| Métrica | Descripción | Objetivo |
|---|---|---|
| **Arreglos gestionados en la app** | % de arreglos quincenales procesados a través de la tablet vs papel/Excel | 100% |
| **Uso del escáner** | % de prendas procesadas mediante lector de código de barras vs entrada manual. Un número bajo indica problemas con las etiquetas físicas. | ≥ 80% |
| **Comprobantes enviados por WhatsApp** | % de arreglos cerrados cuyo comprobante se envía directamente desde la app | ≥ 90% |

### 8.2 Impacto en el Negocio

Las métricas que confirman si valió la pena. Son el retorno de inversión real del proyecto.

| Métrica | Descripción | Objetivo |
|---|---|---|
| **Ahorro de tiempo por arreglo** | Reducción en el tiempo que toma hacer un arreglo frente a la clienta vs el proceso manual anterior | ≥ 50% |
| **Cero fugas de dinero** | Errores de cálculo en saldos, multas y retención de pagarés | 0 errores (cálculo 100% automatizado) |
| **Claridad para la revendedora** | Las clientas reciben su saldo pendiente y detalle de prendas devueltas en formato limpio por WhatsApp, reduciendo disputas y confusión | Sin disputas por falta de claridad en los números |

### 8.3 Rendimiento y Calidad Técnica

Métricas enfocadas en no hacer pasar vergüenza ni perder tiempo frente a la clienta.

| Métrica | Descripción | Objetivo |
|---|---|---|
| **Reactividad del escáner** | Latencia desde que el lector hace "bip" hasta que la tabla actualiza el saldo a pagar | < 300ms |
| **Robustez offline** | El escaneo de códigos y el cálculo de precios funcionan aunque el WiFi fluctúe | Ininterrumpido — 0 caídas por conectividad |
| **Exportación inmediata** | Tiempo desde "Concluir arreglo" hasta tener el PDF generado o el enlace de WhatsApp listo | < 3 segundos |
| **Lighthouse PWA Score** | Puntuación de Lighthouse para criterios PWA | ≥ 90 |
| **Lighthouse Performance Score** | Puntuación de rendimiento en tablet | ≥ 85 |
| **Tasa de crashes** | % de sesiones que terminan en error no controlado | < 1% |

---

## Apéndice A: Modelo de Datos (Firestore)

### Colecciones principales

```
/users/{userId}
  - email: string
  - createdAt: timestamp
  - businessName: string

/users/{userId}/revendedoras/{revendedoraId}
  - nombre: string
  - whatsapp: string
  - activa: boolean
  - creadaEn: timestamp
  - notas: string?

/users/{userId}/productos/{productoId}
  - codigo: string (código de barras)
  - nombre: string
  - precioCosto: number
  - precioVenta: number
  - creadoEn: timestamp
  - actualizadoEn: timestamp

/users/{userId}/liquidaciones/{liquidacionId}
  - revendedoraId: string (ref)
  - revendedoraNombre: string (desnormalizado)
  - estado: 'abierta' | 'cerrada'
  - creadaEn: timestamp
  - cerradaEn: timestamp?
  - totalUnidades: number
  - totalACobrar: number
  - totalGanancia: number
  - notas: string?

/users/{userId}/liquidaciones/{liquidacionId}/items/{itemId}
  - productoId: string (ref)
  - codigo: string
  - nombre: string
  - precioCosto: number
  - precioVenta: number
  - cantidad: number
  - subtotal: number
  - ganancia: number
```

---

## Apéndice B: Estructura de Pantallas (Sitemap)

```
/ (root — requiere auth)
├── /dashboard                    → Pantalla principal con resumen
├── /liquidaciones
│   ├── /nueva                    → Iniciar nueva liquidación
│   ├── /[id]                     → Sesión de escaneo activa
│   ├── /[id]/resumen             → Resumen antes de cerrar
│   ├── /[id]/comprobante         → Vista previa del PDF
│   └── /historial                → Listado de liquidaciones pasadas
├── /revendedoras
│   ├── /                         → Listado de revendedoras
│   ├── /nueva                    → Alta de revendedora
│   └── /[id]                     → Detalle / edición de revendedora
└── /catalogo
    ├── /                         → Listado de productos
    ├── /nuevo                    → Alta de producto
    └── /[id]                     → Detalle / edición de producto
```

---

*Documento generado el 25 de marzo de 2026. Versión 1.0.0 — sujeta a revisión iterativa conforme avance el desarrollo.*
