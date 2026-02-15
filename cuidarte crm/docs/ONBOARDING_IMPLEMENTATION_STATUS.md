# SISTEMA DE ONBOARDING - ESTADO ACTUAL ✅

## ✅ COMPLETADO AL 100% - VERSIÓN SIMPLIFICADA

> **ACTUALIZACIÓN 17 DIC 2025**: Onboarding simplificado de 9 → 7 pasos.  
> Los datos de nutrición se recopilan ahora en un formulario separado y exhaustivo.

### 1. Sistema de Ventas (Closers)
- ✅ Tabla `sales` en BD con todos los campos necesarios
- ✅ Tabla `app_settings` en BD
- ✅ Componente `NewSaleForm.tsx` completo
- ✅ Integración con N8N webhook
- ✅ Webhook activado: https://academia-diabetes-online-n8n.k5pdeb.easypanel.host/webhook/nueva_alta_ado

### 2. Sistema de Onboarding (Clientes) - SIMPLIFICADO
- ✅ React Router instalado y configurado
- ✅ Ruta `/bienvenida/:token` en App.tsx
- ✅ Componente principal `OnboardingPage.tsx` con:
  - Validación de token
  - **7 pasos visuales** (reducido de 9)
  - Barra de progreso
  - Navegación entre pasos
  - `handleSubmit` completo con:
    - Validación de todos los campos
    - Insert en `clientes_ado_notion` (SIN datos de nutrición)
    - Update de `sales` → status = 'onboarding_completed'
    - Creación de usuario (Supabase Auth o tabla users)
    - Notificación opcional a N8N
    - Redirección al login

### 3. Pasos del Formulario (7 pasos - SIMPLIFICADO)
1. ✅ `WelcomeStep.tsx` - Bienvenida e instrucciones
2. ✅ `CredentialsStep.tsx` - Email y contraseña
3. ✅ `PersonalDataStep.tsx` - Datos personales
4. ✅ `MedicalDataStep.tsx` - Datos médicos
5. ✅ `MeasurementsStep.tsx` - Medidas corporales
6. ✅ `ActivityStep.tsx` - Actividad física
7. ✅ `GoalsStep.tsx` - Objetivos + Video coach + Bienvenida final

### 4. Sistema de Nutrición - SEPARADO
- ✅ Tabla `nutrition_assessments` diseñada (60+ campos)
- ✅ Script SQL creado: `database/create_nutrition_assessments_table.sql`
- ⏳ Formulario exhaustivo (pendiente)
- ⏳ Vista para nutricionistas (pendiente)
- ⏳ Integración en portal del cliente (pendiente)

---

## 📋 REGLAS DE OBLIGATORIEDAD IMPLEMENTADAS

### Campos OBLIGATORIOS:
- Credenciales (email pre-llenado, contraseña mínimo 6 caracteres)
- Datos personales (nombre, apellidos, fecha nacimiento, sexo, teléfono, dirección, ciudad, provincia)
- Datos médicos (condiciones de salud, medicación diaria)
- Medidas (peso actual, peso objetivo, altura, perímetros)
- Actividad (pasos diarios, horario trabajo, tipo trabajo, experiencia fuerza, ubicación ejercicio)
- Nutrición 1 (preferencias dietéticas, alimentos regulares, alergias)
- Nutrición 2 (comidas/día, horarios principales, cocina propia, pesa comida, bebida comidas, recordatorio 24h)
- Objetivos (3 meses, 6 meses, 1 año, motivo confianza)

### Campos CONDICIONALES:
- **Insulina** (solo si marca que usa insulina):
  - Marca del boli
  - Dosis
  - Horario inyección
- **Pan** (solo si marca que come pan):
  - Cantidad aproximada
- **Pica entre horas** (solo si marca que pica):
  - Qué pica
- **Antojos** (solo si marca que tiene):
  - Qué come cuando tiene antojos
- **TCA** (solo si marca que tiene):
  - Tipo de trastorno

### Campos OPCIONALES:
- HbA1c (puede no saberla)
- Glucosa en ayunas (puede no saberla)
- Hora media mañana
- Hora merienda
- Comentarios adicionales
- Otras preferencias dietéticas
- Otras alergias

---

## �️ MAPEO DE DATOS A BD

Los datos del onboarding se guardan en la tabla `clientes_ado_notion` con el siguiente mapeo:

```
property_nombre              ← firstName
property_apellidos           ← surname
property_email               ← email
property_telefono            ← phone
property_fecha_nacimiento    ← birthDate
property_edad                ← age
property_sexo                ← gender
property_direccion_postal    ← address
property_poblacion           ← city
property_provincia           ← province
property_enfermedades_actuales ← healthConditions.join(', ')
property_medicacion_diaria   ← dailyMedication
property_usa_insulina        ← usesInsulin ? 'Sí' : 'No'
property_marca_insulina      ← insulinBrand
property_dosis_insulina      ← insulinDose
property_hora_inyeccion_insulina ← insulinTime
property_usa_sensor_freestyle ← usesFreestyleLibre ? 'Sí' : 'No'
property_glucosa_ayunas      ← glucoseFasting
property_hemoglobina_glicosilada ← lastHba1c
current_weight               ← currentWeight
starting_weight              ← currentWeight (igual al actual al registrarse)
target_weight                ← targetWeight
property_altura_cm           ← height
property_perimetro_brazo_cm  ← armCircumference
property_perimetro_barriga_cm ← waistCircumference
property_perimetro_muslo_cm  ← thighCircumference
property_pasos_diarios       ← dailySteps
property_horario_disponibilidad ← workSchedule
property_tipo_trabajo        ← workType
property_experiencia_fuerza  ← hasStrengthTraining
property_lugar_entrenamiento ← exerciseLocation
property_preferencias_dieteticas ← dietaryPreferences.join(', ')
property_alimentos_vetados   ← unwantedFoods
property_alimentos_consumidos_habitualmente ← regularFoods.join(', ')
property_alergias_intolerancias ← allergies.join(', ')
property_numero_comidas_dia  ← mealsPerDay
property_hora_desayuno       ← breakfastTime
property_hora_comida         ← lunchTime
property_hora_cena           ← dinnerTime
property_cocina_propia       ← cooksSelf
property_pesar_comida        ← weighsFood
property_veces_comer_fuera   ← eatsOutPerWeek
property_bebida_en_comidas   ← drinkWithMeals
property_consumo_alcohol     ← alcoholPerWeek
property_recordatorio_24h    ← last24hMeals
property_objetivo_3_meses    ← goal3Months
property_objetivo_6_meses    ← goal6Months
property_objetivo_1_anho     ← goal1Year
property_motivo_confianza    ← whyTrustUs
coach_id                     ← saleData.assigned_coach_id
property_meses_servicio_contratados ← saleData.contract_duration
status                       ← 'active'
```

---

## 🔄 FLUJO COMPLETO

1. **Closer cierra venta** → Se crea registro en `sales` con `onboarding_token`
2. **Cliente recibe enlace** → `/bienvenida/{token}`
3. **Cliente completa formulario** → 9 pasos del onboarding
4. **Al pulsar "Completar Registro"**:
   - Se validan todos los campos
   - Se crea cliente en `clientes_ado_notion`
   - Se actualiza `sales` → status = 'onboarding_completed'
   - Se crea usuario para login
   - Se notifica al coach (optional, vía N8N)
   - Se redirige al login

---

## 🧪 CÓMO PROBAR

### Opción 1: Con token simulado en mock
1. Crear datos de prueba en `mockSupabase.ts` para la tabla `sales`
2. Navegar a `/bienvenida/{token-de-prueba}`
3. Completar el formulario

### Opción 2: Con Supabase real
1. Ejecutar `create_sales_table.sql` en Supabase
2. Crear una venta de prueba con `onboarding_token`
3. Navegar al enlace con el token

### Scripts SQL necesarios:
1. `create_sales_table.sql` - Tabla de ventas
2. `setup_onboarding_security.sql` - Seguridad RLS
3. (Opcional) Añadir campos faltantes a `clientes_ado_notion` si es necesario

---

## 📝 NOTAS TÉCNICAS

- El sistema usa React Router v7 para la navegación
- El token se valida contra la tabla `sales`
- Los campos de insulina solo aparecen si el usuario marca que usa insulina
- La edad se calcula automáticamente desde la fecha de nacimiento
- El peso inicial (starting_weight) es igual al peso actual al registrarse
- El email y teléfono vienen pre-llenados desde la venta

---

*Última actualización: 16 de Diciembre de 2025*
