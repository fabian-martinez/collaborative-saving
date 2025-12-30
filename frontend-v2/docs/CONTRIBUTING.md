# Guía de Contribución

## Introducción

Esta guía explica el proceso de contribución al proyecto, incluyendo workflow de Git, code review y pull requests.

## Proceso de Contribución

### 1. Fork y Clone

```bash
# Fork el repositorio en GitHub
# Luego clonar tu fork
git clone https://github.com/tu-usuario/collaborative-saving.git
cd collaborative-saving/frontend-v2
```

### 2. Crear Branch

```bash
# Crear branch desde main
git checkout main
git pull origin main
git checkout -b feature/nombre-feature
```

### 3. Desarrollo

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Hacer cambios
# ...

# Verificar que compila
npm run build

# Verificar lint
npm run lint
```

### 4. Commit

```bash
# Formato: tipo(scope): descripción
git commit -m "feat(members): add member creation form"
git commit -m "fix(api): handle 404 errors correctly"
git commit -m "refactor(stores): simplify member store"
```

### 5. Push y Pull Request

```bash
git push origin feature/nombre-feature
# Crear PR en GitHub
```

## Convenciones de Commits

### Formato

```
tipo(scope): descripción

[body opcional]

[footer opcional]
```

### Tipos

- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `refactor`: Refactorización de código
- `docs`: Cambios en documentación
- `style`: Formato, punto y coma, etc. (no afecta código)
- `test`: Agregar o modificar tests
- `chore`: Tareas de mantenimiento

### Scope

Scope opcional que indica el área afectada:

- `members`: Feature de miembros
- `meetings`: Feature de reuniones
- `api`: API clients
- `stores`: Stores de Pinia
- `components`: Componentes
- `styles`: Estilos

### Ejemplos

```bash
feat(members): add member detail view
fix(api): handle network errors in members API
refactor(stores): simplify dashboard store
docs(readme): update setup instructions
style(components): fix button spacing
test(stores): add tests for members store
chore(deps): update dependencies
```

## Branch Naming

### Convenciones

```bash
feature/nombre-feature    # Nueva funcionalidad
fix/nombre-fix            # Corrección de bug
refactor/nombre-refactor  # Refactorización
docs/nombre-docs          # Documentación
```

### Ejemplos

```bash
feature/member-detail-view
fix/api-error-handling
refactor/dashboard-store
docs/api-guide
```

## Pull Request Process

### Antes de Abrir PR

- [ ] Código compila sin errores (`npm run build`)
- [ ] Lint pasa (`npm run lint`)
- [ ] Cambios probados manualmente
- [ ] Documentación actualizada (si aplica)
- [ ] Commits siguen convenciones

### Título del PR

```
[frontend-v2] tipo: descripción
```

Ejemplos:
```
[frontend-v2] feat: add member detail view
[frontend-v2] fix: handle API errors correctly
[frontend-v2] refactor: simplify dashboard store
```

### Descripción del PR

Incluir:
- **Qué**: Qué cambia este PR
- **Por qué**: Razón del cambio
- **Cómo**: Cómo se implementó
- **Testing**: Cómo se probó

**Template:**
```markdown
## Descripción
Breve descripción de los cambios.

## Tipo de Cambio
- [ ] Nueva funcionalidad
- [ ] Corrección de bug
- [ ] Refactorización
- [ ] Documentación

## Cambios
- Cambio 1
- Cambio 2

## Testing
- [ ] Probado manualmente
- [ ] No rompe funcionalidad existente

## Screenshots (si aplica)
[Agregar screenshots si hay cambios de UI]
```

## Code Review Guidelines

### Para el Autor

- Mantener PRs pequeños y enfocados
- Responder a comentarios
- Hacer cambios solicitados
- Agregar tests si es necesario

### Para el Revisor

- Ser constructivo y respetuoso
- Explicar el "por qué" de sugerencias
- Aprobar cuando esté listo
- Pedir cambios cuando sea necesario

### Criterios de Aprobación

- [ ] Código sigue convenciones
- [ ] Funcionalidad funciona correctamente
- [ ] No rompe funcionalidad existente
- [ ] Documentación actualizada
- [ ] Tests pasan (si aplica)
- [ ] Performance aceptable

## Checklist Antes de PR

### Código

- [ ] Compila sin errores
- [ ] Lint pasa
- [ ] TypeScript sin errores
- [ ] Sin console.logs de debug
- [ ] Sin código comentado

### Funcionalidad

- [ ] Funciona como se espera
- [ ] Maneja errores correctamente
- [ ] Estados de loading funcionan
- [ ] Responsive funciona
- [ ] No hay errores en consola

### Documentación

- [ ] README actualizado (si aplica)
- [ ] Comentarios en código complejo
- [ ] Documentación de desarrollo actualizada (si aplica)

## Tamaño de PRs

### Ideal

- **Pequeño y enfocado**: Una feature o fix por PR
- **Fácil de revisar**: < 400 líneas de cambios
- **Completo**: Funcionalidad completa, no parcial

### Evitar

- PRs muy grandes (> 1000 líneas)
- Múltiples features no relacionadas
- Mezclar refactors con features

## Conflictos

### Resolver Conflictos

```bash
# Actualizar branch
git checkout main
git pull origin main

# Rebase tu branch
git checkout feature/tu-feature
git rebase main

# Resolver conflictos
# ...

# Continuar rebase
git rebase --continue

# Force push (solo en tu fork)
git push origin feature/tu-feature --force-with-lease
```

## Referencias

- [Checklist de Implementación](./IMPLEMENTATION_CHECKLIST.md)
- [Convenciones de Código](./CODING_CONVENTIONS.md)

