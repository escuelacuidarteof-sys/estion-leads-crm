-- =====================================================
-- MIGRATION: Update Official Contract Template
-- Date: 2026-02-17
-- =====================================================

-- 1. Eliminamos la versión anterior para evitar duplicados
DELETE FROM public.contract_templates WHERE name = 'Contrato Oficial Escuela CUIDARTE';

-- 2. Insertamos el contrato con el texto legal verbatim
INSERT INTO public.contract_templates (name, content, is_default, created_at, updated_at)
VALUES (
    'Contrato Oficial Escuela CUIDARTE', 
    'DOCUMENTO DE ADHESIÓN AL PROGRAMA
ESCUELA CUIDARTE
Servicio prestado y facturado por NEIKO HEALTH, S.L..
Documento descargable para aceptación del participante.

REUNIDOS
De una parte,
NEIKO HEALTH, S.L.
NIF: B22928311
Domicilio social: C/ Princesa 31, 2º puerta 2, 28008 Madrid
Entidad mercantil que presta, gestiona y factura los servicios del programa Escuela CUIDARTE (en adelante, LA EMPRESA).
Y de otra parte,
El/la participante, cuyos datos constan en el formulario de inscripción (en adelante, EL/LA PARTICIPANTE).
Ambas partes, reconociéndose capacidad legal suficiente para contratar, acuerdan suscribir el presente Contrato de Prestación de Servicios, que se regirá por las siguientes:

CLÁUSULAS
1. OBJETO DEL CONTRATO
El presente contrato tiene por objeto regular la participación voluntaria del/ la participante en el programa Escuela CUIDARTE, consistente en un servicio integral de acompañamiento personalizado en nutrición, ejercicio físico y bienestar, desarrollado en modalidad online, y prestado y facturado por LA EMPRESA.

2. NATURALEZA DEL SERVICIO
El/la participante ha sido informado, reconoce y acepta que:
La Escuela CUIDARTE es un programa de educación, formación, acompañamiento y apoyo en hábitos de vida saludable.
NO constituye un acto médico, psicológico ni terapéutico.
NO realiza ni sustituye diagnósticos, tratamientos médicos, quirúrgicos o farmacológicos prescritos por profesionales sanitarios.
La información que se proporciona a través del programa tiene carácter general y orientativo.
La participación en el programa no genera relación clínica ni asistencial con LA EMPRESA.

3. NO SUSTITUCIÓN DEL TRATAMIENTO MÉDICO
El/la participante ha sido informado, reconoce y acepta que:
El programa NO sustituye en ningún caso a la atención médica, quirúrgica, farmacológica u oncológica indicada por su equipo sanitario.
Debe mantener sus controles médicos habituales durante toda su participación en el programa.
Cualquier decisión relacionada con tratamientos médicos debe ser consultada con su oncólogo/a o profesional sanitario de referencia.

4. AUSENCIA DE SERVICIO DE URGENCIAS
El/la Participante ha sido informado, reconoce y acepta que:
La Escuela CUIDARTE NO es un servicio de urgencias. No se ofrece atención inmediata ante situaciones de emergencia. Ante cualquier empeoramiento clínico, síntoma grave o urgencia, deberá acudir a los servicios sanitarios correspondientes.

5. NO GARANTÍA DE RESULTADOS NI CURACIÓN
El/la Participante ha sido informado, reconoce y acepta que:
El programa no garantiza resultados médicos, clínicos ni terapéuticos. No asegura o promete ningún tipo de curación, mejoría clínica específica ni evolución determinada de la enfermedad. Los posibles beneficios dependen de múltiples factores individuales.

6. PARTICIPACIÓN VOLUNTARIA Y AUTORRESPONSABILIDAD
El/la participante acepta que su participación es voluntaria y bajo su propia responsabilidad. La aplicación de las recomendaciones es una decisión personal. Se compromete a comunicar a su equipo sanitario cualquier cambio relevante en su salud.

7. DESCRIPCIÓN DEL PROGRAMA Y CONTENIDOS
El programa incluye, durante el período de vigencia de contrato:
a) Acompañamiento nutricional personalizado.
b) Entrenamientos personalizados.
c) Formación en autocuidado y bienestar.
d) Resolución de dudas.

8. ACCESO AL PROGRAMA
El acceso es vía plataforma online privada. LA EMPRESA facilitará las credenciales personales tras la aceptación de este contrato.

9. OBLIGACIONES DE LA EMPRESA
LA EMPRESA se obliga a facilitar los servicios señalados y cumplir las obligaciones estipuladas en este contrato.

10. PRECIO DEL PROGRAMA
El precio es de QUINIENTOS EUROS (500,00 €) trimestrales + IVA (21%). El pago del primer trimestre debe realizarse en un máximo de 2 días naturales tras la aceptación.

11. DURACIÓN Y BAJA
Duración mínima de tres meses. Renovable automáticamente por períodos iguales. El participante puede abandonar en cualquier momento notificándolo por escrito.

12. LIMITACIÓN DE RESPONSABILIDAD
LA EMPRESA no será responsable de decisiones personales basadas en los contenidos del programa ni de la evolución clínica del participante.

13. CONFIDENCIALIDAD Y PROTECCIÓN DE DATOS
Tratamiento conforme al RGPD (UE) 2016/679. Los datos se utilizarán exclusivamente para la gestión y mejora del programa.

14. LEGISLACIÓN Y JURISDICCIÓN
El contrato se rige por la legislación española. Ambas partes se someten a los Tribunales de Madrid.',
    true,
    NOW(),
    NOW()
);

-- 3. Aseguramos que todas las ventas pendientes tengan asignado este contrato por defecto
-- (Esto es útil si ya hay ventas creadas sin contrato asignado)
UPDATE public.sales 
SET contract_template_id = (SELECT id FROM public.contract_templates WHERE name = 'Contrato Oficial Escuela CUIDARTE' LIMIT 1)
WHERE contract_template_id IS NULL AND status = 'pending_onboarding';
