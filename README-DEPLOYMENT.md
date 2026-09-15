# 🚀 Script de Despliegue en Desarrollo

Este script te permite desplegar el backend, la aplicación frontend web y la aplicación frontend móvil en modo desarrollo de manera simultánea o individual.

## 📋 Requisitos Previos

- Node.js (versión 18 o superior)
- npm
- Proyecto con estructura:
  ```
  collaborative-saving/
  ├── frontend-v2/      # Frontend Web (Vue.js + Vite)
  ├── frontend-mobile/  # Frontend Móvil (Vue.js + Vite)
  ├── backend/          # Backend (NestJS)
  └── package.json      # Configuración raíz
  ```

## 🛠️ Uso

### Opción 1: Usar el script bash (Recomendado)

```bash
# Hacer el script ejecutable (solo la primera vez)
chmod +x dev-deploy.sh

# Iniciar los 3 servicios simultáneamente (Backend + Web + Móvil)
./dev-deploy.sh

# Opciones adicionales:
./dev-deploy.sh --web      # Solo Backend + Web
./dev-deploy.sh --mobile   # Solo Mobile App
./dev-deploy.sh --backend  # Solo Backend
./dev-deploy.sh --help     # Ver ayuda
```

### Opción 2: Usar npm directamente

```bash
# Instalar todas las dependencias
npm run install:all

# Iniciar los 3 servicios en desarrollo
npm run dev

# Iniciar solo web y backend
npm run dev:web

# Iniciar servicios específicos
npm run dev:backend
npm run dev:app
npm run dev:mobile
```

## 📝 Scripts Disponibles

| Script | Descripción |
|---|---|
| `npm run dev` | Inicia los 3 servicios (backend, web y móvil) en paralelo |
| `npm run dev:all` | Alias de `npm run dev` |
| `npm run dev:web` | Inicia backend y frontend web |
| `npm run dev:backend` | Solo inicia el backend en modo desarrollo |
| `npm run dev:app` | Solo inicia la app web en modo desarrollo |
| `npm run dev:mobile` | Solo inicia la app móvil en modo desarrollo |
| `npm run install:all` | Instala dependencias de todos los proyectos |
| `npm run build` | Construye los 3 proyectos para producción |
| `npm run start` | Inicia los 3 servicios en modo producción |

## 🌐 URLs de Acceso

Una vez ejecutado el script, los servicios estarán disponibles en:

- **Backend (NestJS)**: [http://localhost:3000](http://localhost:3000)
- **Swagger API Docs**: [http://localhost:3000/api](http://localhost:3000/api)
- **Frontend Web (Vue.js)**: [http://localhost:5174](http://localhost:5174) (o `:5173`)
- **Frontend Móvil (Vue.js)**: [http://localhost:5175](http://localhost:5175) (y en tu red local vía IP para probar en celular)

## 🛑 Detener los Servicios

Para detener los servicios, presiona `Ctrl+C` en la terminal donde se ejecutó el script.

## 🔧 Características del Script

- ✅ Verificación automática de dependencias de los 3 proyectos
- ✅ Instalación automática de dependencias faltantes
- ✅ Auto-configuración de entorno para mobile a partir de web si no existe
- ✅ Parámetros opcionales para desplegar servicios individuales (`--web`, `--mobile`, `--backend`)
- ✅ Manejo de errores y mensajes informativos con colores
- ✅ Ejecución en paralelo de los servicios
- ✅ Limpieza automática al salir

## 🐛 Solución de Problemas

### Error: "No se encontraron los directorios 'frontend-v2', 'backend' y 'frontend-mobile'"
- Asegúrate de ejecutar el script desde la raíz del proyecto

### Error: "Node.js no está instalado"
- Instala Node.js desde [nodejs.org](https://nodejs.org/)

### Error: "npm no está instalado"
- npm viene incluido con Node.js, reinstala Node.js si es necesario

### Los servicios no inician
- Verifica que los puertos 3000, 5174/5173 y 5175 estén disponibles
- Revisa los logs en la terminal para más detalles

## 📚 Estructura del Proyecto

```
collaborative-saving/
├── frontend-v2/           # Frontend Web (Vue.js)
├── frontend-mobile/       # Frontend Móvil (Vue.js)
├── backend/               # Backend NestJS
├── package.json           # Configuración raíz
├── dev-deploy.sh         # Script de despliegue
└── README-DEPLOYMENT.md  # Esta documentación
```