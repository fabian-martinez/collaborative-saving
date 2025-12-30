# Collaborative Saving - Frontend V2

Frontend nuevo para Collaborative Saving usando solo API V2.

## Setup

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
```bash
cp .env.example .env.local
```

Editar `.env.local` con la URL del backend:
```
VITE_API_URL=http://localhost:3000
VITE_API_VERSION=v2
```

3. Ejecutar en desarrollo:
```bash
npm run dev
```

4. Compilar para producción:
```bash
npm run build
```

## Estructura del Proyecto

- `src/api/` - Clientes API para cada módulo (V2)
- `src/features/` - Features organizadas por dominio
- `src/shared/` - Componentes, composables y utilidades compartidas
- `src/router/` - Configuración de rutas con lazy loading

## Características

- Vue 3 + TypeScript
- Pinia para estado global
- Vue Router con lazy loading
- Trabaja directamente con snake_case (sin normalización)
- Cliente API tipado con TypeScript
- Componentes reutilizables

## Endpoints Disponibles

- Members: `/v2/members/*`
- Meetings: `/v2/meetings/*`
- Loans: `/v2/loans/*`
- Stocks: `/v2/stocks/*`
- Contributions: `/v2/mandatory-contributions/*`
- Ledger: `/ledger-entries/*` (sin V2)

