# 🎯 PLAN DE LIMPIEZA Y REORGANIZACIÓN DE BASE DE DATOS

## SITUACIÓN ACTUAL
- La tabla `clientes_ado_notion` existe pero puede tener datos inconsistentes
- Se importaron 371 clientes pero aparecen como NULL
- Necesitamos una base de datos limpia con TODOS los datos de Notion

## 📋 COLUMNAS NECESARIAS (Basado en mockSupabase.ts)

### 1. DATOS PERSONALES BÁSICOS
- `id` (UUID, PRIMARY KEY)
- `property_nombre` (TEXT)
- `property_apellidos` (TEXT)
- `property_correo_electr_nico` (TEXT) ⚠️ IMPORTANTE: Esta es la columna de email
- `property_dni` (TEXT)
- `property_tel_fono` (TEXT)
- `property_direccion` (TEXT)
- `property_poblaci_n` (TEXT) - Ciudad
- `property_provincia` (TEXT)

### 2. DATOS DEMOGRÁFICOS
- `property_edad` (INTEGER)
- `property_edad_vista` (INTEGER)
- `property_fecha_de_nacimiento` (DATE)
- `property_sexo` (TEXT)

### 3. DATOS FÍSICOS
- `property_altura` (NUMERIC)
- `property_peso_actual` (NUMERIC)
- `property_peso_inicial` (NUMERIC)
- `property_peso_objetivo` (NUMERIC)
- `property_per_metro_abdomen` (NUMERIC)

### 4. ESTADO Y PROGRAMA
- `property_estado_cliente` (TEXT)
- `property_fecha_alta` (DATE)
- `property_inicio_programa` (DATE)
- `property_contratado_f1` (TEXT)
- `property_fase` (TEXT)
- `property_tipo_de_programa` (TEXT)
- `coach_id` (TEXT) ⚠️ COLUMNA AÑADIDA - UUID del coach
- `property_coach` (TEXT) - Nombre del coach (legacy)
- `status` (TEXT) ⚠️ COLUMNA AÑADIDA - Estado estandarizado
- `allow_endocrine_access` (BOOLEAN)

### 5. DATOS MÉDICOS
- `property_insulina` (TEXT)
- `property_marca_insulina` (TEXT)
- `property_dosis` (TEXT)
- `property_hora_inyecci_n` (TEXT)
- `property_usa_sensor_free_style` (BOOLEAN)
- `property_ultima_glicosilada_hb_a1c` (TEXT)
- `property_glucosa_en_ayunas_actual` (TEXT)
- `property_enfermedades` (TEXT)
- `property_medicaci_n` (TEXT)
- `property_otras_enfermedades_o_condicionantes` (TEXT)

### 6. NUTRICIÓN
- `property_plan_nutricional` (TEXT)
- `assigned_nutrition_type` (TEXT) ⚠️ COLUMNA AÑADIDA
- `assigned_calories` (NUMERIC) ⚠️ COLUMNA AÑADIDA
- `property_cocina_l_mismo` (BOOLEAN)
- `property_dispuesto_a_pesar_comida` (BOOLEAN)
- `property_comidas_fuera_de_casa_semanales` (INTEGER)
- `property_n_mero_comidas_al_d_a` (INTEGER)
- `property_come_con_pan` (BOOLEAN)
- `property_cantidad_pan` (TEXT)
- `property_consumo_de_alcohol` (TEXT)
- `property_bebida_en_la_comida` (TEXT)
- `property_alergias_intolerancias` (TEXT)
- `property_otras_alergias_o_intolerancias` (TEXT)
- `property_alimentos_a_evitar_detalle` (TEXT)
- `property_alimentos_consumidos` (TEXT)
- `property_tiene_antojos` (TEXT)
- `property_especificar_antojos` (TEXT)
- `property_pica_entre_horas` (BOOLEAN)
- `property_especificar_pica_entre_horas` (TEXT)
- `property_trastorno_alimenticio_diagnosticado` (TEXT)
- `property_especificar_trastorno_alimenticio` (TEXT)
- `property_notas_diet_ticas_espec_ficas` (TEXT)
- `property_ltima_comida_recuerdo` (TEXT)
- `property_preferencias_diet_ticas_generales` (TEXT)

### 7. HORARIOS DE COMIDAS
- `property_horario_desayuno` (TEXT)
- `property_horario_almuerzo` (TEXT)
- `property_horario_cena` (TEXT)
- `property_horario_merienda` (TEXT)
- `property_horario_media_ma_ana` (TEXT)

### 8. ENTRENAMIENTO
- `property_actividad_f_sica_general_cliente` (TEXT)
- `property_pasos_diarios_promedio` (INTEGER)
- `property_ejercicio_fuerza` (BOOLEAN)
- `property_lugar_entreno` (TEXT)
- `property_horario_disponibilidad` (TEXT)

### 9. OBJETIVOS
- `property_motivo_contrataci_n` (TEXT)
- `property_3_meses` (TEXT)
- `property_6_meses` (TEXT)
- `property_1_a_o` (TEXT)

### 10. RENOVACIONES
- `property_renueva_f2` (BOOLEAN)
- `property_contratado_renovaci_n_f2` (TEXT)
- `property_renueva_f3` (BOOLEAN)
- `property_contratado_renovaci_n_f3` (TEXT)
- `property_renueva_f4` (BOOLEAN)
- `property_contratado_renovaci_n_f4` (TEXT)
- `property_renueva_f5` (BOOLEAN)
- `property_contratado_renovaci_n_f5` (TEXT)

### 11. CONTRATO DIGITAL
- `contract_signed` (BOOLEAN) ⚠️ COLUMNA AÑADIDA
- `contract_signed_at` (TIMESTAMP) ⚠️ COLUMNA AÑADIDA
- `contract_signature_image` (TEXT) ⚠️ COLUMNA AÑADIDA
- `contract_url` (TEXT) ⚠️ COLUMNA AÑADIDA

### 12. REVISIONES Y SEGUIMIENTO
- `property_video_revision` (TEXT)
- `property_fecha_revision` (DATE)

### 13. INFORMACIÓN ADICIONAL
- `property_informaci_n_extra_cliente` (TEXT)

### 14. BAJAS Y PAUSAS
- `property_fecha_abandono` (DATE)
- `property_motivo_abandono` (TEXT)
- `property_fecha_de_baja` (DATE)
- `property_motivo_baja` (TEXT)
- `property_fecha_pausa` (DATE)
- `property_motivo_pausa` (TEXT)

### 15. PAGOS Y RENOVACIONES
- `renewal_payment_link` (TEXT) ⚠️ COLUMNA AÑADIDA
- `renewal_payment_status` (TEXT) ⚠️ COLUMNA AÑADIDA
- `renewal_receipt_url` (TEXT) ⚠️ COLUMNA AÑADIDA
- `renewal_phase` (TEXT) ⚠️ COLUMNA AÑADIDA
- `renewal_amount` (NUMERIC) ⚠️ COLUMNA AÑADIDA
- `renewal_duration` (INTEGER) ⚠️ COLUMNA AÑADIDA

### 16. ONBOARDING
- `onboarding_token` (TEXT) ⚠️ COLUMNA AÑADIDA
- `onboarding_completed` (BOOLEAN) ⚠️ COLUMNA AÑADIDA (si existe)
- `onboarding_completed_at` (TIMESTAMP) ⚠️ COLUMNA AÑADIDA (si existe)

### 17. SISTEMA
- `user_id` (UUID) - Relación con auth.users
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## 🚀 PASOS A SEGUIR

### PASO 1: Crear SQL de limpieza y estructura
Voy a crear un archivo SQL que:
1. Elimine TODOS los datos actuales
2. Verifique que todas las columnas necesarias existan
3. Añada las que falten

### PASO 2: Crear script de importación mejorado
Un nuevo script que mapee CORRECTAMENTE todas las columnas del CSV de Notion

### PASO 3: Ejecutar (TÚ)
1. Ejecutar el SQL en Supabase
2. Ejecutar el script de importación
3. Verificar resultados

## ⚠️ COLUMNAS CRÍTICAS AÑADIDAS DURANTE EL DESARROLLO
Estas NO están en Notion pero son importantes:
- `coach_id` (UUID del coach)
- `status` (estado estandarizado)
- `assigned_nutrition_type` y `assigned_calories`
- Campos de contrato digital
- Campos de renovación de pagos
- `onboarding_token`

¿Procedo a crear los archivos?
