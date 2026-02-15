# 🔵 2. Proceso de Onboarding y Alta (El Viaje del Cliente)

**Versión:** 1.0 (Enero 2026)  
**Actores:** Cliente, Coach Asignado, Sistema.  
**Objetivo:** Guiar al nuevo alumno desde el "Click en el enlace" hasta que está legalmente cubierto y médicamente perfilado para empezar.

---

## 🚦 2.1. Instrucciones para el Staff (Qué esperar)

Un cliente nuevo nunca debe sentirse perdido. Este es el camino que recorrerá solo, pero que debéis conocer para darle soporte si pregunta.

### Paso 1: El Acceso "Mágico"
El cliente recibe vuestro enlace por WhatsApp/Email.
*   **Acción Cliente:** Hace clic en `https://app.../#/bienvenida/TOKEN`.
*   **Lo que ve:** Una pantalla de bienvenida personalizada con su nombre.
*   **Nota Staff:** No necesita usuario ni contraseña todavía. El token es su llave temporal.

### Paso 2: La Firma Legal (Contrato) ⚖️
**CRÍTICO:** Sin firma, no hay servicio.
*   Cualquier alumno debe aceptar las condiciones legales, responsabilidad médica y normativa de pagos.
*   **Acción Cliente:**
    1.  Revisa el PDF generado automáticamente con sus datos (DNI, Nombre).
    2.  Firma digitalmente en pantalla (dedo o ratón).
    3.  Al guardar, se genera un PDF final con hash legal.
*   **¿Dónde va esto?** Se guarda en su ficha para siempre. Vosotros podréis descargar el PDF firmado desde la pestaña "Perfil" del cliente.

### Paso 3: Anamnesis (El Formulario Médico) 🏥
Aquí es donde el Coach recibe la "materia prima" para trabajar. El cliente rellena:
1.  **Datos Diabetes:** Tipo (1, 2, LADA), insulinas, dosis, uso de sensores.
2.  **Datos Físicos:** Peso actual, altura, perímetro abdominal.
3.  **Nutrición:** Alergias, preferencias, horarios de comidas.
4.  **Objetivos:** Qué quiere conseguir en 3, 6 y 12 meses.
5.  **Creación de Acceso:** Al final, el cliente elige su **Contraseña** definitiva para la App.

### Paso 4: ¡Activación Completa! 🚀
Al guardar el formulario:
*   El cliente entra automáticamente a su Panel Principal.
*   **Notificación al Coach:** El Coach asignado recibe un aviso (si está configurado) de que tiene un nuevo alumno listo para revisar.

---

## ⚙️ 2.2. Especificaciones Técnicas (Para Developers/Dueños)

### A. Gestión del Token de Onboarding
El token es de **un solo uso** práctico (u obsoleto tras completar).
*   **Validación:** Al cargar `/bienvenida/:token`, la API consulta `public.sales` y `public.clientes_ado_notion`.
*   **Seguridad:** Si `onboarding_completed = true`, el token ya no sirve para editar datos sensibles, solo redirige al Login.

### B. Generación y Guardado de Contrato
*   **Tecnología:** PDF-Lib (Frontend generation).
*   **Storage:** El PDF firmado (binario) se sube a `documents/contracts/{client_id}/{timestamp}_contrato.pdf`.
*   **Base de Datos:** Se guarda la URL pública en `clientes_ado_notion.contract_url` y `contract_signed = true`.

### C. Privacidad de Datos Médicos (GDPR/LOPD)
Los datos del formulario de Anamnesis son de **Categoría Especial (Salud Level)**.
*   **Persistencia:** Se guardan en columnas específicas de `clientes_ado_notion` (ej: `property_insulina`, `property_patologias`).
*   **Acceso:** Por diseño RLS (ver Auditoría), solo el **Coach Asignado** y el **Admin** pueden leer estos campos. Un "Closer" o "Setter" NO debería leer historial médico tras el alta.

---

## ❓ 2.3. FAQ y Resolución de Problemas (Staff)

**P: El cliente dice que el enlace "ha caducado" o no funciona.**
**R:**
1.  Verifica que copiaste el enlace completo (a veces WhatsApp corta el final).
2.  Si el cliente ya completó el registro antes, el enlace ya no sirve. Debe entrar por la página normal (`/login`) con su email y la contraseña que puso.

**P: El cliente se equivocó en su peso o en su insulina.**
**R:**
*   **Durante el alta:** Puede corregirlo antes de pulsar "Finalizar".
*   **Después del alta:** El cliente ya no puede editar esos datos maestros. Debe pedírtelo a ti (su Coach), y tú lo editas desde su Ficha en el CRM.

**P: ¿Dónde veo el contrato firmado?**
**R:** Entra en la ficha del alumno > Pestaña "Información" > Sección "Documentos/Legal". Ahí hay un botón para descargar el PDF.

---
*Este manual es parte de la documentación oficial de operaciones de Academia Diabetes Online.*
