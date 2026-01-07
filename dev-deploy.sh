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

print_message "🚀 Iniciando despliegue en modo desarrollo..."
print_message "📁 Directorio del proyecto: $(pwd)"

# Verificar que estamos en el directorio correcto
if [ ! -d "frontend-v2" ] || [ ! -d "backend" ]; then
    print_error "No se encontraron los directorios 'frontend-v2' y 'backend'. Asegúrate de ejecutar este script desde la raíz del proyecto."
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
if [ ! -d "node_modules" ] || [ ! -d "backend/node_modules" ] || [ ! -d "frontend-v2/node_modules" ]; then
    print_message "📦 Instalando dependencias..."
    npm run install:all
    print_success "✅ Todas las dependencias instaladas"
else
    print_message "✅ Todas las dependencias ya están instaladas"
fi

print_success "🎉 ¡Iniciando servicios en modo desarrollo!"
print_message ""
print_message "📋 Servicios que se iniciarán:"
print_message "   🖥️  Backend (NestJS): http://localhost:3000"
print_message "   🌐 App (Vue.js): http://localhost:5173"
print_message ""
print_message "💡 Para detener los servicios, presiona Ctrl+C"
print_message "📝 Los logs de ambos servicios aparecerán a continuación:"
print_message ""

# Iniciar ambos servicios en paralelo usando npm-run-all
npm run dev