# Prompt de Diseño UX: Vista de Detalle del Socio (MemberDetailView)

## Contexto y Objetivo

Diseñar una interfaz completa y moderna para visualizar toda la información financiera y de recursos de un socio en el sistema de ahorro colaborativo. La interfaz debe aprovechar todos los endpoints disponibles del controlador `members.v2.controller.ts` para presentar una vista holística y accionable del estado del socio.

## Principios de Diseño

1. **Jerarquía Visual Clara**: La información más importante debe destacarse visualmente
2. **Progresiva Revelación**: Mostrar resúmenes primero, detalles bajo demanda
3. **Contexto Temporal**: Organizar información por períodos y estados
4. **Acciones Inmediatas**: Facilitar operaciones comunes desde la vista
5. **Feedback Visual**: Estados claros de carga, éxito y error
6. **Responsive**: Adaptable a diferentes tamaños de pantalla

## Estructura General de la Interfaz

### 1. Header del Socio (Sección Superior)

**Ubicación**: Parte superior de la página, siempre visible

**Componentes**:
- **Avatar/Iniciales**: Círculo con iniciales del socio o icono de usuario
- **Nombre del Socio**: Título principal (H1), destacado
- **Estado del Socio**: Badge con color según estado (activo/inactivo)
- **Botón de Acción Principal**: "Registrar Pago" o "Nueva Operación" (flotante o en header)
- **Botón Volver**: Navegación a lista de socios

**Información de Resumen (Cards en Grid)**:
- **Total en Acciones**: Suma del valor de todas las suscripciones activas
- **Préstamos Activos**: Número y monto total pendiente
- **Cuotas Pendientes**: Monto total de obligaciones en reunión activa
- **Seguro Calculado**: Monto de seguro basado en préstamos y ahorros (con botón para recalcular)

**Diseño Visual**:
```
┌─────────────────────────────────────────────────────────┐
│ [Avatar] Juan Pérez García        [ACTIVO] [Registrar] │
│                                                         │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│ │ Acciones │ │ Préstamos│ │  Cuotas  │ │  Seguro  │  │
│ │ $2.5M    │ │ 2 - $1M  │ │  $150K   │ │  $5K     │  │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 2. Información Personal (Sección Colapsable)

**Ubicación**: Debajo del header, colapsable por defecto

**Contenido**:
- Email
- Identificación
- Teléfono
- Dirección
- Beneficiario
- Fecha de Registro

**Diseño**: Card con iconos, layout de dos columnas en desktop, una en mobile. Botón de edición inline.

### 3. Sistema de Tabs/Navegación Principal

**Ubicación**: Debajo de la información personal

**Tabs Propuestos**:
1. **Resumen Financiero** (Tab por defecto)
2. **Acciones y Suscripciones**
3. **Préstamos**
4. **Pagos y Transacciones**
5. **Cuotas y Obligaciones**
6. **Cronograma de Pagos**
7. **Historial de Operaciones**

**Diseño Visual**: Tabs horizontales con indicador activo, scroll horizontal en mobile.

### 4. Contenido de Cada Tab

#### Tab 1: Resumen Financiero (Dashboard)

**Objetivo**: Vista panorámica del estado financiero del socio

**Secciones**:

**A. Resumen de Acciones (Card)**
- Endpoint: `GET /:id/stock-subscriptions`
- Visualización:
  - Lista de tipos de acciones con cantidad y valor total
  - Gráfico de barras o dona mostrando distribución
  - Total general destacado
  - Botón "Ver Detalle" que expande o navega a tab de Acciones

**B. Préstamos Activos (Card)**
- Endpoint: `GET /:id/loans`
- Visualización:
  - Lista compacta de préstamos con:
    - Tipo de préstamo
    - Monto aprobado vs saldo pendiente
    - Progreso visual (barra de progreso)
    - Próximo pago
  - Botón "Ver Todos" que expande o navega a tab de Préstamos

**C. Cuotas Pendientes (Card)**
- Endpoint: `GET /:id/dues`
- Visualización:
  - Lista de obligaciones con:
    - Tipo (aporte obligatorio, cuota de acciones, pago de préstamo)
    - Monto
    - Descripción
    - Badge de estado
  - Total pendiente destacado
  - Botón "Registrar Pago" que abre modal/formulario

**D. Últimas Transacciones (Card)**
- Endpoint: `GET /:id/payments` (últimos 5)
- Visualización:
  - Tabla compacta con:
    - Fecha
    - Tipo
    - Monto
    - Estado
  - Botón "Ver Historial Completo"

**Diseño**: Grid de 2 columnas en desktop, 1 en mobile. Cards con sombras sutiles y hover effects.

#### Tab 2: Acciones y Suscripciones

**Objetivo**: Gestión y visualización completa del portafolio de acciones

**Secciones**:

**A. Resumen de Suscripciones**
- Endpoint: `GET /:id/stock-subscriptions?includeInactive=false`
- Visualización:
  - Cards por tipo de acción mostrando:
    - Tipo de acción
    - Cantidad total
    - Valor unitario actual (si disponible)
    - Valor total
    - Estado (activo/inactivo)
    - Préstamo asociado (si aplica)
  - Filtros: Activas/Inactivas/Todas

**B. Detalle de Suscripción (Expandible)**
- Al hacer clic en una suscripción:
  - Endpoint: `GET /:id/stock-subscriptions/:subscriptionId`
  - Modal o panel lateral con:
    - Información completa de la suscripción
    - Fecha de compra
    - Historial de modificaciones
    - Préstamo asociado (si aplica)
    - Acciones disponibles (intercambiar, transferir, usar para pago)

**C. Operaciones con Acciones**
- Sub-secciones con tabs internos:
  - **Compras**: `GET /:id/purchase` - Tabla con todas las compras
  - **Intercambios**: `GET /:id/exchange` - Historial de intercambios entre tipos
  - **Transferencias**: `GET /:id/transfer` - Transferencias realizadas/recibidas
  - **Pagos con Acciones**: `GET /:id/stock-loan-payment` - Pagos de préstamos con acciones

**Diseño**: 
- Lista principal con cards expandibles
- Filtros y búsqueda en la parte superior
- Botones de acción contextuales (intercambiar, transferir, etc.)

#### Tab 3: Préstamos

**Objetivo**: Gestión y seguimiento de préstamos del socio

**Secciones**:

**A. Lista de Préstamos**
- Endpoint: `GET /:id/loans`
- Visualización:
  - Cards o tabla con:
    - Tipo de préstamo
    - Monto aprobado
    - Monto desembolsado
    - Saldo pendiente
    - Tasa de interés
    - Plazo
    - Estado
    - Fecha de creación
    - Acciones de acciones garantizadas (si aplica)
  - Filtros: Activos/Cerrados/Todos

**B. Detalle de Préstamo (Expandible)**
- Al hacer clic en un préstamo:
  - Información detallada
  - Cronograma de pagos específico
  - Historial de pagos
  - Acciones disponibles (pagar con acciones, ver detalles)

**C. Cálculo de Seguro**
- Endpoint: `GET /:id/insurance?capitalPayment=0` (opcional)
- Card con:
  - Monto de seguro calculado
  - Input para simular pago de capital
  - Botón "Recalcular"
  - Explicación breve del cálculo

**Diseño**: 
- Lista principal con cards expandibles
- Indicadores visuales de progreso (barras de progreso)
- Colores según estado (verde=activo, gris=cerrado, rojo=vencido)

#### Tab 4: Pagos y Transacciones

**Objetivo**: Historial completo de pagos y transacciones

**Secciones**:

**A. Filtros y Búsqueda**
- Filtro por tipo de pago (dropdown)
- Filtro por reunión (dropdown)
- Rango de fechas
- Búsqueda por descripción

**B. Lista de Pagos**
- Endpoint: `GET /:id/payments?type={type}&meetingId={meetingId}`
- Visualización:
  - Tabla con:
    - Fecha
    - Tipo de pago
    - Descripción
    - Monto total
    - Reunión asociada
    - ID de operación
    - Botón "Ver Detalle" que muestra los asientos contables
  - Paginación o scroll infinito

**C. Detalle de Pago (Modal/Panel)**
- Al hacer clic en "Ver Detalle":
  - Lista de asientos contables (entries)
  - Información de cuentas afectadas
  - Referencias a préstamos, acciones, etc.

**Diseño**: 
- Tabla responsive con ordenamiento
- Filtros persistentes en URL
- Exportación a CSV/Excel (opcional)

#### Tab 5: Cuotas y Obligaciones

**Objetivo**: Visualización de obligaciones pendientes y gestión de pagos

**Secciones**:

**A. Cuotas de Reunión Activa**
- Endpoint: `GET /:id/dues`
- Visualización:
  - Cards agrupados por tipo:
    - **Aportes Obligatorios**: Lista de aportes mensuales
    - **Cuotas de Acciones**: Obligaciones por compras financiadas
    - **Pagos de Préstamos**: Cuotas de préstamos activos
  - Cada item muestra:
    - Descripción
    - Monto
    - Fecha de creación
    - Referencia (ID del préstamo, suscripción, etc.)
    - Detalles adicionales (interés, capital, saldo pendiente)
  - Total general destacado

**B. Acciones**
- Botón "Registrar Pago" que abre modal para:
  - Seleccionar cuotas a pagar
  - Ingresar montos
  - Agregar comentarios de novedad
  - Confirmar y procesar

**Diseño**: 
- Cards agrupados por categoría
- Checkboxes para selección múltiple
- Indicadores visuales de urgencia (colores)

#### Tab 6: Cronograma de Pagos

**Objetivo**: Vista temporal de pagos históricos y proyectados

**Secciones**:

**A. Resumen del Cronograma**
- Endpoint: `GET /:id/payment-schedule?months=12`
- Visualización:
  - Card de resumen con:
    - Total pagado
    - Total pendiente
    - Próxima fecha de pago
    - Monto del próximo pago
    - Saldo total pendiente

**B. Calendario/Timeline**
- Visualización temporal con:
  - **Pagos Históricos**: Lista de pagos realizados
  - **Pagos Proyectados**: Lista de pagos futuros
  - Agrupación por mes
  - Filtro por préstamo específico
  - Selector de meses a proyectar (3, 6, 12, 24)

**C. Detalle de Pago en Cronograma**
- Al hacer clic en un pago:
  - Información detallada
  - Desglose de interés y capital
  - Estado
  - Saldo restante

**Diseño**: 
- Timeline vertical o calendario mensual
- Colores diferenciados (verde=pagado, amarillo=pending, rojo=vencido)
- Gráfico de línea mostrando evolución del saldo

#### Tab 7: Historial de Operaciones

**Objetivo**: Registro completo de todas las operaciones realizadas

**Secciones**:

**A. Operaciones Agrupadas por Tipo**
- **Compras de Acciones**: `GET /:id/purchase`
- **Intercambios**: `GET /:id/exchange`
- **Transferencias**: `GET /:id/transfer`
- **Pagos con Acciones**: `GET /:id/stock-loan-payment`

**B. Visualización Unificada**
- Timeline o tabla con:
  - Fecha
  - Tipo de operación
  - Descripción
  - Montos/Valores
  - Reunión asociada
  - ID de operación
  - Estado

**C. Filtros**
- Por tipo de operación
- Por rango de fechas
- Por reunión
- Búsqueda por descripción

**Diseño**: 
- Timeline visual con iconos por tipo de operación
- Filtros en sidebar o parte superior
- Exportación de reporte

## Componentes Reutilizables Necesarios

1. **Card Component**: Contenedor flexible con header, body y footer
2. **DataTable**: Tabla con ordenamiento, filtros y paginación
3. **Timeline Component**: Visualización temporal de eventos
4. **ProgressBar**: Indicadores de progreso
5. **Badge**: Etiquetas de estado
6. **Modal/Dialog**: Para detalles y formularios
7. **Tabs Component**: Navegación por tabs
8. **FilterBar**: Barra de filtros reutilizable
9. **SummaryCard**: Cards de resumen con iconos y valores
10. **ExpandableSection**: Secciones colapsables

## Estados y Feedback Visual

### Estados de Carga
- Skeleton loaders para cada sección
- Spinner global durante carga inicial
- Loading states individuales por tab

### Estados de Error
- Mensajes de error contextuales
- Retry buttons
- Estados vacíos con ilustraciones y mensajes claros

### Estados de Éxito
- Toasts/notificaciones para acciones completadas
- Animaciones sutiles en actualizaciones
- Confirmaciones visuales

## Interacciones y Flujos

### Flujo Principal: Registrar Pago
1. Usuario hace clic en "Registrar Pago" (header o tab de Cuotas)
2. Modal se abre con formulario
3. Sistema carga cuotas pendientes automáticamente
4. Usuario selecciona cuotas y montos
5. Validación en tiempo real
6. Confirmación con resumen
7. Procesamiento y feedback
8. Actualización automática de la vista

### Flujo: Ver Detalle de Suscripción
1. Usuario hace clic en una suscripción
2. Panel lateral o modal se abre
3. Carga de información detallada
4. Mostrar historial y opciones de acción
5. Acciones contextuales disponibles

### Flujo: Filtrar y Buscar
1. Usuario aplica filtros
2. URL se actualiza con parámetros
3. Datos se recargan automáticamente
4. Estado de filtros persistente

## Responsive Design

### Desktop (>1024px)
- Layout de 2-3 columnas
- Sidebar con información adicional
- Modals centrados
- Hover effects

### Tablet (768px - 1024px)
- Layout de 1-2 columnas
- Tabs horizontales
- Modals a pantalla completa o centrados

### Mobile (<768px)
- Layout de 1 columna
- Tabs con scroll horizontal
- Bottom sheet para modals
- Cards apilados verticalmente
- Navegación simplificada

## Accesibilidad

- Navegación por teclado completa
- ARIA labels en todos los componentes interactivos
- Contraste de colores WCAG AA
- Focus states visibles
- Screen reader friendly
- Textos alternativos en iconos

## Performance

- Lazy loading de tabs no activos
- Paginación o virtual scrolling para listas largas
- Caché de datos con invalidación inteligente
- Debounce en búsquedas y filtros
- Optimistic updates donde sea posible

## Paleta de Colores Sugerida

- **Primario**: Azul (#3498db) - Acciones principales
- **Éxito**: Verde (#27ae60) - Estados positivos, pagos completados
- **Advertencia**: Amarillo (#f39c12) - Pendientes, próximos vencimientos
- **Error**: Rojo (#e74c3c) - Errores, vencidos
- **Neutro**: Gris (#95a5a6) - Información secundaria
- **Fondo**: Blanco/Gris claro (#f8f9fa) - Fondos de cards

## Tipografía

- **Títulos**: Sans-serif bold (H1: 2rem, H2: 1.5rem, H3: 1.25rem)
- **Cuerpo**: Sans-serif regular (1rem)
- **Números**: Monospace para valores monetarios
- **Labels**: Sans-serif medium (0.875rem)

## Espaciado

- Sistema de espaciado consistente (4px, 8px, 16px, 24px, 32px)
- Padding interno de cards: 1.5rem
- Margen entre secciones: 2rem
- Gap en grids: 1rem

## Animaciones y Transiciones

- Transiciones suaves (200-300ms) en hover y cambios de estado
- Fade in para contenido cargado
- Slide animations para modals y paneles
- Micro-interacciones en botones y cards

## Consideraciones Técnicas

### Endpoints a Integrar

1. `GET /v2/members/:id` - Información básica del socio
2. `GET /v2/members/:id/dues` - Cuotas pendientes
3. `GET /v2/members/:id/payments` - Pagos (con filtros)
4. `GET /v2/members/:id/purchase` - Compras de acciones
5. `GET /v2/members/:id/stock-subscriptions` - Suscripciones
6. `GET /v2/members/:id/stock-subscriptions/:subscriptionId` - Detalle de suscripción
7. `GET /v2/members/:id/exchange` - Intercambios
8. `GET /v2/members/:id/transfer` - Transferencias
9. `GET /v2/members/:id/stock-loan-payment` - Pagos con acciones
10. `GET /v2/members/:id/payment-schedule` - Cronograma
11. `GET /v2/members/:id/loans` - Préstamos
12. `GET /v2/members/:id/insurance` - Cálculo de seguro

### Store Management

- Extender `memberDetail` store con:
  - Estado para cada tipo de dato
  - Funciones de fetch para cada endpoint
  - Caché y invalidación
  - Estados de loading individuales

### Manejo de Errores

- Try-catch en cada llamada
- Mensajes de error específicos por tipo
- Retry logic para errores de red
- Fallbacks cuando sea posible

## Métricas de Éxito

- Tiempo de carga inicial < 2 segundos
- Interactividad inmediata (< 100ms)
- Reducción de clics para tareas comunes
- Satisfacción del usuario con la claridad de información
- Reducción de consultas al soporte

## Próximos Pasos de Implementación

1. Crear componentes base reutilizables
2. Implementar store extendido con todos los endpoints
3. Construir cada tab de forma incremental
4. Integrar formularios de acción (pagos, operaciones)
5. Optimizar performance y carga
6. Testing de usabilidad
7. Refinamiento basado en feedback

---

**Nota Final**: Este diseño debe ser iterativo. Comenzar con la implementación básica y refinar basándose en el uso real y feedback de los usuarios. La prioridad es mostrar la información más importante de forma clara y permitir las acciones más comunes de manera eficiente.
