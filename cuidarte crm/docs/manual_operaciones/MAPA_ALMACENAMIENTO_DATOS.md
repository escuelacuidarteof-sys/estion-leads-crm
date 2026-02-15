# 🗺️ Mapa de Almacenamiento de Datos

Este documento responde a la pregunta clave: **"¿Dónde está guardado cada dato?"**. Sirve como referencia técnica para entender la ubicación física de la información en Supabase.

## 🗄️ 1. Base de Datos (PostgreSQL)

La información estructurada se guarda en tablas dentro de Supabase.

### 👤 Tabla: `clientes_ado_notion`
*Es el "corazón" del sistema. Contiene el perfil maestro del cliente.*

| Tipo de Dato | Campos / Columnas Clave | Notas |
| :--- | :--- | :--- |
| **Datos Personales** | `property_nombre`, `property_apellidos`, `property_email`, `property_telefono` | Información básica de contacto. |
| **Contratos (Fechas)** | `property_inicio_programa`, `property_fecha_fin_contrato_actual` | Controla el acceso al servicio. |
| **Estado Cliente** | `status` (App) y `property_estado_cliente` (Notion) | Sincronizados autom. por trigger. |
| **Datos Médicos** | `property_insulina`, `property_patologias`, `property_medicacion` | Mapeados al objeto `medical` en Frontend. |
| **Renovaciones** | `property_renueva_f2`, `renewal_payment_link`, `renewal_receipt_url` | Gestión de fases F2-F5. |
| **Nutrición** | `assigned_nutrition_type`, `assigned_calories`, `property_alergias` | Perfil nutricional. |

### 💰 Tabla: `sales`
*Registro histórico de operaciones comerciales.*

| Tipo de Dato | Campos / Columnas Clave | Notas |
| :--- | :--- | :--- |
| **Detalle Venta** | `amount`, `payment_method`, `contract_duration_months` | Datos financieros de la venta. |
| **Asignación** | `closer_id`, `assigned_coach_id` | Quién vendió y a quién se asignó. |
| **Onboarding** | `onboarding_token`, `coach_notification_seen` | Gestión del alta y avisos. |

### 📉 Tablas de Seguimiento (Diario/Semanal)
*Nuevas tablas normalizadas para datos de alto volumen.*

*   **Pesos:** `weight_history` (Fecha, Peso, Notas).
*   **Glucosa:** `glucose_readings` (Fecha, Valor, Momento del día).
*   **Revisiones:** `coaching_sessions` (Feedback semanal, enlaces a Loom).

---

## ☁️ 2. Archivos y Documentos (Supabase Storage)

Los archivos binarios (PDFs, Imágenes) se guardan en "Buckets" (carpetas en la nube).

### 📦 Bucket: `documents`
Este es el contenedor principal para documentos sensibles.

*   **Comprobantes de Pago (Ventas):**
    *   📁 Ruta: `/payment_receipts/{sale_id}.jpg`
    *   🔗 Referencia en BD: Tabla `sales`, campo implícito (se construye la URL).

*   **Comprobantes de Renovación:**
    *   📁 Ruta: `/payment_receipts/renewal_{client_id}_{timestamp}.jpg`
    *   🔗 Referencia en BD: Tabla `clientes_ado_notion`, campo `renewal_receipt_url`.

*   **Facturas de Coaches:**
    *   📁 Ruta: `/invoices/{coach_id}/{year}/{month}_{filename}`
    *   🔗 Referencia en BD: Tabla `coach_invoices`, campo `invoice_url`.

*   **Contratos Firmados:**
    *   📁 Ruta: `/contracts/{client_id}/{contract_name}.pdf`
    *   🔗 Referencia en BD: Tabla `clientes_ado_notion`, campo `contract_url`.

---

## 🔄 3. Resumen de Flujo de Datos

1.  **Cliente sube peso en App** ➔ Se guarda en tabla `weight_history`.
2.  **Coach sube factura PDF** ➔ Archivo va a Bucket `documents` ➔ Link se guarda en tabla `coach_invoices`.
3.  **Closer crea venta** ➔ Se crea fila en `sales` ➔ Se crea fila en `clientes_ado_notion`.
4.  **Cliente rellena formulario médico** ➔ Se actualizan columnas `property_...` en `clientes_ado_notion`.

---
*Mapa generado por Antigravity AI - Enero 2026*
