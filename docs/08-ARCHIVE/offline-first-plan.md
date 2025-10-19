# 🧭 Plan de Migración a Arquitectura Local-First para Plataforma de Ahorros

## 🎯 Objetivo

Migrar la plataforma actual (Vue + NestJS + PostgreSQL) hacia un modelo **completamente offline** y **peer-to-peer (P2P)**, garantizando la integridad de los datos financieros, una experiencia de usuario fluida y eliminando la dependencia de un backend centralizado.

---

## ✨ Principios Clave

Antes de detallar las fases, es fundamental establecer los principios que guiarán la arquitectura:

1.  **Determinismo Absoluto**: Toda la lógica de negocio, especialmente los cálculos complejos como la revalorización de activos, debe implementarse como **funciones puras**. Esto asegura que cada nodo, al procesar la misma secuencia de eventos, llegará exactamente al mismo estado, evitando divergencias.
2.  **Fuente Única de Verdad (Eventos)**: El estado completo de la aplicación (saldos, préstamos, valor de acciones) debe ser una proyección reconstruible a partir de un log inmutable de eventos. No se almacenará estado derivado.
3.  **Integridad Criptográfica**: Cada evento debe ser firmado digitalmente por su autor. La validez de los datos se verifica a través de criptografía, no de la confianza en un servidor central.
4.  **Integridad Contable**: El sistema debe garantizar que el libro contable de partida doble (`ledger_entries`) se pueda reconstruir fielmente a partir del historial de eventos. Cada evento de negocio generará sus correspondientes asientos de débito y crédito de forma determinista.

---

## 🧪 Fase 1: Investigación y Selección Tecnológica

### 🔍 Tareas

- **Modelos de Sincronización**:
  - Comparar CRDTs (Yjs, Automerge) vs. Event Sourcing explícito (Logux, Hypercore).
  - Evaluar el impacto en la complejidad y la facilidad para resolver conflictos.

- **Persistencia Local**:
  - Analizar bases de datos embebidas: SQLite (vía Tauri/Capacitor), RxDB, WatermelonDB.
  - Criterios: Rendimiento, soporte para queries complejas y portabilidad.

- **Protocolos P2P**:
  - Investigar opciones: WebRTC, Libp2p, Hypercore-protocol.
  - Considerar mecanismos de descubrimiento de pares y transporte de datos (ej. archivos QR, Bluetooth LE).

- **Criptografía e Identidad**:
  - Librerías para firma digital: `noble-ed25519`, WebCrypto API.
  - **Nuevo**: Investigar modelos de identidad descentralizada (DIDs) y gestión de permisos (roles `admin`, `tesorero`) en un entorno P2P.

- **Análisis de Proyectos Similares**:
  - Revisar arquitecturas de Ink & Switch, Automerge, Manyverse, Yjs para extraer lecciones aprendidas.

### ✅ Resultado Esperado

Un Documento de Decisión de Arquitectura (ADR) que define:
- El modelo de datos y sincronización (CRDT/Event Sourcing).
- La base de datos local seleccionada.
- El protocolo de comunicación P2P.
- El stack criptográfico y el enfoque para la gestión de identidad.

---

## ⚙️ Fase 2: Prueba de Concepto Local-First

### 🔍 Tareas

- **Diseño Detallado del Esquema de Eventos**:
  - Definir la estructura de cada tipo de evento. Ejemplos:
    - `socio_creado`
    - `aporte_obligatorio_registrado`
    - `multa_pagada`
    - `credito_solicitado`, `credito_aprobado`
    - `abono_capital_registrado`, `pago_interes_registrado`
    - `compra_acciones_registrada`
    - `ajuste_configuracion_fondo` (ej. cambio de tasa de interés)
    - `valor_accion_actualizado` (generado por la revalorización)

- **Implementación de Lógica de Negocio Determinista**:
  - Implementar las funciones de negocio clave como **funciones puras** que toman el estado actual y un evento, y devuelven un nuevo estado.
  - **Crítico**: La función de `revalorizarActivos` debe ser determinista, consumiendo eventos de ingresos (intereses, multas) para generar eventos `valor_accion_actualizado`.

- **Generación y Almacenamiento Local**:
  - Implementar la generación de claves criptográficas locales por dispositivo/usuario.
  - Firmar cada evento generado con la clave privada del autor.
  - Guardar el log de eventos firmados en la base de datos embebida seleccionada.

- **Reconstrucción de Estado y Libro Contable**:
  - Implementar la lógica para reconstruir el estado completo de la aplicación (saldos, deudas, etc.) a partir del log de eventos.
  - **Validación**: Asegurar que el libro contable (`ledger_entries`) se reconstruye correctamente, generando los asientos de partida doble para cada evento.

- **Interfaz Mínima (UI)**:
  - Crear una UI en Vue para registrar eventos básicos y consultar el estado reconstruido.

### ✅ Resultado Esperado

Una aplicación funcional *sin conexión* que:
- Permite registrar las operaciones clave del fondo.
- Firma y almacena los eventos de forma segura a nivel local.
- Reconstruye el estado financiero y el libro contable de manera consistente a partir de los eventos.

---

## 🔁 Fase 3: Sincronización Peer-to-Peer

### 🔍 Tareas

- **Implementar Transporte de Eventos**:
  - Elegir un mecanismo inicial (ej. exportar/importar archivo, QR) para intercambiar logs de eventos entre dos nodos.
  - Posteriormente, implementar un protocolo de red como WebRTC o Libp2p.

- **Procesamiento de Eventos Remotos**:
  - Al recibir eventos de un par, validar la firma criptográfica de cada uno.
  - Implementar un mecanismo para detectar y descartar eventos duplicados (idempotencia).
  - Integrar los nuevos eventos válidos en el log local y reconstruir el estado global.

### ✅ Resultado Esperado

Dos o más dispositivos que operan de forma autónoma y pueden:
- Sincronizar sus historiales de eventos directamente.
- Converger al mismo estado, manteniendo la integridad y coherencia de los datos.

---

## 🛠️ Fase 4: Migración de Datos Históricos

### 🔍 Tareas

- **Extracción de Datos**:
  - Extraer todos los registros financieros relevantes desde la base de datos PostgreSQL actual.

- **Conversión a Eventos Firmados**:
  - Escribir un script que convierta los registros tabulares (ej. `loans`, `payments`) en la secuencia de eventos que los originó.
  - **Firma Criptográfica**: Firmar estos eventos históricos con una "clave de génesis" o una clave de administrador especial para establecer una base confiable y verificable del historial.

- **Validación de la Migración**:
  - Poblar la base de datos local de varios nodos con los eventos históricos.
  - Validar que el estado reconstruido en el nuevo sistema coincide exactamente con el estado final del sistema antiguo.

### ✅ Resultado Esperado

Una simulación completa del fondo con datos reales en el nuevo modelo local-first, demostrando compatibilidad y reconstrucción exacta del estado financiero.

---

## 📦 Fase 5: Empaquetado, Distribución y UI Final

### 🔍 Tareas

- **Empaquetado Multiplataforma**:
  - Utilizar Tauri para generar una aplicación de escritorio (Linux/Windows/Mac).
  - Evaluar Capacitor para una posible versión móvil (iOS/Android) si es necesario.

- **Experiencia de Usuario (UX)**:
  - Diseñar una interfaz clara (usando DaisyUI) para la gestión de claves, sincronización y visualización del estado de la red.
  - Proveer múltiples métodos de sincronización accesibles (red local, QR, archivo, USB).

- **Seguridad y Respaldo**:
  - Implementar funciones de respaldo y exportación del log de eventos, preferiblemente encriptado.
  - Facilitar la recuperación de una cuenta en un nuevo dispositivo.

### ✅ Resultado Esperado

Una aplicación de escritorio completa, portable y usable sin conexión, que permite a los usuarios gestionar su fondo de forma segura y sincronizarse con otros miembros sin depender de un servidor central.
---