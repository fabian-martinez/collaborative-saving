#!/bin/bash

# Script para desplegar backend y app en modo desarrollo
# Development deployment script for backend and app

set -e  # Exit on any error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes con colores
print_message() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Determinar el modo de ejecución según argumentos
TARGET_COMMAND="dev"
RUN_MODE="los 3 servicios (Backend + Web App + Mobile App)"

case "$1" in
    --web)
        TARGET_COMMAND="dev:web"
        RUN_MODE="Backend + Web App"
        ;;
    --backend)
        TARGET_COMMAND="dev:backend"
        RUN_MODE="solo Backend"
        ;;
    --mobile)
        TARGET_COMMAND="dev:mobile"
        RUN_MODE="solo Mobile App"
        ;;
    --help|-h)
        echo "Uso: ./dev-deploy.sh [OPCIÓN]"
        echo ""
        echo "Opciones:"
        echo "  (sin opción)   Inicia los 3 servicios (Backend, Web App y Mobile App)"
        echo "  --web          Inicia solo Backend y Web App"
        echo "  --mobile       Inicia solo Mobile App"
        echo "  --backend      Inicia solo Backend"
        echo "  --help, -h     Muestra esta ayuda"
        exit 0
        ;;
    "")
        ;;
    *)
        print_error "Opción no reconocida: $1"
        echo "Usa ./dev-deploy.sh --help para ver las opciones disponibles."
        exit 1
        ;;
esac

print_message "🚀 Iniciando despliegue en modo desarrollo ($RUN_MODE)..."
print_message "📁 Directorio del proyecto: $(pwd)"

# Verificar que estamos en el directorio correcto
if [ ! -d "frontend-v2" ] || [ ! -d "backend" ] || [ ! -d "frontend-mobile" ]; then
    print_error "No se encontraron los directorios 'frontend-v2', 'backend' y 'frontend-mobile'. Asegúrate de ejecutar este script desde la raíz del proyecto."
    exit 1
fi

# Verificar que Node.js esté instalado
if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado. Por favor instala Node.js primero."
    exit 1
fi

# Verificar que npm esté instalado
if ! command -v npm &> /dev/null; then
    print_error "npm no está instalado. Por favor instala npm primero."
    exit 1
fi

print_message "📦 Verificando e instalando dependencias..."

# Instalar dependencias si es necesario
if [ ! -d "node_modules" ] || [ ! -d "backend/node_modules" ] || [ ! -d "frontend-v2/node_modules" ] || [ ! -d "frontend-mobile/node_modules" ]; then
    print_message "📦 Instalando dependencias en todos los proyectos..."
    npm run install:all
    print_success "✅ Todas las dependencias instaladas"
else
    print_message "✅ Todas las dependencias ya están instaladas"
fi

# Asegurar configuración de entorno para frontend-mobile si falta
if [ ! -f "frontend-mobile/.env.local" ] && [ ! -f "frontend-mobile/.env" ]; then
    if [ -f "frontend-v2/.env.local" ]; then
        print_message "⚙️ Configurando variables de entorno para frontend-mobile a partir de frontend-v2..."
        cp frontend-v2/.env.local frontend-mobile/.env.local
    elif [ -f "frontend-mobile/.env.example" ]; then
        print_message "⚙️ Copiando .env.example para frontend-mobile..."
        cp frontend-mobile/.env.example frontend-mobile/.env.local
    fi
fi

print_success "🎉 ¡Iniciando $RUN_MODE en modo desarrollo!"
print_message ""
print_message "📋 URLs disponibles:"
print_message "   🖥️  Backend (NestJS):        http://localhost:3000"
print_message "   📚 Swagger API Docs:        http://localhost:3000/api"
print_message "   🌐 Web App (Vue.js):        http://localhost:5174 (o http://localhost:5173)"
print_message "   📱 Mobile App (Vue.js):     http://localhost:5175 (Red local: http://$(ipconfig getifaddr en0 2>/dev/null || echo 'tu-ip-local'):5175)"
print_message ""
print_message "💡 Para detener los servicios, presiona Ctrl+C"
print_message "📝 Los logs aparecerán a continuación:"
print_message ""

# Iniciar servicios seleccionados
npm run $TARGET_COMMAND