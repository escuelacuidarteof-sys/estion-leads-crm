# Plan: Rediseño de Página de Acceso (Landing Page)

## Objetivo
Transformar la página de login actual en una landing page premium que explique la propuesta de valor de la **Escuela Cuid-Arte**, su metodología, herramientas y equipo de profesionales, manteniendo la funcionalidad de acceso.

## Diseño Visual
- **Paleta**: Brand Green (#6BA06B), Brand Mint (#CDE8CD), Brand Gold (#D4AF37), Brand Dark (#1A2E1A).
- **Estilo**: Glassmorphism, degradados suaves, tipografía moderna (Outfit/Inter), micro-animaciones.
- **Iconografía**: Lucide-React.

## Secciones de la Landing Page
1. **Navegación**: Menú minimalista con logo y botón de "Acceso Alumnas".
2. **Hero Section**: 
   - Título impactante: "Ciencia con Calidez: El camino hacia tu mejor versión".
   - Subtítulo: "Acompañamiento médico, nutricional y psicológico personalizado".
   - CTA: Botón de scroll a "Saber más" y botón de "Acceso".
3. **Sección "El Método"**: Explica los pilares (Médico, Nutrición, Psicología).
4. **Sección "Nuestra App"**: Muestra las herramientas (Seguimiento, Chat, Clases, Informes).
5. **Sección "Equipo"**: Listado de tipos de profesionales (Coaches, Doctores, Psicólogos).
6. **Sección "Trabajo Diario"**: Paso a paso (Check-ins, Reviews, Contacto).
7. **Pie de Página & Login**: Formulario de acceso integrado en una zona visualmente distinta o modal/sección final.

## Tareas Técnicas
1. Crear `LandingPage.tsx` en `components/`.
2. Integrar la lógica de `Login.tsx` dentro de `LandingPage.tsx`.
3. Actualizar `App.tsx` para usar `LandingPage` como vista inicial cuando no hay usuario.
4. Asegurar que sea 100% responsivo.
