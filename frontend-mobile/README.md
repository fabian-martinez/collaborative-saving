# Frontend Mobile - Portal del Socio (Collaborative Saving)

Aplicación web móvil exclusiva e independiente para los socios del fondo de ahorro comunitario.

## 🚀 Stack Tecnológico

- **Vue 3** (Composition API, `<script setup lang="ts">`)
- **Vite**
- **Tailwind CSS v4** (con utilidades de `safe-area` para iOS/Android)
- **Pinia** (Gestión de estado)
- **Vue Router 4**
- **Firebase Auth Client**

## 📱 Características Principales

1. **Pestaña 'Yo' (Vista Personal):**
   - **Hero Card Próxima Reunión:** Monto a pagar en efectivo, fecha de asamblea y desglose detallado en Bottom Sheet.
   - **Mi Capital:** Ahorro acumulado en acciones (grandes y pequeñas).
   - **Mi Deuda:** Créditos vigentes (corriente y ágil) con tasa y proyección de cuota.
   - **Fondos & Actividades:** Seguros de solidaridad y aportes comunitarios.
   - **Recibos de Pago:** Historial y tirilla digital de confirmación de efectivo recibido por tesorería.
2. **Pestaña 'Fondo' (Transparencia Colectiva):**
   - Capital social global, acciones en circulación y cartera total prestada.
3. **Pestaña 'Socios' (Comunidad):**
   - Directorio de socios con filtros rápidos (`[Todos]`, `[Con Ahorro]`, `[Con Préstamo]`) y ficha en Bottom Sheet.
4. **Modo Privacidad Maestro (`👁️`):**
   - Interruptor en la barra superior para ocultar todas las cifras con `••••••` de un solo toque.

## 🛠️ Comandos

```bash
# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build

# Vista previa de producción
npm run preview
```
