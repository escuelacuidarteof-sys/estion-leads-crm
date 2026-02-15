# 🟢 1. Proceso de Ventas y Alta de Cliente

**Versión:** 1.0 (Enero 2026)  
**Actores:** Closer, Admin, Sistema (CRM + N8N).  
**Objetivo:** Registrar una nueva contratación y habilitar el acceso al cliente de forma segura y automatizada.

---

## 📈 1.0. Pre-Venta (Gestión de Leads / Interesados)

Antes de que un cliente realice el pago, se gestiona desde el panel de **Leads**.

1.  **Panel Kanban**: Acceso desde **Operaciones > Leads / Pre-Venta**.
2.  **Captura**: Los interesados se registran manualmente (botón "+ Nuevo Lead") o entran vía automatización.
3.  **Conversión**: 
    - Cuando un lead está convencido y paga, se abre su ficha.
    - Se pulsa el botón **"Convertir en Cliente"**.
    - Esto transfiere todos los datos automáticamente al formulario de "Nueva Venta" ahorrando tiempo y evitando errores.

---

## 📋 1.1. Flujo Operativo (Paso a Paso)

### Paso 1: Cierre y Acceso
El **Closer** (o Admin) cierra el acuerdo verbal/escrito con el cliente.
1.  Accede al CRM con sus credenciales.
2.  Navega a la sección **"Nueva Venta"** (`NewSaleForm`).

### Paso 2: Introducción de Datos
El sistema requiere los siguientes campos obligatorios para generar el contrato:

*   **Datos Personales:** Nombre Completo, DNI/Pasaporte (Crucial para contrato legal), Email (ID único), Teléfono, Dirección Completa.
*   **Datos de Venta:**
    *   **Coach Asignado:** Seleccionado de la lista desplegable (usuarios con rol `COACH`).
    *   **Programa:** Duración en meses (ej. 3, 6, 12) y Precio Final acordado.
    *   **Método de Pago:** Transferencia, Tarjeta (Stripe/Hotmart), Financiado.
*   **Comprobante (Evidencia):**
    *   Se debe subir una captura de pantalla o PDF del pago.
    *   *Sistema:* Lo sube automáticamente al bucket seguro `documents/payment_receipts`.

### Paso 3: Confirmación y Envío
Al pulsar **"Registrar Venta"**:
1.  El CRM crea el cliente en la base de datos (tablas `sales` y `clientes_ado_notion`).
2.  Genera un **Token Único de Onboarding** (ej. `bx93-ka21...`).
3.  El CRM muestra en pantalla un **Enlace Mágico**:
    `https://app.academiadiabetes.com/#/bienvenida/{token}`
4.  El Closer copia este enlace y se lo envía al cliente por WhatsApp/Email.

---

## ⚙️ 1.2. Especificaciones Técnicas (Bajo el Capó)

### A. Almacenamiento de Datos
| Campo | Tabla Base de Datos | Columna | Notas |
| :--- | :--- | :--- | :--- |
| **Precio** | `public.sales` | `amount` | Se guarda numérico. |
| **Coach** | `public.sales` | `assigned_coach_id` | Vincula la venta al coach. |
| **Ficha Cliente** | `public.clientes_ado_notion` | `property_coach`, `status` | Se crea con status 'Active'. |
| **Recibo** | `public.sales` | `payment_receipt_url` | URL pública firmada de Supabase Storage. |

### B. Automatización (Webhooks)
Al completar el registro, el CRM dispara un evento oculto al servidor de automatización (N8N).

*   **Trigger:** `POST /webhook/new-sale`
*   **Payload (Datos enviados):**
    ```json
    {
      "client_email": "cliente@email.com",
      "client_name": "Juan Perez",
      "sale_amount": 500,
      "coach_name": "Jesús",
      "onboarding_link": "https://.../bienvenida/xyz123"
    }
    ```
*   **Uso:** Sirve para enviar emails de bienvenida automáticos o notificar por Slack/Telegram al equipo.

---

## ⚠️ 1.3. Puntos Críticos de Control

1.  **Validación de Email:** El sistema no permite dos clientes activos con el mismo email. Si el cliente ya existe (ej. renovación o reentrada), el sistema actualiza su ficha existente en lugar de crear una nueva duplicada.
2.  **Backup del Recibo:** Es vital que el closer suba el recibo. Sin recibo, Contabilidad no puede validar la entrada de dinero posteriormente.
3.  **DNI Obligatorio:** Sin DNI no se puede generar el contrato legal en el paso siguiente (Onboarding). El formulario valida que este campo no esté vacío.

---

---

## 📊 1.4. Dashboard del Closer

El Closer tiene acceso a un panel personal donde puede ver **únicamente sus propias métricas y ventas**.

### Métricas Visibles (Primera Fila)
| KPI | Descripción |
| :--- | :--- |
| **Ventas Cerradas** | Número de ventas exitosas del periodo + comparativa con mes anterior |
| **Total Facturado** | Suma de ventas brutas generadas |
| **Comisiones Cobradas** | Total cobrado + barra de progreso vs comisiones totales |
| **Pendiente Cobro** | Comisiones sin liquidar + indicador visual |

### Métricas Secundarias (Segunda Fila)
| KPI | Descripción |
| :--- | :--- |
| **Canceladas** | Ventas fallidas o canceladas |
| **Tasa Éxito** | Porcentaje de ventas exitosas vs intentos (color según rendimiento) |
| **Mes Anterior** | Ventas del mes previo para comparar |
| **Total Histórico** | Acumulado de comisiones cobradas en toda la historia |

### Panel de Disponibilidad de Coaches
El Closer puede consultar qué coaches tienen capacidad para recibir nuevos clientes:
- **Sección colapsable** para no ocupar espacio
- Muestra solo coaches **activos**
- Para cada coach: nombre, rol, barra de capacidad visual, plazas libres
- Badge "Disponible" o "Completo" según estado

**Importante:** El Closer **NO puede ver** ventas de otros Closers ni métricas globales de la academia.

---

## ❓ FAQ (Preguntas Frecuentes Staff)

**P: ¿Qué pasa si me equivoco de Coach al asignar?**
R: Un Admin puede cambiar el coach posteriormente desde la "Ficha del Cliente". El registro financiero de la venta original (`sales`) quedará asignado al Closer, pero el servicio diario pasará al nuevo coach.

**P: ¿El cliente recibe un email automático con la contraseña?**
R: No en esta fase. El cliente entra "sin contraseña" usando el enlace mágico. Creará su contraseña durante el Onboarding.

**P: ¿Puedo ver las ventas de otros Closers?**
R: **NO**. El dashboard del Closer está filtrado para mostrar únicamente las ventas donde `closer_id` coincide con tu usuario. Solo Admin ve el global.
