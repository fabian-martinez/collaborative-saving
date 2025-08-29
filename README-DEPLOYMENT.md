# 🚀 Script de Despliegue en Desarrollo

Este script te permite desplegar tanto el backend como la aplicación frontend en modo desarrollo de manera simultánea.

## 📋 Requisitos Previos

- Node.js (versión 18 o superior)
- npm
- Proyecto con estructura:
  ```
  collaborative-saving/
  ├── app/          # Frontend (Vue.js + Vite)
  ├── backend/      # Backend (NestJS)
  └── package.json  # Configuración raíz
  ```

## 🛠️ Uso

### Opción 1: Usar el script bash (Recomendado)

```bash
# Hacer el script ejecutable (solo la primera vez)
chmod +x dev-deploy.sh

# Ejecutar el script
./dev-deploy.sh
```

### Opción 2: Usar npm directamente

```bash
# Instalar todas las dependencias
npm run install:all

# Iniciar ambos servicios en desarrollo
npm run dev
```

## 📝 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia backend y app en modo desarrollo |
| `npm run dev:backend` | Solo inicia el backend en modo desarrollo |
| `npm run dev:app` | Solo inicia la app en modo desarrollo |
| `npm run install:all` | Instala dependencias de todos los proyectos |
| `npm run build` | Construye ambos proyectos para producción |
| `npm run start` | Inicia ambos servicios en modo producción |

## 🌐 URLs de Acceso

Una vez ejecutado el script, los servicios estarán disponibles en:

- **Backend (NestJS)**: http://localhost:3000
- **Frontend (Vue.js)**: http://localhost:5173

## 🛑 Detener los Servicios

Para detener ambos servicios, presiona `Ctrl+C` en la terminal donde se ejecutó el script.

## 🔧 Características del Script

- ✅ Verificación automática de dependencias
- ✅ Instalación automática de dependencias faltantes
- ✅ Manejo de errores
- ✅ Mensajes informativos con colores
- ✅ Ejecución en paralelo de ambos servicios
- ✅ Limpieza automática al salir

## 🐛 Solución de Problemas

### Error: "No se encontraron los directorios 'app' y 'backend'"
- Asegúrate de ejecutar el script desde la raíz del proyecto

### Error: "Node.js no está instalado"
- Instala Node.js desde [nodejs.org](https://nodejs.org/)

### Error: "npm no está instalado"
- npm viene incluido con Node.js, reinstala Node.js si es necesario

### Los servicios no inician
- Verifica que los puertos 3000 y 5173 estén disponibles
- Revisa los logs en la terminal para más detalles

## 📚 Estructura del Proyecto

```
collaborative-saving/
├── app/                    # Frontend Vue.js
│   ├── package.json       # Dependencias del frontend
│   └── ...
├── backend/               # Backend NestJS
│   ├── package.json       # Dependencias del backend
│   └── ...
├── package.json           # Configuración raíz
├── dev-deploy.sh         # Script de despliegue
└── README-DEPLOYMENT.md  # Esta documentación
```