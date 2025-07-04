# 📘 Documento de Requerimientos - App Fondo de Ahorro Comunitario

---

## 🧭 1. Información general

## 🧭 1. Información general

**Nombre del proyecto:**  
FondoComunitarioApp

**Objetivo del proyecto:**  
Digitalizar la gestión del fondo de ahorro comunitario para facilitar su uso y transparencia entre socios.

**Responsable del proyecto:**  
Fabian Martinez

**Fecha de inicio estimada:**  
2025-07-03

---

## 👥 2. Actores y usuarios

| Actor / Rol        | Descripción | Acciones que puede realizar |
|--------------------|-------------|-----------------------------|
| Administrador      | Responsable de la gestión operativa y financiera del fondo. | - Registrar y gestionar socios.<br/>- Iniciar periodos de recaudo.<br/>- Registrar transacciones de aportes y préstamos.<br/>- Calcular el valor actualizado de la acción.<br/>- Administrar y distribuir los fondos recaudados. |
| Socio              | Miembro activo que participa con aportes y puede solicitar préstamos. | - Consultar su estado de cuenta personal (aportes, saldos, créditos).<br/>- Validar la información registrada por el administrador.<br/>- Consultar de forma transparente los estados de otros socios. |
| Observador (opcional) | Persona con acceso de solo lectura para auditoría o consulta. | - Visualizar resúmenes y estado general del fondo sin poder modificar datos. |

---

## 📌 3. Procesos del fondo (resumen actual)

**¿Cómo funciona hoy el fondo?**  
[Describe el paso a paso de cómo se gestionan aportes, préstamos, reuniones, etc.]

**¿Qué documentos se usan actualmente?**  
[Estatutos, Excel, actas, etc.]

---

## 🧩 4. Requerimientos funcionales (RF)

Describe qué debe poder hacer el sistema. Ejemplo:

| Código | Descripción | Prioridad | Actor involucrado |
|--------|-------------|-----------|-------------------|
| RF01   | **Gestión de Socios:** El sistema debe permitir al Administrador registrar, ver, actualizar y desactivar socios. | Alta      | Administrador     |
| RF02   | **Registro de Aportes:** El sistema debe permitir al Administrador registrar los aportes monetarios de cada socio. | Alta      | Administrador     |
| RF03   | **Cálculo de Acción:** El sistema debe calcular automáticamente el valor de la acción del fondo después de cada periodo de aportes. | Alta      | Sistema           |
| RF04   | **Gestión de Préstamos:** El sistema debe permitir al Administrador registrar solicitudes de préstamo y su estado (aprobado, rechazado, pagado). | Alta      | Administrador     |
| RF05   | **Consulta de Estado Personal:** El sistema debe permitir al Socio consultar el resumen de sus aportes, número de acciones y estado de sus préstamos. | Alta      | Socio             |
| RF06   | **Consulta General Transparente:** El sistema debe permitir a los Socios y Observadores ver un resumen general del fondo y los movimientos de otros socios. | Media     | Socio, Observador |
| RF07   | **Generación de Reportes:** El sistema debe permitir al Administrador generar un acta o resumen mensual descargable (PDF o similar). | Media     | Administrador     |

_Agrega o ajusta según necesites._

---

## ⚙️ 5. Reglas de negocio

A continuación se detallan las reglas que rigen las operaciones del fondo:

**Reglas Generales:**
- Solo los socios activos pueden solicitar préstamos.
- El valor de la acción se recalcula en cada periodo de recaudación (reunión).
- Todos los préstamos deben ser liquidados antes de la distribución final de ahorros en diciembre.

**Reglas por Tipo de Préstamo:**

1.  **Préstamo Corriente:**
    -   **Monto máximo:** No puede exceder el doble del valor que el socio tiene ahorrado en acciones.
    -   **Plazo máximo:** Hasta 80 meses.

2.  **Préstamo Ágil:**
    -   **Plazo máximo:** Hasta 3 meses.
    -   **Condición:** Debe ser pagado en su totalidad antes de la distribución de diciembre.

3.  **Préstamo Prioritario:**
    -   **Condición:** Debe ser pagado en su totalidad antes de la distribución de diciembre.

---

## 🧪 6. Criterios de aceptación

¿Qué debe pasar para que una funcionalidad esté bien implementada?

Ejemplo:

> ✅ Un préstamo solo se aprueba si el socio tiene al menos 3 meses de aportes.

---

## 💬 7. Historias de usuario

Formato:  
**Como [tipo de usuario] quiero [acción] para [beneficio].**

- **Como Administrador,** quiero registrar un nuevo socio con sus datos básicos para mantener un listado actualizado de los miembros del fondo.
- **Como Administrador,** quiero registrar los aportes de cada socio en un periodo de recaudo para llevar un control financiero preciso.
- **Como Administrador,** quiero iniciar el cálculo del valor de la acción después de un recaudo para que el sistema refleje su valor actualizado automáticamente.
- **Como Administrador,** quiero registrar una solicitud de préstamo de tipo "Corriente" para un socio, asegurando que no exceda el doble de sus ahorros, para cumplir con las reglas del fondo.
- **Como Socia,** quiero consultar mi perfil para ver el total de mis aportes y el número de acciones que poseo.
- **Como Socio,** quiero ver un historial de mis transacciones para tener claridad sobre mis aportes y pagos.
- **Como Socia,** quiero poder ver un resumen de los aportes de todos los socios para asegurar la transparencia del fondo.

---

## 📲 8. Requerimientos no funcionales (RNF)

| Código | Descripción |
|--------|-------------|
| RNF01  | La app debe funcionar correctamente en dispositivos móviles. |
| RNF02  | El sistema debe permitir autenticación segura de los usuarios. |
| RNF03  | Toda la información debe guardarse cifrada en la base de datos. |
| RNF04  | El sistema debe ser fácil de usar para personas no técnicas. |

---

## 🛑 9. Restricciones

- No se debe almacenar información bancaria.
- El sistema debe funcionar inicialmente sin conexión a plataformas externas.
- El acceso a datos debe ser controlado según rol.

---

## 🧾 10. Anexos

- 📄 Estatutos del fondo
- 📊 Archivo Excel actual
- 📑 Actas de reuniones

---

## ✍️ Notas y observaciones

[Espacio libre para ideas, riesgos, preguntas por resolver, etc.]