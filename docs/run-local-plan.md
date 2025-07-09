# 📋 Plan de Trabajo: Aplicación del Fondo Local con Acceso Multiusuario vía LAN

## 🎯 Objetivo
Desarrollar una versión de la aplicación del fondo de ahorro que funcione **100% en local**, con posibilidad de que múltiples usuarios accedan desde sus dispositivos vía navegador, conectados a la **misma red local (WiFi)**, sin depender de internet.

---

## 🧱 Etapas del plan

### 🧪 1. Exploración y diseño (1 semana)

#### Tareas:
- Definir el **dispositivo anfitrión**: laptop, Raspberry Pi, tablet, etc.
- Diseñar flujo de red local: servidor backend + UI accesible por IP.
- Revisar opciones de despliegue local (Docker, servicio del sistema, PM2).
- Diseñar modelo de acceso multiusuario (autenticación local, sesiones).
- Diseñar mecanismos de descubrimiento IP o generación de QR.
- Definir requisitos de seguridad: clave por usuario, cifrado local, etc.

#### Entregables:
- Diagrama de arquitectura local
- Especificaciones del flujo multiusuario
- Lista de tecnologías y librerías a usar

---

### ⚙️ 2. Configuración del entorno local (1–2 semanas)

#### Tareas:
- Crear un servidor **NestJS** que sirva API y frontend (Vue) en la misma máquina.
- Configurar el acceso a la UI desde otros dispositivos (CORS, puertos, etc.).
- Agregar funcionalidad para **detectar la IP local** y generar un **QR** con la URL (`http://192.168.x.x:3000`).
- Preparar base de datos local (SQLite o PostgreSQL embebido).
- Configurar inicio automático del servicio con PM2 o como `systemd service`.

#### Entregables:
- Aplicación funcional corriendo localmente
- QR generado con la IP actual para compartir acceso
- Documentación de instalación y puesta en marcha

---

### 🖥️ 3. Desarrollo de interfaz multiusuario (2–3 semanas)

#### Tareas:
- Adaptar la UI en Vue para múltiples roles (admin, socio).
- Implementar **autenticación local** (PIN o contraseña por usuario).
- Agregar identificación del usuario y persistencia de sesión por navegador.
- Crear vistas para: consulta de saldo, registro de pago, movimientos históricos.

#### Entregables:
- Aplicación web accesible desde dispositivos en LAN
- Control de sesiones por usuario
- Registro de eventos financieros desde múltiples dispositivos

---

### 🔐 4. Seguridad y respaldo (1 semana)

#### Tareas:
- Cifrado de la base de datos local o carpeta de datos (opcional).
- Restricción de acceso por IP/localhost si se desea.
- Agregar opción de exportar/respaldar base de datos o eventos (ej. archivo .json cifrado).
- Validar integridad de los eventos (firma opcional o verificación hash).

#### Entregables:
- Seguridad básica aplicada a datos y red
- Función de backup/exportación local

---

### 🌐 5. Pruebas en red local real (1 semana)

#### Tareas:
- Probar la aplicación en una red WiFi sin internet.
- Simular una reunión real: varios dispositivos accediendo al mismo tiempo.
- Probar desconexiones y recuperación.
- Verificar rendimiento y experiencia de usuario.

#### Entregables:
- Informe de pruebas en campo
- Ajustes a interfaz o comportamiento si es necesario

---

### 📦 6. Empaquetado y despliegue (1 semana)

#### Tareas:
- Empaquetar app para instalar en laptops, Raspberry Pi u otros.
- Crear guía para encender, compartir QR, y usar en reuniones.
- Documentar cómo actualizar, respaldar y migrar datos entre dispositivos.

#### Entregables:
- Instalador o paquete listo para distribución
- Manual de uso sin conexión para administradores del fondo

---

## 🧰 Tecnologías sugeridas

| Área | Tecnología |
|------|------------|
| UI | Vue 3 + Tailwind + Vue Router |
| Backend | NestJS (sirviendo API y frontend) |
| Base de datos | SQLite embebido localmente |
| Networking | Node.js `os.networkInterfaces`, `qrcode` npm |
| Proceso | PM2 o `systemd` para correr como servicio |
| Seguridad | WebCrypto / bcrypt / JWT local |

---

## 🧠 Notas adicionales

- Se puede hacer un **modo “portátil”** para llevar la base de datos entre dispositivos en USB si es necesario.
- A futuro podrías agregar sincronización entre “nodos anfitriones” con exportación/importación de eventos.
- También podrías explorar empaquetar como **Tauri** o **Electron** si se desea un frontend 100% nativo.

---