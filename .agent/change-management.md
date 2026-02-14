# Gestión de Cambios: Antigravity + Notion

## 🔄 Flujo de Trabajo Integrado

### 1. Inicio de Funcionalidad (En Notion)

**Paso 1: Crear Tarea desde Template**
- Usar template "Funcionalidad Nueva" (ver sección Templates)
- Completar todos los campos requeridos
- Estado inicial: "No Iniciado"

**Paso 2: Priorización**
- Asignar Prioridad (Alta/Media/Baja)
- Asignar Fase (Corto/Mediano/Largo Plazo)
- Verificar dependencias

### 2. Desarrollo (Antigravity + Notion)

**Cuando Antigravity inicia una tarea:**
```
1. Cambiar estado en Notion → "En Progreso"
2. Agregar comentario inicial con enfoque técnico
3. Crear rama Git: feature/[notion-task-id]-[nombre-corto]
4. Agregar enlace de rama en comentario de Notion
```

**Durante el desarrollo:**
```
1. Decisiones técnicas → Comentario en Notion con 💡
2. Preguntas/Bloqueos → Comentario en Notion con 🤔 o 🚧
3. Commits → Mensaje referenciando ID de tarea Notion
```

**Al completar:**
```
1. Verificar criterios de aceptación
2. Crear PR y enlazarlo en Notion
3. Agregar comentario ✅ con resumen
4. Cambiar estado → "Completado" (solo después de merge)
```

### 3. Revisión (Cada 3 días)

**Antigravity ejecuta:**
- Actualizar estado de todas las tareas activas
- Agregar comentarios de progreso
- Marcar bloqueos si los hay
- Notificar en Notion (no en chat)

---

## 📋 Templates de Notion

### Template 1: Funcionalidad Nueva

**Campos Obligatorios:**
```
Tarea: [Nombre descriptivo]
Tipo: [Backend/Frontend/DevOps/Diseño]
Fase: [Corto/Mediano/Largo Plazo]
Prioridad: [Alta/Media/Baja]
Estado: No Iniciado
```

**Contenido del Template:**
```markdown
## 🎯 Objetivo
[Descripción breve de qué resuelve esta funcionalidad]

## 📝 Descripción Técnica
[Detalles de implementación, tecnologías, patrones]

## 🔗 Dependencias
- [ ] Tarea 1 (enlazar página de Notion)
- [ ] Tarea 2 (enlazar página de Notion)

## 📂 Archivos Involucrados
- `ruta/al/archivo1.ts` (nuevo/modificar/eliminar)
- `ruta/al/archivo2.ts` (nuevo/modificar/eliminar)

## ✅ Criterios de Aceptación
- [ ] Criterio 1
- [ ] Criterio 2
- [ ] Criterio 3

## 🧪 Plan de Pruebas
### Tests Unitarios
- [ ] Test caso 1
- [ ] Test caso 2

### Tests de Integración
- [ ] Test integración 1

### Verificación Manual
- [ ] Paso 1
- [ ] Paso 2

## 🚧 Riesgos/Consideraciones
[Posibles problemas, impactos, migraciones necesarias]

## 📚 Referencias
- [Enlace a documentación]
- [Enlace a diseño/mockup]
```

### Template 2: Bug/Corrección

**Campos Obligatorios:**
```
Tarea: [BUG] [Descripción corta]
Tipo: [Backend/Frontend]
Prioridad: [Alta/Media/Baja]
Estado: No Iniciado
```

**Contenido del Template:**
```markdown
## 🐛 Descripción del Bug
[Qué está fallando actualmente]

## 🔍 Pasos para Reproducir
1. Paso 1
2. Paso 2
3. Resultado esperado vs actual

## 💡 Causa Raíz
[Análisis de por qué ocurre]

## 🔧 Solución Propuesta
[Cómo se va a resolver]

## ✅ Criterios de Aceptación
- [ ] Bug no se reproduce
- [ ] Tests agregados para prevenir regresión
- [ ] Casos edge cubiertos

## 📂 Archivos Afectados
- `ruta/al/archivo.ts`
```

### Template 3: Refactorización

**Contenido del Template:**
```markdown
## 🎯 Objetivo de la Refactorización
[Por qué es necesaria: deuda técnica, performance, mantenibilidad]

## 📊 Estado Actual
[Descripción del código/arquitectura actual]

## 🚀 Estado Deseado
[Cómo debería quedar después]

## ✅ Criterios de Aceptación
- [ ] Funcionalidad existente no se rompe
- [ ] Tests pasan sin cambios
- [ ] Mejora medible (performance, líneas de código, etc.)

## 🧪 Estrategia de Testing
[Cómo garantizar que no se rompe nada]
```

---

## 🔧 Comandos de Git Integrados

**Formato de commits:**
```bash
git commit -m "feat(notion-307e30f2): Implementar entidades dinámicas

- Crear LoanType y StockType entities
- Agregar repositorios TypeORM
- Crear migración inicial

Notion: https://notion.so/307e30f2e5638114942ede3bbfe7aa31"
```

**Formato de ramas:**
```bash
git checkout -b feature/notion-307e30f2-dynamic-entities
```

---

## 📊 Métricas de Seguimiento

**En cada revisión (cada 3 días), reportar en Notion:**
- Tareas completadas desde última revisión
- Tareas en progreso (con % estimado)
- Bloqueos identificados
- Próximas tareas a iniciar

**Formato de comentario de revisión:**
```markdown
📅 Revisión [Fecha]

✅ Completadas: 2
🔄 En Progreso: 1 (60% estimado)
🚧 Bloqueadas: 0

Próximos pasos:
- Iniciar tarea X
- Resolver bloqueo en tarea Y
```

---

## 🎨 Cómo Crear los Templates en Notion

1. Abrir la base de datos "Roadmap - Tareas del Proyecto"
2. Click en "⋮" (menú) → "New template"
3. Nombrar template: "Funcionalidad Nueva"
4. Copiar contenido del Template 1
5. Repetir para Template 2 y 3

**Uso del template:**
- Click en "New" → Seleccionar template
- Completar campos
- Guardar
