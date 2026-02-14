# Flujo de Trabajo con Notion

## ✅ Configuración Establecida

### Frecuencia de Revisión
- **Cada 3 días** - Actualizaré el estado de las tareas y agregaré comentarios en Notion

### Canal de Comunicación
- **Comentarios en Notion** - Todas las actualizaciones, preguntas y decisiones se documentarán como comentarios en las tareas correspondientes

### Base de Datos
- **Nombre:** Roadmap - Tareas del Proyecto
- **URL:** https://www.notion.so/040f52b94bc5405caccb5f4a5b53cd5b
- **Total de tareas:** 19 (Corto: 9, Mediano: 5, Largo: 6)

## 🔄 Proceso de Trabajo

### Cuando inicio una tarea:
1. Cambio estado a "En Progreso" en Notion
2. Agrego comentario inicial con el enfoque técnico
3. Creo rama Git: `feature/notion-[task-id]-[nombre]`

### Durante el desarrollo:
1. Agrego comentarios con decisiones importantes (💡)
2. Marco bloqueos con 🚧 si los hay
3. Hago commits referenciando el ID de Notion

### Al completar:
1. Verifico criterios de aceptación
2. Agrego comentario ✅ con resumen de lo implementado
3. Cambio estado a "Completado"

### Cada 3 días:
1. Reviso todas las tareas activas
2. Actualizo estados y progreso
3. Agrego comentarios con el status
4. Identifico próximos pasos

## 📅 Calendario de Revisiones

- **Primera revisión:** 16 de febrero de 2026
- **Frecuencia:** Cada 3 días
- **Método:** Comentarios en Notion

## 📝 Convenciones

### Emojis en Comentarios
- 🚀 Inicio de tarea
- 💡 Decisión técnica
- 🤔 Pregunta/Duda
- 🚧 Bloqueo
- ✅ Completado
- 📅 Revisión periódica

### Formato de Commits
```
feat(notion-[id]): Descripción breve

- Detalle 1
- Detalle 2

Notion: [URL de la tarea]
```
